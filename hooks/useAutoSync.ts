'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTimerStore } from '@/stores/timerStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useNotificationStore } from '@/stores/notificationStore';

interface SyncConfig {
  autoSync: boolean;
  syncInterval: number; // em minutos
  showNotifications?: boolean; // Se deve mostrar notificações automáticas
  restoreActiveTimer?: boolean; // Se deve restaurar timer ativo da nuvem
}

const DEFAULT_CONFIG: SyncConfig = {
  autoSync: true,
  syncInterval: 5, // 5 minutos
  showNotifications: false, // Por padrão, não mostrar notificações automáticas
  restoreActiveTimer: true, // Por padrão, restaurar timer ativo
};

export function useAutoSync(config: Partial<SyncConfig> = {}) {
  const {
    autoSync,
    syncInterval,
    showNotifications,
    restoreActiveTimer: shouldRestoreTimer,
  } = { ...DEFAULT_CONFIG, ...config };
  const { data: session } = useSession();
  const { addNotification } = useNotificationStore();

  const { timeEntries, activeEntry, isRunning, setTimeEntries, restoreActiveTimer } =
    useTimerStore();
  const { categories, setCategories } = useCategoryStore();

  const lastSyncRef = useRef<Date | null>(null);
  const isSyncingRef = useRef(false);
  const wasRunningRef = useRef(false); // Controle para evitar restaurar timer logo após parar
  const initialLoadDoneRef = useRef(false); // Controle para saber se já fez o carregamento inicial

  // Função para fazer backup no Google Drive
  const syncToCloud = useCallback(async () => {
    if (!session?.accessToken || isSyncingRef.current) return false;

    isSyncingRef.current = true;

    try {
      const response = await fetch('/api/drive/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories,
          timeEntries,
          activeTimer: isRunning ? activeEntry : null,
          syncedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        lastSyncRef.current = new Date();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      return false;
    } finally {
      isSyncingRef.current = false;
    }
  }, [session, categories, timeEntries, activeEntry, isRunning]);

  // Função para carregar do Google Drive
  const syncFromCloud = useCallback(async () => {
    if (!session?.accessToken || isSyncingRef.current) return false;

    isSyncingRef.current = true;

    try {
      const response = await fetch('/api/drive/sync');

      if (!response.ok) {
        return false;
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Atualizar dados locais com dados da nuvem apenas se houver dados reais
        if (data.data.categories && data.data.categories.length > 0) {
          setCategories(data.data.categories);
        }
        if (data.data.timeEntries && data.data.timeEntries.length > 0) {
          setTimeEntries(data.data.timeEntries);
        }

        // Restaurar timer ativo da nuvem APENAS no carregamento inicial
        // e se não havia timer rodando localmente antes
        if (
          shouldRestoreTimer &&
          data.data.preferences?.activeTimer &&
          !isRunning &&
          !wasRunningRef.current && // Não restaurar se o timer acabou de ser parado
          !initialLoadDoneRef.current // Apenas no carregamento inicial
        ) {
          restoreActiveTimer(data.data.preferences.activeTimer);
        }

        // Marcar que o carregamento inicial foi feito
        initialLoadDoneRef.current = true;
        lastSyncRef.current = new Date();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao carregar dados da nuvem:', error);
      return false;
    } finally {
      isSyncingRef.current = false;
    }
  }, [session, setCategories, setTimeEntries, shouldRestoreTimer, isRunning, restoreActiveTimer]);

  // Sincronização automática periódica
  useEffect(() => {
    if (!autoSync || !session?.accessToken) return;

    const intervalMs = syncInterval * 60 * 1000;

    const syncTimer = setInterval(async () => {
      const success = await syncToCloud();
      if (success) {
        console.log('Auto-sync realizado com sucesso');
      }
    }, intervalMs);

    // Sincronização inicial ao carregar
    syncFromCloud().then((success) => {
      if (success) {
        console.log('Dados carregados do Google Drive na inicialização');
        // Só mostrar notificação se configurado para mostrar
        if (showNotifications) {
          addNotification({
            type: 'info',
            title: 'Dados Sincronizados',
            message: 'Seus dados foram carregados do Google Drive',
          });
        }
      }
    });

    return () => clearInterval(syncTimer);
  }, [autoSync, syncInterval, session, syncToCloud, syncFromCloud, addNotification]);

  // Controlar quando o timer muda de estado para evitar restaurações indevidas
  useEffect(() => {
    // Atualizar ref para saber se o timer estava rodando antes
    wasRunningRef.current = isRunning;
  }, [isRunning]);

  // Sincronizar quando o timer parar
  useEffect(() => {
    if (!isRunning && lastSyncRef.current) {
      // Timer acabou de parar, sincronizar imediatamente
      // Marcar que estava rodando para não restaurar da nuvem
      wasRunningRef.current = true;
      syncToCloud();

      // Após um tempo, resetar o flag para permitir restaurações futuras
      setTimeout(() => {
        wasRunningRef.current = false;
      }, 5000); // 5 segundos de proteção
    }
  }, [isRunning, syncToCloud]);

  // Sincronizar quando o timer iniciar
  useEffect(() => {
    if (isRunning && session?.accessToken) {
      // Timer acabou de iniciar, sincronizar para salvar o estado ativo
      // Pequeno delay para não bloquear a UI
      setTimeout(() => syncToCloud(), 500);
    }
  }, [isRunning, session?.accessToken, syncToCloud]);

  // Sincronizar antes de fechar a página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (session?.accessToken) {
        // Usar sendBeacon para sincronização assíncrona
        const data = JSON.stringify({
          categories,
          timeEntries,
          activeTimer: isRunning ? activeEntry : null,
          syncedAt: new Date().toISOString(),
        });

        navigator.sendBeacon('/api/drive/backup', data);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && session?.accessToken) {
        syncToCloud();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, categories, timeEntries, activeEntry, isRunning, syncToCloud]);

  return {
    syncToCloud,
    syncFromCloud,
    lastSync: lastSyncRef.current,
    isSyncing: isSyncingRef.current,
  };
}
