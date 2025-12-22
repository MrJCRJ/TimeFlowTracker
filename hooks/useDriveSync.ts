'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface SyncState {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  error: string | null;
}

interface UseDriveSyncReturn extends SyncState {
  sync: () => Promise<void>;
  backup: () => Promise<void>;
  restore: () => Promise<void>;
}

export function useDriveSync(): UseDriveSyncReturn {
  const { data: session } = useSession();
  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    lastSyncTime: null,
    error: null,
  });

  const sync = useCallback(async () => {
    if (!session?.accessToken) {
      setState((prev) => ({
        ...prev,
        error: 'Você precisa estar logado para sincronizar',
      }));
      return;
    }

    setState((prev) => ({ ...prev, isSyncing: true, error: null }));

    try {
      const response = await fetch('/api/drive/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao sincronizar');
      }

      setState({
        isSyncing: false,
        lastSyncTime: new Date(),
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Erro ao sincronizar',
      }));
    }
  }, [session?.accessToken]);

  const backup = useCallback(async () => {
    if (!session?.accessToken) {
      setState((prev) => ({
        ...prev,
        error: 'Você precisa estar logado para fazer backup',
      }));
      return;
    }

    setState((prev) => ({ ...prev, isSyncing: true, error: null }));

    try {
      const response = await fetch('/api/drive/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao criar backup');
      }

      setState({
        isSyncing: false,
        lastSyncTime: new Date(),
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Erro ao criar backup',
      }));
    }
  }, [session?.accessToken]);

  const restore = useCallback(async () => {
    if (!session?.accessToken) {
      setState((prev) => ({
        ...prev,
        error: 'Você precisa estar logado para restaurar',
      }));
      return;
    }

    setState((prev) => ({ ...prev, isSyncing: true, error: null }));

    try {
      const response = await fetch('/api/drive/sync', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Falha ao restaurar dados');
      }

      // Reload the page to apply restored data
      window.location.reload();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Erro ao restaurar',
      }));
    }
  }, [session?.accessToken]);

  return {
    ...state,
    sync,
    backup,
    restore,
  };
}
