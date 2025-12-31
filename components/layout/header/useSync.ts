import { useState } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import { useTimerStore } from '@/stores/timerStore';
import {
  getLocalUpdatedAt,
  setLocalUpdatedAt,
  compareSyncTimestamps,
} from '@/lib/sync/simple-sync';
import type { TimeEntry } from '@/types';

/**
 * Hook de sincronização simples baseado em timestamp
 *
 * Lógica:
 * - Se timestamps iguais → Não faz nada
 * - Se Drive mais recente → Sobrescreve dados locais
 * - Se App mais recente → Atualiza dados no Drive
 *
 * Nota: Categorias são fixas, apenas timeEntries são sincronizados.
 */
export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { timeEntries, setTimeEntries } = useTimerStore();

  const handleSync = async () => {
    if (isSyncing) return;

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

      if (!session.accessToken) {
        throw new Error('Token de acesso do Google não encontrado. Faça login novamente.');
      }

      // Mostrar notificação de início
      useNotificationStore.getState().addNotification({
        type: 'info',
        title: 'Sincronizando',
        message: 'Verificando dados...',
      });

      // 1. Buscar metadados do Drive
      const metadataResponse = await fetch('/api/drive/sync/metadata');
      if (!metadataResponse.ok) {
        throw new Error('Falha ao buscar metadados do Drive');
      }

      const metadataData = await metadataResponse.json();
      const driveUpdatedAt = metadataData.data?.updatedAt || null;

      // 2. Comparar timestamps
      const localUpdatedAt = getLocalUpdatedAt();
      const comparison = compareSyncTimestamps(localUpdatedAt, driveUpdatedAt);

      console.log('[useSync] Comparação de timestamps:', comparison);

      // 3. Executar ação baseada na comparação
      switch (comparison.action) {
        case 'download':
          await handleDownload();
          break;
        case 'upload':
          await handleUpload();
          break;
        default:
          // Timestamps iguais, não faz nada
          useNotificationStore.getState().addNotification({
            type: 'success',
            title: 'Sincronizado',
            message: 'Dados já estão atualizados.',
          });
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      useNotificationStore.getState().addNotification({
        type: 'error',
        title: 'Erro na Sincronização',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Baixa dados do Drive e sobrescreve locais
   */
  const handleDownload = async () => {
    console.log('[useSync] Baixando dados do Drive...');

    const response = await fetch('/api/drive/sync/download');
    if (!response.ok) {
      throw new Error('Falha ao baixar dados do Drive');
    }

    const result = await response.json();

    if (result.success && result.data) {
      const driveTimeEntries = (result.data.timeEntries || []) as TimeEntry[];
      const driveUpdatedAt = result.data.updatedAt;

      // Sobrescrever dados locais (apenas timeEntries, categorias são fixas)
      setTimeEntries(driveTimeEntries);

      // Atualizar timestamp local
      if (driveUpdatedAt) {
        setLocalUpdatedAt(driveUpdatedAt);
      }

      useNotificationStore.getState().addNotification({
        type: 'success',
        title: 'Sincronizado',
        message: `Dados baixados do Drive: ${driveTimeEntries.length} registros de tempo.`,
      });
    }
  };

  /**
   * Envia dados locais para o Drive
   */
  const handleUpload = async () => {
    console.log('[useSync] Enviando dados para o Drive...');

    const now = new Date().toISOString();

    // 1. Enviar dados para o Drive (apenas timeEntries, categorias são fixas)
    const response = await fetch('/api/drive/sync/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeEntries,
        updatedAt: now,
      }),
    });

    if (!response.ok) {
      throw new Error('Falha ao enviar dados para o Drive');
    }

    // 2. Atualizar arquivo sync-metadata.json no Drive
    await fetch('/api/drive/sync/metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        updatedAt: now,
        deviceName: getDeviceName(),
      }),
    });

    // Atualizar timestamp local
    setLocalUpdatedAt(now);

    useNotificationStore.getState().addNotification({
      type: 'success',
      title: 'Sincronizado',
      message: `Dados enviados para o Drive: ${timeEntries.length} registros de tempo.`,
    });
  };

  return { handleSync, isSyncing };
}

/**
 * Obtém nome do dispositivo
 */
function getDeviceName(): string {
  if (typeof window === 'undefined') return 'Server';

  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac/i.test(ua)) return 'Mac';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Browser';
}
