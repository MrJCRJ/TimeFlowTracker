'use client';

import { useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTimerStore } from '@/stores/timerStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useNotificationStore } from '@/stores/notificationStore';
import type { Category, TimeEntry } from '@/types';

/**
 * Hook para sincronização MANUAL com Google Drive
 * Permite fazer backup e restaurar dados manualmente
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
      const response = await fetch('/api/drive/sync/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories,
          timeEntries,
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar dados para o Drive');
      }

      addNotification({
        type: 'success',
        title: 'Backup Concluído',
        message: 'Seus dados foram salvos no Google Drive',
      });
      return true;
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro no Backup',
        message: error instanceof Error ? error.message : 'Falha ao salvar dados no Drive',
      });
      return false;
    } finally {
      setIsBackingUp(false);
    }
  }, [session?.accessToken, categories, timeEntries, addNotification]);

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
      const response = await fetch('/api/drive/sync/download');

      if (!response.ok) {
        throw new Error('Falha ao baixar dados do Drive');
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Atualizar stores com dados do Drive
        if (result.data.categories && result.data.categories.length > 0) {
          setCategories(result.data.categories as Category[]);
        }
        if (result.data.timeEntries && result.data.timeEntries.length > 0) {
          setTimeEntries(result.data.timeEntries as TimeEntry[]);
        }

        addNotification({
          type: 'success',
          title: 'Restauração Concluída',
          message: 'Dados restaurados do Google Drive',
        });
        return true;
      } else {
        addNotification({
          type: 'warning',
          title: 'Nenhum dado encontrado',
          message: 'Não há dados salvos no Google Drive',
        });
        return false;
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro na Restauração',
        message: error instanceof Error ? error.message : 'Falha ao carregar dados do Drive',
      });
      return false;
    } finally {
      setIsRestoring(false);
    }
  }, [session?.accessToken, setCategories, setTimeEntries, addNotification]);

  return {
    backupToDrive,
    restoreFromDrive,
    isBackingUp,
    isRestoring,
  };
}
