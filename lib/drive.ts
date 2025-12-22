import { google, drive_v3 } from 'googleapis';
import { DRIVE_FOLDER_NAME, DRIVE_FILES } from './constants';
import type { Category, TimeEntry, UserPreferences } from '@/types';

/**
 * Serviço para integração com Google Drive
 */
export class GoogleDriveService {
  private drive: drive_v3.Drive;
  private folderId: string | null = null;

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    this.drive = google.drive({ version: 'v3', auth });
  }

  /**
   * Obtém ou cria a pasta do TimeFlow no Google Drive
   */
  async getOrCreateFolder(): Promise<string> {
    if (this.folderId) {
      return this.folderId;
    }

    // Busca pasta existente
    const response = await this.drive.files.list({
      q: `name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    const folders = response.data.files;
    if (folders && folders.length > 0 && folders[0].id) {
      this.folderId = folders[0].id;
      return this.folderId;
    }

    // Cria nova pasta
    const createResponse = await this.drive.files.create({
      requestBody: {
        name: DRIVE_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    });

    this.folderId = createResponse.data.id ?? null;
    if (!this.folderId) {
      throw new Error('Failed to create folder');
    }
    return this.folderId;
  }

  /**
   * Busca um arquivo pelo nome na pasta do TimeFlow
   */
  async findFile(fileName: string): Promise<string | null> {
    const folderId = await this.getOrCreateFolder();

    const response = await this.drive.files.list({
      q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, modifiedTime)',
      spaces: 'drive',
    });

    const files = response.data.files;
    if (files && files.length > 0 && files[0].id) {
      return files[0].id;
    }

    return null;
  }

  /**
   * Lê o conteúdo de um arquivo JSON
   */
  async readFile<T>(fileName: string): Promise<T | null> {
    const fileId = await this.findFile(fileName);

    if (!fileId) {
      return null;
    }

    const response = await this.drive.files.get({
      fileId,
      alt: 'media',
    });

    return response.data as T;
  }

  /**
   * Cria ou atualiza um arquivo JSON
   */
  async writeFile<T>(fileName: string, data: T): Promise<string> {
    const folderId = await this.getOrCreateFolder();
    const existingFileId = await this.findFile(fileName);
    const content = JSON.stringify(data, null, 2);

    if (existingFileId) {
      // Atualiza arquivo existente
      await this.drive.files.update({
        fileId: existingFileId,
        media: {
          mimeType: 'application/json',
          body: content,
        },
      });
      return existingFileId;
    }

    // Cria novo arquivo
    const createResponse = await this.drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
        mimeType: 'application/json',
      },
      media: {
        mimeType: 'application/json',
        body: content,
      },
      fields: 'id',
    });

    if (!createResponse.data.id) {
      throw new Error('Failed to create file');
    }

    return createResponse.data.id;
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
    const folderId = await this.getOrCreateFolder();

    const response = await this.drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, modifiedTime, createdTime)',
      orderBy: 'modifiedTime desc',
      spaces: 'drive',
    });

    return response.data.files ?? [];
  }

  // Métodos específicos para dados do TimeFlow

  /**
   * Lê categorias do Drive
   */
  async readCategories(): Promise<Category[]> {
    const data = await this.readFile<{ categories: Category[] }>(DRIVE_FILES.CATEGORIES);
    return data?.categories ?? [];
  }

  /**
   * Salva categorias no Drive
   */
  async writeCategories(categories: Category[]): Promise<string> {
    return this.writeFile(DRIVE_FILES.CATEGORIES, {
      categories,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Lê time entries do Drive
   */
  async readTimeEntries(): Promise<TimeEntry[]> {
    const data = await this.readFile<{ timeEntries: TimeEntry[] }>(DRIVE_FILES.TIME_ENTRIES);
    return data?.timeEntries ?? [];
  }

  /**
   * Salva time entries no Drive
   */
  async writeTimeEntries(timeEntries: TimeEntry[]): Promise<string> {
    return this.writeFile(DRIVE_FILES.TIME_ENTRIES, {
      timeEntries,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Lê preferências do Drive
   */
  async readPreferences(): Promise<UserPreferences | null> {
    return this.readFile<UserPreferences>(DRIVE_FILES.PREFERENCES);
  }

  /**
   * Salva preferências no Drive
   */
  async writePreferences(preferences: UserPreferences): Promise<string> {
    return this.writeFile(DRIVE_FILES.PREFERENCES, {
      ...preferences,
      updatedAt: new Date().toISOString(),
    });
  }

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
}

/**
 * Factory para criar instância do serviço
 */
export function createDriveService(accessToken: string): GoogleDriveService {
  return new GoogleDriveService(accessToken);
}
