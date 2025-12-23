import { drive_v3 } from 'googleapis';
import { DriveFolderManager } from './folder-manager';

/**
 * Gerenciador de arquivos do Google Drive
 * Responsável por operações de leitura/escrita de arquivos
 */
export class DriveFileManager {
  private drive: drive_v3.Drive;
  private folderManager: DriveFolderManager;

  constructor(drive: drive_v3.Drive, folderManager: DriveFolderManager) {
    this.drive = drive;
    this.folderManager = folderManager;
  }

  /**
   * Busca um arquivo pelo nome na pasta do TimeFlow
   */
  async findFile(fileName: string): Promise<string | null> {
    const folderId = await this.folderManager.getOrCreateFolder();

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
    const folderId = await this.folderManager.getOrCreateFolder();
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
   * Lista arquivos na pasta do TimeFlow
   */
  async listFiles(): Promise<drive_v3.Schema$File[]> {
    const folderId = await this.folderManager.getOrCreateFolder();

    const response = await this.drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, modifiedTime, createdTime)',
      orderBy: 'modifiedTime desc',
      spaces: 'drive',
    });

    return response.data.files ?? [];
  }

  /**
   * Deleta um arquivo pelo nome
   */
  async deleteFile(fileName: string): Promise<boolean> {
    const fileId = await this.findFile(fileName);

    if (!fileId) {
      return false;
    }

    await this.drive.files.delete({ fileId });
    return true;
  }
}
