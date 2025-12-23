/**
 * Configurações do gerenciador de sincronização
 */
export interface SyncManagerConfig {
  debounceMs: number; // Tempo para agrupar mudanças (padrão: 5s)
  throttleMs: number; // Intervalo mínimo entre syncs (padrão: 30s)
  maxRetries: number; // Máximo de tentativas em caso de erro
  syncIntervalMs: number; // Intervalo de sync automático (padrão: 5min)
}

/**
 * Configuração padrão do SyncManager
 */
export const DEFAULT_SYNC_CONFIG: SyncManagerConfig = {
  debounceMs: 5000, // 5 segundos de debounce
  throttleMs: 30000, // Mínimo 30 segundos entre syncs
  maxRetries: 3,
  syncIntervalMs: 5 * 60 * 1000, // 5 minutos
};
