import { drive_v3 } from 'googleapis';
import { DRIVE_FOLDER_NAME } from '../constants';

/**
 * Gerenciador de pasta do TimeFlow no Google Drive
 * Usa singleton pattern para evitar criação de pastas duplicadas
 */

// Cache global para evitar múltiplas criações de pasta
const folderCache = new Map<string, string>();
const pendingFolderCreation = new Map<string, Promise<string>>();

export class DriveFolderManager {
  private drive: drive_v3.Drive;
  private accessToken: string;

  constructor(drive: drive_v3.Drive, accessToken: string) {
    this.drive = drive;
    this.accessToken = accessToken;
  }

  /**
   * Obtém ou cria a pasta do TimeFlow no Google Drive
   * Usa lock para evitar race conditions
   */
  async getOrCreateFolder(): Promise<string> {
    // Verificar cache primeiro
    const cachedFolderId = folderCache.get(this.accessToken);
    if (cachedFolderId) {
      // Verificar se a pasta ainda existe
      try {
        const exists = await this.verifyFolderExists(cachedFolderId);
        if (exists) {
          return cachedFolderId;
        }
        // Pasta não existe mais, remover do cache
        folderCache.delete(this.accessToken);
      } catch {
        folderCache.delete(this.accessToken);
      }
    }

    // Verificar se já há uma criação em andamento para este token
    const pending = pendingFolderCreation.get(this.accessToken);
    if (pending) {
      return pending;
    }

    // Criar promise para a criação da pasta
    const creationPromise = this.findOrCreateFolderInternal();
    pendingFolderCreation.set(this.accessToken, creationPromise);

    try {
      const folderId = await creationPromise;
      folderCache.set(this.accessToken, folderId);
      return folderId;
    } finally {
      pendingFolderCreation.delete(this.accessToken);
    }
  }

  /**
   * Verifica se a pasta ainda existe no Drive
   */
  private async verifyFolderExists(folderId: string): Promise<boolean> {
    try {
      const response = await this.drive.files.get({
        fileId: folderId,
        fields: 'id, trashed',
      });
      return !response.data.trashed;
    } catch {
      return false;
    }
  }

  /**
   * Busca ou cria a pasta (sem cache)
   */
  private async findOrCreateFolderInternal(): Promise<string> {
    // Busca TODAS as pastas com o nome (incluindo duplicadas)
    const response = await this.drive.files.list({
      q: `name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name, createdTime)',
      spaces: 'drive',
      orderBy: 'createdTime asc', // Ordenar por mais antiga primeiro
    });

    const folders = response.data.files;

    if (folders && folders.length > 0) {
      // Se há múltiplas pastas, usar a mais antiga e logar um aviso
      if (folders.length > 1) {
        console.warn(
          `[Drive] Encontradas ${folders.length} pastas '${DRIVE_FOLDER_NAME}'. Usando a mais antiga.`
        );
      }

      const folderId = folders[0].id;
      if (folderId) {
        return folderId;
      }
    }

    // Criar nova pasta apenas se não existir nenhuma
    console.log(`[Drive] Criando nova pasta '${DRIVE_FOLDER_NAME}'`);
    const createResponse = await this.drive.files.create({
      requestBody: {
        name: DRIVE_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    });

    const newFolderId = createResponse.data.id;
    if (!newFolderId) {
      throw new Error('Failed to create folder');
    }

    return newFolderId;
  }

  /**
   * Limpa o cache de pastas (útil para testes ou após erros)
   */
  static clearCache(): void {
    folderCache.clear();
    pendingFolderCreation.clear();
  }
}
