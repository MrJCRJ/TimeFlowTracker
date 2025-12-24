'use client';

import { useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTimerStore } from '@/stores/timerStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { SimpleSyncManager } from '@/lib/sync/simple-sync';
import type { Category, TimeEntry } from '@/types';

/**
 * Hook para sincronização MANUAL com Google Drive
 * Substitui o sistema automático por operações sob demanda
 */
export function useManualSync() {
  const { data: session } = useSession();
  const { addNotification } = useNotificationStore();

  // Estados
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Stores
  const timeEntries = useTimerStore((s) => s.timeEntries);
  const setTimeEntries = useTimerStore((s) => s.setTimeEntries);
  const categories = useCategoryStore((s) => s.categories);
  const setCategories = useCategoryStore((s) => s.setCategories);

  // Instância do sync manager
  const [syncManager] = useState(() => new SimpleSyncManager());

  // Configurar callbacks
  useState(() => {
    if (syncManager) {
      syncManager.configure({
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
      });
    }
  });

  /**
   * Faz backup manual dos dados locais para o Drive
   */
  const backupToDrive = useCallback(async (): Promise<boolean> => {
    if (!session?.accessToken) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Você precisa estar logado para fazer backup',
      });
      return false;
    }

    setIsBackingUp(true);

    try {
      const result = await syncManager.forceUpload();

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Backup Concluído',
          message: 'Seus dados foram salvos no Google Drive',
        });
        return true;
      } else {
        addNotification({
          type: 'error',
          title: 'Erro no Backup',
          message: result.message,
        });
        return false;
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro no Backup',
        message: 'Falha ao salvar dados no Drive',
      });
      return false;
    } finally {
      setIsBackingUp(false);
    }
  }, [session?.accessToken, syncManager, addNotification]);

  /**
   * Restaura dados do Drive (sobrescreve dados locais)
   */
  const restoreFromDrive = useCallback(async (): Promise<boolean> => {
    if (!session?.accessToken) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Você precisa estar logado para restaurar dados',
      });
      return false;
    }

    // Confirmação antes de sobrescrever
    const confirmRestore = window.confirm(
      'ATENÇÃO: Isso irá sobrescrever todos os seus dados locais com os dados do Google Drive. Deseja continuar?'
    );

    if (!confirmRestore) {
      return false;
    }

    setIsRestoring(true);

    try {
      const result = await syncManager.forceDownload();

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Restauração Concluída',
          message: 'Dados restaurados do Google Drive',
        });
        return true;
      } else {
        addNotification({
          type: 'error',
          title: 'Erro na Restauração',
          message: result.message,
        });
        return false;
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro na Restauração',
        message: 'Falha ao carregar dados do Drive',
      });
      return false;
    } finally {
      setIsRestoring(false);
    }
  }, [session?.accessToken, syncManager, addNotification]);

  return {
    backupToDrive,
    restoreFromDrive,
    isBackingUp,
    isRestoring,
  };
}
