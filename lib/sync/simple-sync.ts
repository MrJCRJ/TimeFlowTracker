/**
 * SimpleSyncManager - Sistema de sincronização baseado em timestamp
 *
 * Lógica simples:
 * - Se timestamps iguais → Não faz nada
 * - Se Drive mais recente → Sobrescreve dados locais
 * - Se App mais recente → Atualiza dados no Drive
 */

import { STORAGE_KEYS } from '../constants';

export interface SyncMetadata {
  updatedAt: string; // ISO timestamp
  deviceId?: string;
}

export interface SyncData {
  categories: unknown[];
  timeEntries: unknown[];
  updatedAt: string;
}

export interface SyncCompareResult {
  action: 'none' | 'download' | 'upload';
  localTime: Date | null;
  driveTime: Date | null;
  reason: string;
}

export interface SimpleSyncResult {
  success: boolean;
  action: 'none' | 'download' | 'upload';
  message: string;
  data?: {
    categories: unknown[];
    timeEntries: unknown[];
  };
}

/**
 * Obtém o timestamp de última atualização local
 */
export function getLocalUpdatedAt(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const metadata = localStorage.getItem(STORAGE_KEYS.SYNC_METADATA);
    if (metadata) {
      const parsed = JSON.parse(metadata);
      return parsed.updatedAt || null;
    }
  } catch {
    // Ignorar erro de parsing
  }
  return null;
}

/**
 * Define o timestamp de última atualização local
 */
export function setLocalUpdatedAt(timestamp: string): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = localStorage.getItem(STORAGE_KEYS.SYNC_METADATA);
    const metadata = existing ? JSON.parse(existing) : {};
    metadata.updatedAt = timestamp;
    localStorage.setItem(STORAGE_KEYS.SYNC_METADATA, JSON.stringify(metadata));
  } catch {
    // Criar novo se falhar
    localStorage.setItem(STORAGE_KEYS.SYNC_METADATA, JSON.stringify({ updatedAt: timestamp }));
  }
}

/**
 * Compara timestamps para decidir a ação de sync
 */
export function compareSyncTimestamps(
  localUpdatedAt: string | null,
  driveUpdatedAt: string | null
): SyncCompareResult {
  // Se não tem timestamp local, precisa baixar do drive (se existir)
  if (!localUpdatedAt) {
    if (driveUpdatedAt) {
      return {
        action: 'download',
        localTime: null,
        driveTime: new Date(driveUpdatedAt),
        reason: 'Sem dados locais, baixando do Drive',
      };
    }
    return {
      action: 'none',
      localTime: null,
      driveTime: null,
      reason: 'Sem dados em nenhum lugar',
    };
  }

  // Se não tem dados no Drive, precisa fazer upload
  if (!driveUpdatedAt) {
    return {
      action: 'upload',
      localTime: new Date(localUpdatedAt),
      driveTime: null,
      reason: 'Sem dados no Drive, fazendo upload',
    };
  }

  const localTime = new Date(localUpdatedAt);
  const driveTime = new Date(driveUpdatedAt);

  // Compara timestamps
  const diff = localTime.getTime() - driveTime.getTime();

  // Tolerância de 1 segundo para considerar igual
  if (Math.abs(diff) < 1000) {
    return {
      action: 'none',
      localTime,
      driveTime,
      reason: 'Timestamps iguais, sem ação necessária',
    };
  }

  if (diff > 0) {
    // Local é mais recente
    return {
      action: 'upload',
      localTime,
      driveTime,
      reason: `App mais recente (${localTime.toISOString()} > ${driveTime.toISOString()})`,
    };
  }

  // Drive é mais recente
  return {
    action: 'download',
    localTime,
    driveTime,
    reason: `Drive mais recente (${driveTime.toISOString()} > ${localTime.toISOString()})`,
  };
}

/**
 * Classe principal do sync simples
 */
export class SimpleSyncManager {
  private isSyncing = false;
  private callbacks = {
    getAccessToken: (): string | null => null,
    getLocalData: (): { categories: unknown[]; timeEntries: unknown[] } => ({
      categories: [],
      timeEntries: [],
    }),
    setLocalData: (_data: { categories: unknown[]; timeEntries: unknown[] }): void => {},
    onSyncStart: (): void => {},
    onSyncComplete: (_result: SimpleSyncResult): void => {},
  };

  /**
   * Configura callbacks
   */
  configure(callbacks: Partial<typeof this.callbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Retorna se está sincronizando
   */
  getIsSyncing(): boolean {
    return this.isSyncing;
  }

  /**
   * Executa sincronização
   */
  async sync(): Promise<SimpleSyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        action: 'none',
        message: 'Sincronização já em andamento',
      };
    }

    const token = this.callbacks.getAccessToken();
    if (!token) {
      return {
        success: false,
        action: 'none',
        message: 'Não autenticado',
      };
    }

    this.isSyncing = true;
    this.callbacks.onSyncStart();

    try {
      // 1. Buscar metadados do Drive
      const driveResponse = await fetch('/api/drive/sync/metadata');

      if (!driveResponse.ok) {
        throw new Error('Falha ao buscar metadados do Drive');
      }

      const driveMetadata = await driveResponse.json();
      const driveUpdatedAt = driveMetadata.data?.updatedAt || null;

      // 2. Comparar timestamps
      const localUpdatedAt = getLocalUpdatedAt();
      const comparison = compareSyncTimestamps(localUpdatedAt, driveUpdatedAt);

      console.log('[SimpleSync] Comparação:', comparison);

      // 3. Executar ação baseada na comparação
      let result: SimpleSyncResult;

      switch (comparison.action) {
        case 'download':
          result = await this.downloadFromDrive();
          break;
        case 'upload':
          result = await this.uploadToDrive();
          break;
        default:
          result = {
            success: true,
            action: 'none',
            message: comparison.reason,
          };
      }

      this.callbacks.onSyncComplete(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const result: SimpleSyncResult = {
        success: false,
        action: 'none',
        message: errorMessage,
      };
      this.callbacks.onSyncComplete(result);
      return result;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Baixa dados do Drive e sobrescreve locais
   */
  private async downloadFromDrive(): Promise<SimpleSyncResult> {
    console.log('[SimpleSync] Baixando dados do Drive...');

    const response = await fetch('/api/drive/sync/download');

    if (!response.ok) {
      throw new Error('Falha ao baixar dados do Drive');
    }

    const result = await response.json();

    if (result.success && result.data) {
      const data = {
        categories: result.data.categories || [],
        timeEntries: result.data.timeEntries || [],
      };

      // Sobrescrever dados locais
      this.callbacks.setLocalData(data);

      // Atualizar timestamp local
      if (result.data.updatedAt) {
        setLocalUpdatedAt(result.data.updatedAt);
      }

      return {
        success: true,
        action: 'download',
        message: 'Dados baixados do Drive',
        data,
      };
    }

    return {
      success: false,
      action: 'download',
      message: 'Dados inválidos do Drive',
    };
  }

  /**
   * Envia dados locais para o Drive
   */
  private async uploadToDrive(): Promise<SimpleSyncResult> {
    console.log('[SimpleSync] Enviando dados para o Drive...');

    const localData = this.callbacks.getLocalData();
    const now = new Date().toISOString();

    const response = await fetch('/api/drive/sync/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categories: localData.categories,
        timeEntries: localData.timeEntries,
        updatedAt: now,
      }),
    });

    if (!response.ok) {
      throw new Error('Falha ao enviar dados para o Drive');
    }

    // Atualizar timestamp local
    setLocalUpdatedAt(now);

    return {
      success: true,
      action: 'upload',
      message: 'Dados enviados para o Drive',
    };
  }

  /**
   * Força upload para o Drive (ignora comparação)
   */
  async forceUpload(): Promise<SimpleSyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        action: 'none',
        message: 'Sincronização já em andamento',
      };
    }

    const token = this.callbacks.getAccessToken();
    if (!token) {
      return {
        success: false,
        action: 'none',
        message: 'Não autenticado',
      };
    }

    this.isSyncing = true;
    this.callbacks.onSyncStart();

    try {
      const result = await this.uploadToDrive();
      this.callbacks.onSyncComplete(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const result: SimpleSyncResult = {
        success: false,
        action: 'upload',
        message: errorMessage,
      };
      this.callbacks.onSyncComplete(result);
      return result;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Força download do Drive (ignora comparação)
   */
  async forceDownload(): Promise<SimpleSyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        action: 'none',
        message: 'Sincronização já em andamento',
      };
    }

    const token = this.callbacks.getAccessToken();
    if (!token) {
      return {
        success: false,
        action: 'none',
        message: 'Não autenticado',
      };
    }

    this.isSyncing = true;
    this.callbacks.onSyncStart();

    try {
      const result = await this.downloadFromDrive();
      this.callbacks.onSyncComplete(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const result: SimpleSyncResult = {
        success: false,
        action: 'download',
        message: errorMessage,
      };
      this.callbacks.onSyncComplete(result);
      return result;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Marca dados como atualizados (para chamar após modificações locais)
   */
  markAsUpdated(): void {
    setLocalUpdatedAt(new Date().toISOString());
  }

  /**
   * Reseta estado
   */
  reset(): void {
    this.isSyncing = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.SYNC_METADATA);
    }
  }
}

// Instância singleton
export const simpleSyncManager = new SimpleSyncManager();
