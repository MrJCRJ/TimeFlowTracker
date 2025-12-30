/**
 * Módulo de sincronização manual
 *
 * Exporta funções de sincronização baseadas em timestamp
 */

export {
  getLocalUpdatedAt,
  setLocalUpdatedAt,
  compareSyncTimestamps,
  type SyncMetadata,
  type SyncData,
  type SyncCompareResult,
  type SimpleSyncResult,
} from './simple-sync';
