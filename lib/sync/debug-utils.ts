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

(window as Window).debugSync = {
  // Verificar estado atual
  status: () => {
    const localTimestamp = getLocalUpdatedAt();
    console.log('=== DIAGNÓSTICO DE SYNC ===');
    console.log('Timestamp local:', localTimestamp);
    console.log('Data local:', localTimestamp ? new Date(localTimestamp).toLocaleString() : 'NULO');

    // Simular comparação com diferentes cenários
    console.log('\n=== CENÁRIOS DE COMPARAÇÃO ===');

    // Cenário 1: PC tem dados, celular não tem timestamp
    const scenario1 = compareSyncTimestamps(null, localTimestamp, false);
    console.log('Cenário 1 (celular primeiro uso):', scenario1);

    // Cenário 2: PC tem dados, celular tem dados vazios
    const scenario2 = compareSyncTimestamps(null, localTimestamp, true);
    console.log('Cenário 2 (celular com dados vazios):', scenario2);

    // Cenário 3: Ambos têm timestamps iguais
    const scenario3 = compareSyncTimestamps(localTimestamp, localTimestamp, true);
    console.log('Cenário 3 (timestamps iguais):', scenario3);

    return { localTimestamp, scenario1, scenario2, scenario3 };
  },

  // Limpar timestamp local (simular primeiro uso)
  reset: () => {
    localStorage.removeItem('timeflow_sync_metadata');
    console.log('Timestamp local resetado');
  },

  // Forçar timestamp antigo (simular dados desatualizados)
  setOldTimestamp: () => {
    const oldTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 1 dia atrás
    setLocalUpdatedAt(oldTime);
    console.log('Timestamp definido para:', oldTime);
  },

  // Forçar timestamp futuro (simular dados mais recentes)
  setNewTimestamp: () => {
    const newTime = new Date(Date.now() + 60 * 1000).toISOString(); // 1 minuto no futuro
    setLocalUpdatedAt(newTime);
    console.log('Timestamp definido para:', newTime);
  },
};

console.log('🔧 Utilitário de debug de sync carregado!');
console.log('Use debugSync.status() para diagnóstico');
console.log('Use debugSync.reset() para simular primeiro uso');
console.log('Use debugSync.setOldTimestamp() para simular dados antigos');
console.log('Use debugSync.setNewTimestamp() para simular dados recentes');
