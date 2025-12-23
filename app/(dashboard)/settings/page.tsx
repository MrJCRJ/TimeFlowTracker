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
        // Verificar conexão
        const statusResponse = await fetch('/api/drive/status');
        const statusData = await statusResponse.json();
        setDriveConnected(statusData.connected);

        // Buscar última sincronização do arquivo sync-metadata.json
        const metadataResponse = await fetch('/api/drive/sync/metadata');
        const metadataData = await metadataResponse.json();

        if (metadataData.success && metadataData.data?.updatedAt) {
          const lastSyncDate = new Date(metadataData.data.updatedAt);
          const deviceInfo = metadataData.data.lastSyncDevice
            ? ` (${metadataData.data.lastSyncDevice})`
            : '';
          setLastSync(lastSyncDate.toLocaleString('pt-BR') + deviceInfo);
        } else if (statusData.lastBackup) {
          setLastSync(new Date(statusData.lastBackup).toLocaleString('pt-BR'));
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
        // 1. Resetar stores
        resetCategories();
        resetTimer();

        // 2. Limpar TODAS as chaves do localStorage relacionadas ao app
        const keysToRemove = [
          'timer-storage',
          'timeflow_categories',
          'timeflow_timer_state',
          'timeflow_time_entries',
          'timeflow_preferences',
          'timeflow_sync_metadata',
          'timeflow_theme',
          'category-storage',
          'timer_state',
          'categories_state',
        ];

        // Limpar chaves específicas
        keysToRemove.forEach((key) => {
          localStorage.removeItem(key);
        });

        // Limpar todas as chaves que começam com 'timeflow' ou relacionadas
        const allKeys = Object.keys(localStorage);
        allKeys.forEach((key) => {
          if (
            key.startsWith('timeflow') ||
            key.startsWith('timer') ||
            key.startsWith('category') ||
            key.includes('sync') ||
            key.includes('drive')
          ) {
            localStorage.removeItem(key);
          }
        });

        // 3. Limpar IndexedDB se existir
        if ('indexedDB' in window) {
          const databases = (await window.indexedDB.databases?.()) || [];
          for (const db of databases) {
            if (
              db.name &&
              (db.name.includes('timeflow') ||
                db.name.includes('timer') ||
                db.name.includes('category'))
            ) {
              window.indexedDB.deleteDatabase(db.name);
            }
          }
        }

        // 4. Limpar Cache Storage se existir
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          for (const name of cacheNames) {
            if (name.includes('timeflow')) {
              await caches.delete(name);
            }
          }
        }

        // 5. Limpar dados do Drive (deletando todos os arquivos)
        if (session?.accessToken) {
          try {
            const response = await fetch('/api/drive/clear', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();
            if (data.success) {
              console.log(`${data.data.deletedCount} arquivos deletados do Drive`);
            }
          } catch (driveError) {
            console.warn('Não foi possível limpar dados do Drive:', driveError);
          }
        }

        addNotification({
          type: 'success',
          title: 'Dados limpos completamente',
          message: 'Todos os dados locais e do Drive foram removidos com sucesso.',
        });

        // Aguardar um pouco e recarregar
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
      const now = new Date().toISOString();

      // Enviar dados para o Drive
      const response = await fetch('/api/drive/sync/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories,
          timeEntries,
          updatedAt: now,
        }),
      });

      if (response.ok) {
        // Atualizar arquivo sync-metadata.json
        await fetch('/api/drive/sync/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updatedAt: now,
            deviceName: getDeviceName(),
          }),
        });

        setSyncStatus('success');
        setLastSync(new Date().toLocaleString('pt-BR'));
        addNotification({
          type: 'success',
          title: 'Sincronização concluída',
          message: 'Seus dados foram sincronizados com sucesso no Google Drive.',
        });
      } else {
        const data = await response.json();
        setSyncStatus('error');
        addNotification({
          type: 'error',
          title: 'Erro na sincronização',
          message: data.error?.message || 'Ocorreu um erro ao sincronizar os dados.',
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

  // Obtém nome do dispositivo
  const getDeviceName = (): string => {
    if (typeof window === 'undefined') return 'Server';

    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Mac/i.test(ua)) return 'Mac';
    if (/Linux/i.test(ua)) return 'Linux';
    return 'Browser';
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
      <ProfileSection user={session?.user ?? null} onSignOut={handleSignOut} />

      {/* Appearance Section */}
      <AppearanceSection theme={theme} isDark={isDark} onThemeChange={setTheme} />

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
      <DangerZoneSection isClearing={isClearing} onClearData={handleClearData} />
    </div>
  );
}
