'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  ProfileSection,
  AppearanceSection,
  NotificationsSection,
  SyncSection,
  DangerZoneSection,
} from '@/components/settings';
import { useCategoryStore } from '@/stores/categoryStore';
import { useTimerStore } from '@/stores/timerStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useTheme } from '@/stores/themeStore';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { categories, reset: resetCategories } = useCategoryStore();
  const { timeEntries, reset: resetTimer } = useTimerStore();
  const { addNotification } = useNotificationStore();
  const { theme, setTheme, isDark } = useTheme();
  const {
    enabled: pushEnabled,
    permission,
    isSupported,
    toggleNotifications,
  } = usePushNotifications();

  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [driveConnected, setDriveConnected] = useState(false);

  // Verificar status da conexão com Google Drive
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkDriveConnection = async () => {
      if (!session?.accessToken) {
        setDriveConnected(false);
        return;
      }

      try {
        const response = await fetch('/api/drive/status');
        const data = await response.json();
        setDriveConnected(data.connected);
        if (data.lastBackup) {
          setLastSync(new Date(data.lastBackup).toLocaleString('pt-BR'));
        }
      } catch (error) {
        console.error('Erro ao verificar status do Drive:', error);
        setDriveConnected(false);
      }
    };

    checkDriveConnection();
  }, [session]);

  const handleClearData = async () => {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
      setIsClearing(true);
      try {
        resetCategories();
        resetTimer();

        const keysToRemove = [
          'timer-storage',
          'timeflow_categories',
          'timeflow_timer_state',
          'timeflow_time_entries',
          'timeflow_preferences',
          'timeflow_sync_metadata',
          'timeflow_theme',
        ];

        keysToRemove.forEach((key) => {
          localStorage.removeItem(key);
        });

        if (session?.accessToken) {
          try {
            await fetch('/api/drive/clear', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
            });
          } catch (driveError) {
            console.warn('Não foi possível limpar dados do Drive:', driveError);
          }
        }

        addNotification({
          type: 'success',
          title: 'Dados limpos',
          message: 'Todos os dados foram removidos com sucesso.',
        });

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (error) {
        console.error('Erro ao limpar dados:', error);
        addNotification({
          type: 'error',
          title: 'Erro ao limpar dados',
          message: 'Ocorreu um erro ao limpar os dados. Tente novamente.',
        });
      } finally {
        setIsClearing(false);
      }
    }
  };

  const handleSyncNow = async () => {
    if (!session) {
      addNotification({
        type: 'error',
        title: 'Erro de autenticação',
        message: 'Você precisa estar logado para sincronizar com o Google Drive.',
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus('idle');

    try {
      const response = await fetch('/api/drive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories, timeEntries }),
      });

      const data = await response.json();

      if (response.ok) {
        setSyncStatus('success');
        setLastSync(new Date().toLocaleString('pt-BR'));
        addNotification({
          type: 'success',
          title: 'Sincronização concluída',
          message: 'Seus dados foram sincronizados com sucesso no Google Drive.',
        });
      } else {
        setSyncStatus('error');
        addNotification({
          type: 'error',
          title: 'Erro na sincronização',
          message: data.error || 'Ocorreu um erro ao sincronizar os dados.',
        });
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      setSyncStatus('error');
      addNotification({
        type: 'error',
        title: 'Erro de conexão',
        message: 'Não foi possível conectar ao Google Drive.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportData = () => {
    const data = {
      categories,
      timeEntries,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Configurações</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Gerencie suas preferências e dados da aplicação
        </p>
      </div>

      {/* Profile Section */}
      <ProfileSection
        user={session?.user ?? null}
        onSignOut={handleSignOut}
      />

      {/* Appearance Section */}
      <AppearanceSection
        theme={theme}
        isDark={isDark}
        onThemeChange={setTheme}
      />

      {/* Notifications Section */}
      <NotificationsSection
        notificationsEnabled={notifications}
        pushEnabled={pushEnabled}
        pushPermission={permission}
        isPushSupported={isSupported}
        onNotificationsChange={setNotifications}
        onPushToggle={toggleNotifications}
      />

      {/* Sync Section */}
      <SyncSection
        isConnected={driveConnected}
        lastSync={lastSync}
        isSyncing={isSyncing}
        syncStatus={syncStatus}
        autoSync={autoSync}
        onAutoSyncChange={setAutoSync}
        onSyncNow={handleSyncNow}
        onExportData={handleExportData}
        dataStats={{
          categories: categories.length,
          timeEntries: timeEntries.length,
        }}
      />

      {/* Danger Zone */}
      <DangerZoneSection
        isClearing={isClearing}
        onClearData={handleClearData}
      />
    </div>
  );
}
