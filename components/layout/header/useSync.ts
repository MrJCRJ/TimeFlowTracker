import { useState } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useTimerStore } from '@/stores/timerStore';
import { mergeCategories, mergeTimeEntries } from '@/lib/sync/merge-utils';
import type { UserPreferences } from '@/types';

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { categories, setCategories } = useCategoryStore();
  const { timeEntries, setTimeEntries } = useTimerStore();

  const handleSync = async () => {
    setIsSyncing(true);

    try {
      // Verificar se há sessão ativa
      const sessionResponse = await fetch('/api/auth/session');
      if (!sessionResponse.ok) {
        throw new Error('Usuário não autenticado');
      }

      const session = await sessionResponse.json();
      if (!session?.user) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar se há access token do Google
      if (!session.accessToken) {
        throw new Error('Token de acesso do Google não encontrado. Faça login novamente.');
      }

      // Mostrar notificação de início
      useNotificationStore.getState().addNotification({
        type: 'info',
        title: 'Sincronizando',
        message: 'Sincronizando dados entre dispositivos...',
      });

      // 1. Carregar dados do Drive primeiro para fazer merge
      const syncResponse = await fetch('/api/drive/sync', {
        method: 'GET',
      });

      if (!syncResponse.ok) {
        const errorData = await syncResponse.json();
        throw new Error(errorData.error?.message || 'Falha ao carregar dados do Drive');
      }

      const syncData = await syncResponse.json();

      // 2. Fazer merge inteligente dos dados
      let mergedCategories = categories;
      let mergedTimeEntries = timeEntries;
      const mergeStats = {
        categories: { localOnly: 0, remoteOnly: 0, merged: 0, conflicts: 0 },
        timeEntries: { localOnly: 0, remoteOnly: 0, merged: 0, conflicts: 0 },
      };

      if (syncData.success && syncData.data) {
        const {
          categories: driveCategories,
          timeEntries: driveTimeEntries,
          dataDeleted,
          deletedFiles,
        } = syncData.data;

        // Se dados foram deletados no Drive, usar apenas dados locais
        if (dataDeleted && deletedFiles) {
          if (deletedFiles.categoriesDeleted) {
            useNotificationStore.getState().addNotification({
              type: 'info',
              title: 'Sincronizando Categorias',
              message: 'Enviando suas categorias locais para o Drive.',
            });
          }
          if (deletedFiles.timeEntriesDeleted) {
            useNotificationStore.getState().addNotification({
              type: 'info',
              title: 'Sincronizando Registros',
              message: 'Enviando seus registros locais para o Drive.',
            });
          }
        } else {
          // Fazer merge inteligente
          if (driveCategories && driveCategories.length > 0) {
            const categoryMerge = mergeCategories(categories, driveCategories);
            mergedCategories = categoryMerge.merged;
            mergeStats.categories = categoryMerge.stats;

            if (categoryMerge.conflicts.length > 0) {
              console.warn('Conflitos de categoria resolvidos:', categoryMerge.conflicts);
            }
          }

          if (driveTimeEntries && driveTimeEntries.length > 0) {
            const timeEntryMerge = mergeTimeEntries(timeEntries, driveTimeEntries);
            mergedTimeEntries = timeEntryMerge.merged;
            mergeStats.timeEntries = timeEntryMerge.stats;

            if (timeEntryMerge.conflicts.length > 0) {
              console.warn('Conflitos de time entries resolvidos:', timeEntryMerge.conflicts);
            }
          }
        }
      }

      // 3. Enviar dados mesclados de volta para o Drive
      const backupResponse = await fetch('/api/drive/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories: mergedCategories,
          timeEntries: mergedTimeEntries,
          preferences: {
            userId: session.user.id,
            workHours: { start: '09:00', end: '18:00' },
            dailyGoals: {},
            theme: 'system',
            notifications: true,
            autoSync: true,
            syncInterval: 5,
            updatedAt: new Date().toISOString(),
          } as UserPreferences,
        }),
      });

      if (!backupResponse.ok) {
        const errorData = await backupResponse.json();
        throw new Error(errorData.error?.message || 'Falha ao salvar dados no Drive');
      }

      // 4. Atualizar stores locais com dados mesclados
      if (mergedCategories !== categories) {
        setCategories(mergedCategories);
      }
      if (mergedTimeEntries !== timeEntries) {
        setTimeEntries(mergedTimeEntries);
      }

      // 5. Mostrar estatísticas do merge se houver mudanças
      const totalChanges =
        mergeStats.categories.localOnly +
        mergeStats.categories.remoteOnly +
        mergeStats.timeEntries.localOnly +
        mergeStats.timeEntries.remoteOnly;

      if (totalChanges > 0) {
        useNotificationStore.getState().addNotification({
          type: 'success',
          title: 'Sincronização Completa',
          message: `${totalChanges} itens sincronizados entre dispositivos.`,
        });
      } else {
        // Mostrar notificação de sucesso simples
        useNotificationStore.getState().addNotification({
          type: 'success',
          title: 'Sincronizado',
          message: 'Dados estão atualizados em todos os dispositivos.',
        });
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);

      // Mostrar notificação de erro
      useNotificationStore.getState().addNotification({
        type: 'error',
        title: 'Erro na Sincronização',
        message: error instanceof Error ? error.message : 'Erro desconhecido na sincronização',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return { handleSync, isSyncing };
}
