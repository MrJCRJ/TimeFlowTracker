/**
 * Utilitário para testar e debugar problemas de sincronização
 * Use no console do navegador para diagnosticar issues
 */

import {
  compareSyncTimestamps,
  getLocalUpdatedAt,
  setLocalUpdatedAt,
} from '@/lib/sync/simple-sync';

// Função global para diagnóstico
declare global {
  interface Window {
    debugSync: {
      status: () => unknown;
      reset: () => void;
      setOldTimestamp: () => void;
      setNewTimestamp: () => void;
    };
  }
}

// Só executa no cliente
if (typeof window !== 'undefined') {
  (window as Window).debugSync = {
    status: () => {
      const localTimestamp = getLocalUpdatedAt();
      console.log('=== DIAGNÓSTICO DE SYNC ===');
      console.log('Timestamp local:', localTimestamp);
      console.log(
        'Data local:',
        localTimestamp ? new Date(localTimestamp).toLocaleString() : 'NULO'
      );

      const scenario1 = compareSyncTimestamps(null, localTimestamp, false);
      console.log('Cenário 1 (primeiro uso):', scenario1);

      const scenario2 = compareSyncTimestamps(null, localTimestamp, true);
      console.log('Cenário 2 (dados vazios):', scenario2);

      const scenario3 = compareSyncTimestamps(localTimestamp, localTimestamp, true);
      console.log('Cenário 3 (timestamps iguais):', scenario3);

      return { localTimestamp, scenario1, scenario2, scenario3 };
    },

    reset: () => {
      localStorage.removeItem('timeflow_sync_metadata');
      console.log('Timestamp local resetado');
    },

    setOldTimestamp: () => {
      const oldTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      setLocalUpdatedAt(oldTime);
      console.log('Timestamp definido para:', oldTime);
    },

    setNewTimestamp: () => {
      const newTime = new Date(Date.now() + 60 * 1000).toISOString();
      setLocalUpdatedAt(newTime);
      console.log('Timestamp definido para:', newTime);
    },
  };

  console.log('🔧 Utilitário de debug de sync carregado!');
}
