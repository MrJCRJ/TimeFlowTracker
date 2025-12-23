/**
 * SyncManager - Sistema inteligente de sincronização
 *
 * Responsável por gerenciar sincronização entre múltiplos dispositivos
 * de forma eficiente, evitando requests desnecessários.
 *
 * Estratégias implementadas:
 * - Debounce: Agrupa mudanças antes de sincronizar
 * - Throttle: Limita frequência de sincronizações
 * - Hash: Só sincroniza se dados mudaram
 * - Queue: Evita sincronizações simultâneas
 * - Retry: Tenta novamente em caso de falha
 */

import type { Category, TimeEntry } from '@/types';

// Configurações do gerenciador de sincronização
export interface SyncManagerConfig {
  debounceMs: number; // Tempo para agrupar mudanças (padrão: 5s)
  throttleMs: number; // Intervalo mínimo entre syncs (padrão: 30s)
  maxRetries: number; // Máximo de tentativas em caso de erro
  syncIntervalMs: number; // Intervalo de sync automático (padrão: 5min)
}

// Estado atual dos dados para comparação
interface DataState {
  categories: Category[];
  timeEntries: TimeEntry[];
  activeTimerId: string | null;
  hash: string;
  timestamp: number;
}

// Resultado de uma operação de sync
export interface SyncResult {
  success: boolean;
  direction: 'upload' | 'download' | 'none';
  conflicts?: boolean;
  error?: string;
}

const DEFAULT_CONFIG: SyncManagerConfig = {
  debounceMs: 5000, // 5 segundos de debounce
  throttleMs: 30000, // Mínimo 30 segundos entre syncs
  maxRetries: 3,
  syncIntervalMs: 5 * 60 * 1000, // 5 minutos
};

/**
 * Gera hash simples dos dados para comparação rápida
 */
function generateHash(data: {
  categories: Category[];
  timeEntries: TimeEntry[];
  activeTimerId?: string | null;
}): string {
  const str = JSON.stringify({
    c: data.categories.map((c) => `${c.id}:${c.name}:${c.color}`).sort(),
    t: data.timeEntries.map((t) => `${t.id}:${t.startTime}:${t.endTime || ''}`).sort(),
    a: data.activeTimerId || '',
  });

  // Hash simples usando soma de caracteres
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Converte para 32bit integer
  }
  return hash.toString(36);
}

/**
 * Classe principal do gerenciador de sincronização
 */
export class SyncManager {
  private config: SyncManagerConfig;
  private debounceTimer: NodeJS.Timeout | null = null;
  private lastSyncTime: number = 0;
  private lastLocalState: DataState | null = null;
  private lastCloudState: DataState | null = null;
  private isSyncing: boolean = false;
  private syncQueue: Array<() => Promise<void>> = [];
  private retryCount: number = 0;

  // Callbacks para obter/atualizar dados
  private getAccessToken: () => string | null = () => null;
  private getLocalData: () => {
    categories: Category[];
    timeEntries: TimeEntry[];
    activeTimerId: string | null;
  } = () => ({ categories: [], timeEntries: [], activeTimerId: null });
  private setLocalData: (data: {
    categories: Category[];
    timeEntries: TimeEntry[];
  }) => void = () => {};
  private onSyncComplete: (result: SyncResult) => void = () => {};

  constructor(config: Partial<SyncManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Configura callbacks para integração com stores
   */
  configure(options: {
    getAccessToken: () => string | null;
    getLocalData: () => {
      categories: Category[];
      timeEntries: TimeEntry[];
      activeTimerId: string | null;
    };
    setLocalData: (data: { categories: Category[]; timeEntries: TimeEntry[] }) => void;
    onSyncComplete?: (result: SyncResult) => void;
  }) {
    this.getAccessToken = options.getAccessToken;
    this.getLocalData = options.getLocalData;
    this.setLocalData = options.setLocalData;
    if (options.onSyncComplete) {
      this.onSyncComplete = options.onSyncComplete;
    }
  }

  /**
   * Verifica se dados locais mudaram desde último sync
   */
  private hasLocalChanges(): boolean {
    const currentData = this.getLocalData();
    const currentHash = generateHash(currentData);

    if (!this.lastLocalState) {
      return true; // Primeiro sync
    }

    return currentHash !== this.lastLocalState.hash;
  }

  /**
   * Verifica se pode fazer sync (respeitando throttle)
   */
  private canSync(): boolean {
    const now = Date.now();
    return now - this.lastSyncTime >= this.config.throttleMs;
  }

  /**
   * Agenda um sync com debounce
   */
  scheduleSync(immediate: boolean = false): void {
    // Cancela timer anterior
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // Se não tem token, não agenda
    if (!this.getAccessToken()) {
      return;
    }

    // Verifica se tem mudanças
    if (!immediate && !this.hasLocalChanges()) {
      console.log('[SyncManager] Sem mudanças locais, pulando sync');
      return;
    }

    // Se é imediato e pode sincronizar, faz agora
    if (immediate && this.canSync()) {
      this.executeSync('upload');
      return;
    }

    // Agenda com debounce
    const delay = immediate ? Math.max(0, this.config.throttleMs - (Date.now() - this.lastSyncTime)) : this.config.debounceMs;

    console.log(`[SyncManager] Sync agendado em ${delay}ms`);

    this.debounceTimer = setTimeout(() => {
      this.executeSync('upload');
    }, delay);
  }

  /**
   * Força download dos dados da nuvem
   */
  async syncFromCloud(): Promise<SyncResult> {
    return this.executeSync('download');
  }

  /**
   * Força upload dos dados locais
   */
  async syncToCloud(): Promise<SyncResult> {
    if (!this.hasLocalChanges() && this.lastLocalState) {
      console.log('[SyncManager] Dados não mudaram, pulando upload');
      return { success: true, direction: 'none' };
    }
    return this.executeSync('upload');
  }

  /**
   * Executa sincronização
   */
  private async executeSync(direction: 'upload' | 'download'): Promise<SyncResult> {
    // Se já está sincronizando, adiciona à fila
    if (this.isSyncing) {
      console.log('[SyncManager] Sync em andamento, adicionando à fila');
      return new Promise((resolve) => {
        this.syncQueue.push(async () => {
          const result = await this.executeSync(direction);
          resolve(result);
        });
      });
    }

    const token = this.getAccessToken();
    if (!token) {
      return { success: false, direction: 'none', error: 'No access token' };
    }

    this.isSyncing = true;

    try {
      let result: SyncResult;

      if (direction === 'upload') {
        result = await this.performUpload(token);
      } else {
        result = await this.performDownload(token);
      }

      // Atualiza estado após sync bem sucedido
      if (result.success) {
        this.lastSyncTime = Date.now();
        this.retryCount = 0;

        // Atualiza hash do estado local
        const currentData = this.getLocalData();
        this.lastLocalState = {
          ...currentData,
          hash: generateHash(currentData),
          timestamp: Date.now(),
        };
      }

      this.onSyncComplete(result);
      return result;
    } catch (error) {
      console.error('[SyncManager] Erro no sync:', error);

      // Retry em caso de erro
      if (this.retryCount < this.config.maxRetries) {
        this.retryCount++;
        console.log(`[SyncManager] Tentativa ${this.retryCount}/${this.config.maxRetries}`);

        // Aguarda antes de tentar novamente
        await new Promise((resolve) => setTimeout(resolve, 1000 * this.retryCount));
        return this.executeSync(direction);
      }

      return {
        success: false,
        direction,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      this.isSyncing = false;

      // Processa fila
      if (this.syncQueue.length > 0) {
        const next = this.syncQueue.shift();
        if (next) next();
      }
    }
  }

  /**
   * Realiza upload para a nuvem
   */
  private async performUpload(_token: string): Promise<SyncResult> {
    const localData = this.getLocalData();

    console.log('[SyncManager] Fazendo upload...', {
      categories: localData.categories.length,
      timeEntries: localData.timeEntries.length,
    });

    const response = await fetch('/api/drive/backup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categories: localData.categories,
        timeEntries: localData.timeEntries,
        preferences: {
          updatedAt: new Date().toISOString(),
          ...(localData.activeTimerId
            ? {
                activeTimer: {
                  id: localData.activeTimerId,
                },
              }
            : {}),
        },
        syncedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return { success: true, direction: 'upload' };
  }

  /**
   * Realiza download da nuvem
   */
  private async performDownload(_token: string): Promise<SyncResult> {
    console.log('[SyncManager] Fazendo download...');

    const response = await fetch('/api/drive/sync');

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.data) {
      const cloudData = {
        categories: data.data.categories || [],
        timeEntries: data.data.timeEntries || [],
        activeTimerId: data.data.preferences?.activeTimer?.id || null,
      };

      // Gera hash dos dados da nuvem
      const cloudHash = generateHash(cloudData);

      // Se dados da nuvem são diferentes dos locais, atualiza
      if (!this.lastLocalState || cloudHash !== this.lastLocalState.hash) {
        console.log('[SyncManager] Atualizando dados locais com dados da nuvem');

        this.setLocalData({
          categories: cloudData.categories,
          timeEntries: cloudData.timeEntries,
        });

        // Atualiza estado da nuvem
        this.lastCloudState = {
          ...cloudData,
          hash: cloudHash,
          timestamp: Date.now(),
        };

        // Atualiza estado local também
        this.lastLocalState = { ...this.lastCloudState };
      }

      return { success: true, direction: 'download' };
    }

    return { success: true, direction: 'none' };
  }

  /**
   * Cancela qualquer sync pendente
   */
  cancel(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.syncQueue = [];
  }

  /**
   * Retorna status atual
   */
  getStatus() {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      queueLength: this.syncQueue.length,
      hasLocalChanges: this.hasLocalChanges(),
    };
  }

  /**
   * Reseta estado (útil para logout)
   */
  reset(): void {
    this.cancel();
    this.lastLocalState = null;
    this.lastCloudState = null;
    this.lastSyncTime = 0;
    this.retryCount = 0;
  }
}

// Instância singleton para uso global
export const syncManager = new SyncManager();
