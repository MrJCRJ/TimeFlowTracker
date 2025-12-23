'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTimerStore } from '@/stores/timerStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { SyncManager, type SyncResult } from '@/lib/sync';

/**
 * Configurações do hook de sincronização
 */
interface SyncConfig {
  autoSync: boolean;
  syncIntervalMinutes: number; // Intervalo em minutos para sync automático
  debounceMs: number; // Tempo de debounce para mudanças
  throttleMs: number; // Intervalo mínimo entre syncs
  showNotifications: boolean;
  restoreActiveTimer: boolean;
  // Injeção de dependência para testes
  syncManagerInstance?: SyncManager | null;
}

const DEFAULT_CONFIG: SyncConfig = {
  autoSync: true,
  syncIntervalMinutes: 5, // Sync automático a cada 5 minutos
  debounceMs: 5000, // 5 segundos de debounce
  throttleMs: 30000, // Mínimo 30 segundos entre syncs
  showNotifications: false,
  restoreActiveTimer: true,
  syncManagerInstance: null,
};

/**
 * Hook para sincronização automática inteligente
 *
 * Usa o SyncManager para:
 * - Evitar requests desnecessários com hash de dados
 * - Debounce para agrupar mudanças
 * - Throttle para limitar frequência
 * - Suporte a múltiplos dispositivos
 */
export function useAutoSync(config: Partial<SyncConfig> = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const {
    autoSync,
    syncIntervalMinutes,
    debounceMs,
    throttleMs,
    showNotifications,
    restoreActiveTimer: shouldRestoreTimer,
    syncManagerInstance,
  } = mergedConfig;

  const { data: session } = useSession();
  const { addNotification } = useNotificationStore();

  // Stores
  const timeEntries = useTimerStore((s) => s.timeEntries);
  const activeEntry = useTimerStore((s) => s.activeEntry);
  const isRunning = useTimerStore((s) => s.isRunning);
  const setTimeEntries = useTimerStore((s) => s.setTimeEntries);
  const restoreActiveTimer = useTimerStore((s) => s.restoreActiveTimer);
  const categories = useCategoryStore((s) => s.categories);
  const setCategories = useCategoryStore((s) => s.setCategories);

  // Estado local
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Refs para controle
  const syncManagerRef = useRef<SyncManager | null>(syncManagerInstance || null);
  const initialLoadDoneRef = useRef(false);
  const wasRunningRef = useRef(false);
  const prevDataHashRef = useRef<string>('');

  // Inicializa SyncManager
  useEffect(() => {
    // Se foi injetada uma instância para testes, usa ela
    if (syncManagerInstance) {
      syncManagerRef.current = syncManagerInstance;
      return;
    }

    if (!syncManagerRef.current) {
      syncManagerRef.current = new SyncManager({
        debounceMs,
        throttleMs,
        syncIntervalMs: syncIntervalMinutes * 60 * 1000,
      });
    }

    return () => {
      // Não cancela se for instância injetada (deixa para o teste controlar)
      if (!syncManagerInstance) {
        syncManagerRef.current?.cancel();
      }
    };
  }, [debounceMs, throttleMs, syncIntervalMinutes, syncManagerInstance]);

  // Configura SyncManager com callbacks
  useEffect(() => {
    if (!syncManagerRef.current) return;

    syncManagerRef.current.configure({
      getAccessToken: () => session?.accessToken || null,
      getLocalData: () => ({
        categories,
        timeEntries,
        activeTimerId: activeEntry?.id || null,
      }),
      setLocalData: ({ categories: newCategories, timeEntries: newEntries }) => {
        if (newCategories.length > 0 || categories.length === 0) {
          setCategories(newCategories);
        }
        if (newEntries.length > 0 || timeEntries.length === 0) {
          setTimeEntries(newEntries);
        }
      },
      onSyncComplete: (result: SyncResult) => {
        setIsSyncing(false);
        if (result.success && result.direction !== 'none') {
          setLastSync(new Date());
        }
      },
    });
  }, [
    session?.accessToken,
    categories,
    timeEntries,
    activeEntry?.id,
    setCategories,
    setTimeEntries,
  ]);

  // Função para sincronizar para a nuvem
  const syncToCloud = useCallback(async (): Promise<boolean> => {
    if (!syncManagerRef.current || !session?.accessToken) return false;

    setIsSyncing(true);
    const result = await syncManagerRef.current.syncToCloud();
    return result.success;
  }, [session?.accessToken]);

  // Função para sincronizar da nuvem
  const syncFromCloud = useCallback(async (): Promise<boolean> => {
    if (!syncManagerRef.current || !session?.accessToken) return false;

    setIsSyncing(true);
    const result = await syncManagerRef.current.syncFromCloud();

    // Restaurar timer ativo se configurado e é carregamento inicial
    if (
      result.success &&
      shouldRestoreTimer &&
      !initialLoadDoneRef.current &&
      !isRunning &&
      !wasRunningRef.current
    ) {
      // Buscar dados de preferências para restaurar timer
      try {
        const response = await fetch('/api/drive/sync');
        if (response.ok) {
          const data = await response.json();
          if (data.data?.preferences?.activeTimer) {
            restoreActiveTimer(data.data.preferences.activeTimer);
          }
        }
      } catch (error) {
        console.error('[useAutoSync] Erro ao restaurar timer:', error);
      }
    }

    initialLoadDoneRef.current = true;
    return result.success;
  }, [session?.accessToken, shouldRestoreTimer, isRunning, restoreActiveTimer]);

  // Sincronização inicial ao carregar
  useEffect(() => {
    if (!autoSync || !session?.accessToken || initialLoadDoneRef.current) return;

    syncFromCloud().then((success) => {
      if (success && showNotifications) {
        addNotification({
          type: 'info',
          title: 'Dados Sincronizados',
          message: 'Seus dados foram carregados do Google Drive',
        });
      }
    });
  }, [autoSync, session?.accessToken, syncFromCloud, showNotifications, addNotification]);

  // Sync automático periódico
  useEffect(() => {
    if (!autoSync || !session?.accessToken) return;

    const intervalMs = syncIntervalMinutes * 60 * 1000;

    const syncTimer = setInterval(() => {
      console.log('[useAutoSync] Sync automático periódico');
      syncManagerRef.current?.scheduleSync(false);
    }, intervalMs);

    return () => clearInterval(syncTimer);
  }, [autoSync, session?.accessToken, syncIntervalMinutes]);

  // Detectar mudanças nos dados e agendar sync
  useEffect(() => {
    if (!autoSync || !session?.accessToken || !syncManagerRef.current) return;

    // Gera hash simples para detectar mudanças
    const currentHash = JSON.stringify({
      c: categories.length,
      t: timeEntries.length,
      a: activeEntry?.id || '',
    });

    // Só agenda sync se dados realmente mudaram
    if (currentHash !== prevDataHashRef.current) {
      prevDataHashRef.current = currentHash;

      // Usa o SyncManager para agendar com debounce
      syncManagerRef.current.scheduleSync(false);
    }
  }, [categories, timeEntries, activeEntry?.id, autoSync, session?.accessToken]);

  // Controlar mudança de estado do timer
  useEffect(() => {
    const previouslyRunning = wasRunningRef.current;
    wasRunningRef.current = isRunning;

    // Timer acabou de parar
    if (!isRunning && previouslyRunning) {
      console.log('[useAutoSync] Timer parado, agendando sync imediato');
      // Pequeno delay para garantir que o state foi atualizado
      setTimeout(() => {
        syncManagerRef.current?.scheduleSync(true);
      }, 1000);
    }

    // Timer acabou de iniciar
    if (isRunning && !previouslyRunning) {
      console.log('[useAutoSync] Timer iniciado, agendando sync');
      setTimeout(() => {
        syncManagerRef.current?.scheduleSync(true);
      }, 1000);
    }
  }, [isRunning]);

  // Sincronizar ao fechar/esconder página
  useEffect(() => {
    if (!session?.accessToken) return;

    const handleBeforeUnload = () => {
      // Usa sendBeacon para sync assíncrono
      const data = JSON.stringify({
        categories,
        timeEntries,
        preferences: {
          updatedAt: new Date().toISOString(),
          ...(isRunning && activeEntry ? { activeTimer: activeEntry } : {}),
        },
        syncedAt: new Date().toISOString(),
      });

      navigator.sendBeacon('/api/drive/backup', data);
    };

    const handleVisibilityChange = () => {
      // Só sincroniza se página ficar oculta E tiver mudanças pendentes
      if (
        document.visibilityState === 'hidden' &&
        syncManagerRef.current?.getStatus().hasLocalChanges
      ) {
        console.log('[useAutoSync] Página oculta, sincronizando mudanças pendentes');
        syncToCloud();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session?.accessToken, categories, timeEntries, activeEntry, isRunning, syncToCloud]);

  return {
    syncToCloud,
    syncFromCloud,
    lastSync,
    isSyncing,
    getStatus: () => syncManagerRef.current?.getStatus() || null,
  };
}
