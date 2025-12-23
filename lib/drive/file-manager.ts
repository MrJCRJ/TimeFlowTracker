import { drive_v3 } from 'googleapis';
import { DriveFolderManager } from './folder-manager';

/**
 * Resultado da verificação de arquivos
 */
export interface FileVerificationResult {
  exists: boolean;
  fileId: string | null;
  wasDeleted: boolean; // indica se o arquivo existia antes mas foi deletado
}

/**
 * Cache de IDs de arquivos conhecidos
 */
const knownFileIds = new Map<string, string>();

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
      // Armazenar ID conhecido para rastreamento
      knownFileIds.set(fileName, files[0].id);
      return files[0].id;
    }

    return null;
  }

  /**
   * Verifica se um arquivo existe e se foi deletado externamente
   */
  async verifyFile(fileName: string): Promise<FileVerificationResult> {
    const fileId = await this.findFile(fileName);
    const knownId = knownFileIds.get(fileName);

    // Se o arquivo existe, retorna normalmente
    if (fileId) {
      return { exists: true, fileId, wasDeleted: false };
    }

    // Se não existe mas tínhamos um ID conhecido, foi deletado externamente
    if (knownId) {
      knownFileIds.delete(fileName);
      return { exists: false, fileId: null, wasDeleted: true };
    }

    // Nunca existiu ou nunca foi rastreado
    return { exists: false, fileId: null, wasDeleted: false };
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
   * Lê o conteúdo de um arquivo com verificação de exclusão
   */
  async readFileWithVerification<T>(fileName: string): Promise<{
    data: T | null;
    wasDeleted: boolean;
  }> {
    const verification = await this.verifyFile(fileName);

    if (verification.wasDeleted) {
      return { data: null, wasDeleted: true };
    }

    if (!verification.exists || !verification.fileId) {
      return { data: null, wasDeleted: false };
    }

    const response = await this.drive.files.get({
      fileId: verification.fileId,
      alt: 'media',
    });

    return { data: response.data as T, wasDeleted: false };
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

    // Armazenar ID conhecido
    knownFileIds.set(fileName, createResponse.data.id);
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
      // Limpar do cache de conhecidos
      knownFileIds.delete(fileName);
      return false;
    }

    await this.drive.files.delete({ fileId });
    // Limpar do cache de conhecidos
    knownFileIds.delete(fileName);
    return true;
  }

  /**
   * Deleta todos os arquivos conhecidos e limpa o cache
   */
  async deleteAllFiles(): Promise<number> {
    const files = await this.listFiles();
    let deleted = 0;

    for (const file of files) {
      if (file.id) {
        try {
          await this.drive.files.delete({ fileId: file.id });
          deleted++;
        } catch (error) {
          console.warn(`Erro ao deletar arquivo ${file.name}:`, error);
        }
      }
    }

    // Limpar cache de arquivos conhecidos
    knownFileIds.clear();
    return deleted;
  }

  /**
   * Limpa o cache de IDs de arquivos conhecidos
   */
  static clearKnownFilesCache(): void {
    knownFileIds.clear();
  }
}
