import { google, drive_v3 } from 'googleapis';
import { DriveFolderManager } from './folder-manager';
import { DriveFileManager } from './file-manager';
import { ActiveTimerManager } from './active-timer-manager';
import { DRIVE_FILES } from '../constants';
import type { Category, TimeEntry, UserPreferences, DeviceInfo, ActiveTimerRecord } from '@/types';

/**
 * Serviço principal para integração com Google Drive
 * Responsável por operações de sincronização de dados do TimeFlow
 */
export class GoogleDriveService {
  private drive: drive_v3.Drive;
  private folderManager: DriveFolderManager;
  private fileManager: DriveFileManager;
  private activeTimerManager: ActiveTimerManager;

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    this.drive = google.drive({ version: 'v3', auth });
    this.folderManager = new DriveFolderManager(this.drive, accessToken);
    this.fileManager = new DriveFileManager(this.drive, this.folderManager);
    this.activeTimerManager = new ActiveTimerManager(this.drive, this.folderManager, this.fileManager);
  }

  /**
   * Obtém ou cria a pasta do TimeFlow no Google Drive
   */
  async getOrCreateFolder(): Promise<string> {
    return this.folderManager.getOrCreateFolder();
  }

  /**
   * Testa a conexão com o Google Drive
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.drive.files.list({
        pageSize: 1,
        fields: 'files(id)',
        spaces: 'drive',
      });
      return true;
    } catch (error) {
      console.error('Erro ao testar conexão com Drive:', error);
      return false;
    }
  }

  /**
   * Lista arquivos na pasta do TimeFlow
   */
  async listFiles(): Promise<drive_v3.Schema$File[]> {
    return this.fileManager.listFiles();
  }

  // ==================== Métodos de Categorias ====================

  /**
   * Lê categorias do Drive
   */
  async readCategories(): Promise<Category[]> {
    const data = await this.fileManager.readFile<{ categories: Category[] }>(
      DRIVE_FILES.CATEGORIES
    );
    return data?.categories ?? [];
  }

  /**
   * Salva categorias no Drive
   */
  async writeCategories(categories: Category[]): Promise<string> {
    return this.fileManager.writeFile(DRIVE_FILES.CATEGORIES, {
      categories,
      updatedAt: new Date().toISOString(),
    });
  }

  // ==================== Métodos de Time Entries ====================

  /**
   * Lê time entries do Drive
   */
  async readTimeEntries(): Promise<TimeEntry[]> {
    const data = await this.fileManager.readFile<{ timeEntries: TimeEntry[] }>(
      DRIVE_FILES.TIME_ENTRIES
    );
    return data?.timeEntries ?? [];
  }

  /**
   * Salva time entries no Drive
   */
  async writeTimeEntries(timeEntries: TimeEntry[]): Promise<string> {
    return this.fileManager.writeFile(DRIVE_FILES.TIME_ENTRIES, {
      timeEntries,
      updatedAt: new Date().toISOString(),
    });
  }

  // ==================== Métodos de Preferências ====================

  /**
   * Lê preferências do Drive
   */
  async readPreferences(): Promise<UserPreferences | null> {
    return this.fileManager.readFile<UserPreferences>(DRIVE_FILES.PREFERENCES);
  }

  /**
   * Salva preferências no Drive
   */
  async writePreferences(preferences: UserPreferences): Promise<string> {
    return this.fileManager.writeFile(DRIVE_FILES.PREFERENCES, {
      ...preferences,
      updatedAt: new Date().toISOString(),
    });
  }

  // ==================== Métodos de Timer Ativo ====================

  /**
   * Registra início de um timer no Drive
   * Permite sincronização entre múltiplos dispositivos
   */
  async startActiveTimer(
    categoryId: string,
    userId: string,
    deviceInfo: DeviceInfo,
    notes?: string
  ): Promise<ActiveTimerRecord> {
    return this.activeTimerManager.registerTimerStart(categoryId, userId, deviceInfo, notes);
  }

  /**
   * Para um timer ativo e retorna o TimeEntry completo
   */
  async stopActiveTimer(
    categoryId: string,
    deviceInfo: DeviceInfo,
    notes?: string
  ): Promise<TimeEntry | null> {
    return this.activeTimerManager.stopTimer(categoryId, deviceInfo, notes);
  }

  /**
   * Obtém timer ativo de uma categoria
   */
  async getActiveTimer(categoryId: string): Promise<ActiveTimerRecord | null> {
    return this.activeTimerManager.getActiveTimer(categoryId);
  }

  /**
   * Lista todos os timers ativos no Drive
   */
  async listActiveTimers(): Promise<ActiveTimerRecord[]> {
    return this.activeTimerManager.listActiveTimers();
  }

  /**
   * Cancela um timer sem registrar entrada
   */
  async cancelActiveTimer(categoryId: string): Promise<boolean> {
    return this.activeTimerManager.cancelTimer(categoryId);
  }

  /**
   * Limpa todos os timers ativos (útil para reset)
   */
  async clearAllActiveTimers(): Promise<number> {
    return this.activeTimerManager.clearAllActiveTimers();
  }

  // ==================== Métodos de Sincronização ====================

  /**
   * Sincroniza todos os dados com o Drive
   */
  async syncAll(
    categories: Category[],
    timeEntries: TimeEntry[],
    preferences: UserPreferences
  ): Promise<{
    categoriesId: string;
    timeEntriesId: string;
    preferencesId: string;
  }> {
    const [categoriesId, timeEntriesId, preferencesId] = await Promise.all([
      this.writeCategories(categories),
      this.writeTimeEntries(timeEntries),
      this.writePreferences(preferences),
    ]);

    return { categoriesId, timeEntriesId, preferencesId };
  }

  /**
   * Carrega todos os dados do Drive
   */
  async loadAll(): Promise<{
    categories: Category[];
    timeEntries: TimeEntry[];
    preferences: UserPreferences | null;
  }> {
    const [categories, timeEntries, preferences] = await Promise.all([
      this.readCategories(),
      this.readTimeEntries(),
      this.readPreferences(),
    ]);

    return { categories, timeEntries, preferences };
  }

  /**
   * Limpa todos os dados do Drive (para reset)
   */
  async clearAll(): Promise<void> {
    // Limpa timers ativos também
    await this.clearAllActiveTimers();
    
    await Promise.all([
      this.fileManager.deleteFile(DRIVE_FILES.CATEGORIES),
      this.fileManager.deleteFile(DRIVE_FILES.TIME_ENTRIES),
      this.fileManager.deleteFile(DRIVE_FILES.PREFERENCES),
    ]);
  }
}

/**
 * Factory para criar instância do serviço
 */
export function createDriveService(accessToken: string): GoogleDriveService {
  return new GoogleDriveService(accessToken);
}

// Re-exportar para limpeza de cache
export { DriveFolderManager } from './folder-manager';
export { ActiveTimerManager } from './active-timer-manager';
