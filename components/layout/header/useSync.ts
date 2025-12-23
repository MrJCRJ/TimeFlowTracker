import { useState } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useTimerStore } from '@/stores/timerStore';
import type { UserPreferences } from '@/types';

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { categories, setCategories, reset: resetCategories } = useCategoryStore();
  const { timeEntries, setTimeEntries, reset: resetTimer } = useTimerStore();

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

      // Mostrar notificação de início (mais discreta)
      useNotificationStore.getState().addNotification({
        type: 'info',
        title: 'Sincronizando',
        message: 'Sincronizando dados...',
      });

      // 1. Primeiro verificar se dados foram deletados no Drive
      const verifyResponse = await fetch('/api/drive/verify');
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        if (verifyData.success && verifyData.data?.anyDeleted) {
          // Dados foram deletados externamente - notificar usuário
          useNotificationStore.getState().addNotification({
            type: 'warning',
            title: 'Dados Deletados',
            message:
              'Alguns dados foram deletados do Google Drive. Seus dados locais serão enviados.',
          });
        }
      }

      // 2. Fazer backup dos dados locais para o Drive
      const backupResponse = await fetch('/api/drive/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories,
          timeEntries,
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
        throw new Error(errorData.error?.message || 'Falha ao fazer backup para o Drive');
      }

      // 3. Carregar dados do Drive
      const syncResponse = await fetch('/api/drive/sync', {
        method: 'GET',
      });

      if (!syncResponse.ok) {
        const errorData = await syncResponse.json();
        throw new Error(errorData.error?.message || 'Falha ao sincronizar dados do Drive');
      }

      const syncData = await syncResponse.json();

      // 4. Verificar se dados foram deletados e atualizar stores locais
      if (syncData.success && syncData.data) {
        const {
          categories: driveCategories,
          timeEntries: driveTimeEntries,
          dataDeleted,
          deletedFiles,
        } = syncData.data;

        // Se dados foram deletados no Drive, avisar e resetar local
        if (dataDeleted && deletedFiles) {
          if (deletedFiles.categoriesDeleted) {
            resetCategories();
            useNotificationStore.getState().addNotification({
              type: 'warning',
              title: 'Categorias Deletadas',
              message: 'As categorias foram deletadas do Google Drive.',
            });
          }
          if (deletedFiles.timeEntriesDeleted) {
            resetTimer();
            useNotificationStore.getState().addNotification({
              type: 'warning',
              title: 'Registros Deletados',
              message: 'Os registros de tempo foram deletados do Google Drive.',
            });
          }
        } else {
          // Atualizar stores com dados do Drive se existirem
          if (driveCategories && driveCategories.length > 0) {
            setCategories(driveCategories);
          }
          if (driveTimeEntries && driveTimeEntries.length > 0) {
            setTimeEntries(driveTimeEntries);
          }
        }

        console.log('Dados sincronizados:', {
          localCategories: categories.length,
          driveCategories: driveCategories?.length || 0,
          localTimeEntries: timeEntries.length,
          driveTimeEntries: driveTimeEntries?.length || 0,
          dataDeleted,
        });
      }

      // Mostrar notificação de sucesso (mais discreta)
      useNotificationStore.getState().addNotification({
        type: 'success',
        title: 'Sincronizado',
        message: 'Dados atualizados com sucesso',
      });
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

  return {
    isSyncing,
    handleSync,
  };
}
