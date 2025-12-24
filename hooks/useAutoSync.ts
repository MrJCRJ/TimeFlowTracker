'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTimerStore } from '@/stores/timerStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useNotificationStore } from '@/stores/notificationStore';
import {
  SimpleSyncManager,
  type SimpleSyncResult,
  getLocalUpdatedAt,
} from '@/lib/sync/simple-sync';
import type { Category, TimeEntry } from '@/types';

/**
 * Configurações do hook de sincronização
 */
interface SyncConfig {
  autoSync: boolean;
  syncIntervalMinutes: number; // Intervalo em minutos para sync automático
  showNotifications: boolean;
  restoreActiveTimer: boolean;
  // Injeção de dependência para testes
  syncManagerInstance?: SimpleSyncManager | null;
}

const DEFAULT_CONFIG: SyncConfig = {
  autoSync: true,
  syncIntervalMinutes: 5, // Sync automático a cada 5 minutos
  showNotifications: false,
  restoreActiveTimer: true,
  syncManagerInstance: null,
};

/**
 * Hook para sincronização automática baseada em timestamp
 *
 * Lógica:
 * - Se timestamps iguais → Não faz nada
 * - Se Drive mais recente → Sobrescreve dados locais
 * - Se App mais recente → Atualiza dados no Drive
 */
export function useAutoSync(config: Partial<SyncConfig> = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { autoSync, syncIntervalMinutes, showNotifications, syncManagerInstance } = mergedConfig;

  const { data: session } = useSession();
  const { addNotification } = useNotificationStore();

  // Stores
  const timeEntries = useTimerStore((s) => s.timeEntries);
  const isRunning = useTimerStore((s) => s.isRunning);
  const setTimeEntries = useTimerStore((s) => s.setTimeEntries);
  const categories = useCategoryStore((s) => s.categories);
  const setCategories = useCategoryStore((s) => s.setCategories);

  // Estado local
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Refs para controle
  const syncManagerRef = useRef<SimpleSyncManager | null>(syncManagerInstance || null);
  const initialLoadDoneRef = useRef(false);
  const wasRunningRef = useRef(false);

  // Inicializa SimpleSyncManager
  useEffect(() => {
    // Se foi injetada uma instância para testes, usa ela
    if (syncManagerInstance) {
      syncManagerRef.current = syncManagerInstance;
      return;
    }

    if (!syncManagerRef.current) {
      syncManagerRef.current = new SimpleSyncManager();
    }

    // Configura callbacks
    if (syncManagerRef.current) {
      syncManagerRef.current.configure({
        getAccessToken: () => session?.accessToken || null,
        getLocalData: () => ({
          categories: categories as unknown[],
          timeEntries: timeEntries as unknown[],
        }),
        setLocalData: ({ categories: newCategories, timeEntries: newEntries }) => {
          if (newCategories && newCategories.length > 0) {
            setCategories(newCategories as Category[]);
          }
          if (newEntries && newEntries.length > 0) {
            setTimeEntries(newEntries as TimeEntry[]);
          }
        },
        onSyncStart: () => setIsSyncing(true),
        onSyncComplete: (result: SimpleSyncResult) => {
          setIsSyncing(false);
          if (result.success && result.action !== 'none') {
            setLastSync(new Date());
          }
        },
      });
    }

    return () => {
      // Não cancela se for instância injetada (deixa para o teste controlar)
      if (!syncManagerInstance) {
        // SimpleSyncManager não tem método cancel, apenas reset
        syncManagerRef.current?.reset();
      }
    };
  }, [
    syncManagerInstance,
    session?.accessToken,
    categories,
    timeEntries,
    setCategories,
    setTimeEntries,
  ]);

  // Função para sincronizar (usa a lógica de timestamps do SimpleSyncManager)
  const sync = useCallback(async (): Promise<boolean> => {
    if (!syncManagerRef.current || !session?.accessToken) return false;

    const result = await syncManagerRef.current.sync();
    return result.success;
  }, [session?.accessToken]);

  // Função para forçar upload
  const syncToCloud = useCallback(async (): Promise<boolean> => {
    if (!syncManagerRef.current || !session?.accessToken) return false;

    const result = await syncManagerRef.current.forceUpload();
    return result.success;
  }, [session?.accessToken]);

  // Função para forçar download
  const syncFromCloud = useCallback(async (): Promise<boolean> => {
    if (!syncManagerRef.current || !session?.accessToken) return false;

    const result = await syncManagerRef.current.forceDownload();
    return result.success;
  }, [session?.accessToken]);

  // Sincronização inicial ao carregar
  useEffect(() => {
    if (!autoSync || !session?.accessToken || initialLoadDoneRef.current) return;

    // Verificar se temos dados locais antes de sync
    const hasLocalData = categories.length > 0 || timeEntries.length > 0;
    const hasLocalTimestamp = !!getLocalUpdatedAt();

    // Só fazer sync automático se:
    // 1. Temos dados locais E timestamp (dados reais do usuário)
    // 2. OU não temos dados locais mas temos timestamp (precisa baixar)
    if (hasLocalData && hasLocalTimestamp) {
      console.log('[useAutoSync] Sync inicial: dados locais existentes');
      sync().then((success) => {
        if (success && showNotifications) {
          addNotification({
            type: 'info',
            title: 'Dados Sincronizados',
            message: 'Seus dados foram sincronizados com o Google Drive',
          });
        }
      });
    } else if (!hasLocalData && hasLocalTimestamp) {
      console.log('[useAutoSync] Sync inicial: baixando dados do Drive');
      sync().then((success) => {
        if (success && showNotifications) {
          addNotification({
            type: 'info',
            title: 'Dados Carregados',
            message: 'Seus dados foram carregados do Google Drive',
          });
        }
      });
    } else if (!hasLocalData && !hasLocalTimestamp) {
      console.log('[useAutoSync] Sync inicial: pulado (primeiro uso)');
      // Primeiro uso - não fazer sync automático, deixar usuário decidir
    }

    initialLoadDoneRef.current = true;
  }, [
    autoSync,
    session?.accessToken,
    sync,
    showNotifications,
    addNotification,
    categories.length,
    timeEntries.length,
  ]);

  // Sync automático periódico
  useEffect(() => {
    if (!autoSync || !session?.accessToken) return;

    const intervalMs = syncIntervalMinutes * 60 * 1000;

    const syncTimer = setInterval(() => {
      console.log('[useAutoSync] Sync automático periódico');
      sync();
    }, intervalMs);

    return () => clearInterval(syncTimer);
  }, [autoSync, session?.accessToken, syncIntervalMinutes, sync]);

  // Controlar mudança de estado do timer
  useEffect(() => {
    const previouslyRunning = wasRunningRef.current;
    wasRunningRef.current = isRunning;

    // Timer acabou de parar - força sync
    if (!isRunning && previouslyRunning) {
      console.log('[useAutoSync] Timer parado, forçando sync');
      setTimeout(() => {
        sync();
      }, 1000);
    }

    // Timer acabou de iniciar - força sync
    if (isRunning && !previouslyRunning) {
      console.log('[useAutoSync] Timer iniciado, forçando sync');
      setTimeout(() => {
        sync();
      }, 1000);
    }
  }, [isRunning, sync]);

  return {
    syncToCloud: syncToCloud,
    syncFromCloud: syncFromCloud,
    isSyncing,
    lastSync,
    getStatus: () => ({
      isSyncing,
      lastSyncTime: lastSync?.getTime() || 0,
      queueLength: 0,
      hasLocalChanges: false,
    }),
  };
}
