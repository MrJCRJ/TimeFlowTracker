/**
 * Testes para o DriveFolderManager
 */
import { DriveFolderManager } from '@/lib/drive/folder-manager';

// Mock do googleapis
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn(),
      })),
    },
    drive: jest.fn().mockImplementation(() => ({
      files: {
        list: jest.fn(),
        create: jest.fn(),
        get: jest.fn(),
      },
    })),
  },
}));

describe('DriveFolderManager', () => {
  let mockDrive: any;
  let folderManager: DriveFolderManager;

  beforeEach(() => {
    // Limpar cache entre testes
    DriveFolderManager.clearCache();
    
    // Criar mock do drive
    mockDrive = {
      files: {
        list: jest.fn(),
        create: jest.fn(),
        get: jest.fn(),
      },
    };
    
    folderManager = new DriveFolderManager(mockDrive, 'test-token');
  });

  describe('getOrCreateFolder', () => {
    it('deve retornar pasta existente se encontrada', async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [{ id: 'existing-folder-id', name: 'TimeFlowTracker' }],
        },
      });

      const folderId = await folderManager.getOrCreateFolder();

      expect(folderId).toBe('existing-folder-id');
      expect(mockDrive.files.list).toHaveBeenCalledTimes(1);
      expect(mockDrive.files.create).not.toHaveBeenCalled();
    });

    it('deve criar nova pasta se não existir', async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [],
        },
      });
      mockDrive.files.create.mockResolvedValueOnce({
        data: { id: 'new-folder-id' },
      });

      const folderId = await folderManager.getOrCreateFolder();

      expect(folderId).toBe('new-folder-id');
      expect(mockDrive.files.list).toHaveBeenCalledTimes(1);
      expect(mockDrive.files.create).toHaveBeenCalledTimes(1);
    });

    it('deve usar cache após primeira chamada', async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [{ id: 'cached-folder-id', name: 'TimeFlowTracker' }],
        },
      });
      mockDrive.files.get.mockResolvedValue({
        data: { id: 'cached-folder-id', trashed: false },
      });

      // Primeira chamada
      const firstResult = await folderManager.getOrCreateFolder();
      // Segunda chamada (deve usar cache)
      const secondResult = await folderManager.getOrCreateFolder();

      expect(firstResult).toBe('cached-folder-id');
      expect(secondResult).toBe('cached-folder-id');
      expect(mockDrive.files.list).toHaveBeenCalledTimes(1);
    });

    it('deve usar pasta mais antiga quando há duplicatas', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [
            { id: 'oldest-folder', name: 'TimeFlowTracker', createdTime: '2024-01-01' },
            { id: 'newer-folder', name: 'TimeFlowTracker', createdTime: '2024-06-01' },
            { id: 'newest-folder', name: 'TimeFlowTracker', createdTime: '2024-12-01' },
          ],
        },
      });

      const folderId = await folderManager.getOrCreateFolder();

      expect(folderId).toBe('oldest-folder');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Encontradas 3 pastas')
      );
      
      consoleSpy.mockRestore();
    });

    it('deve lançar erro se criação de pasta falhar', async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: { files: [] },
      });
      mockDrive.files.create.mockResolvedValueOnce({
        data: { id: null },
      });

      await expect(folderManager.getOrCreateFolder()).rejects.toThrow('Failed to create folder');
    });
  });

  describe('clearCache', () => {
    it('deve limpar o cache corretamente', async () => {
      // Popular cache
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [{ id: 'folder-1', name: 'TimeFlowTracker' }],
        },
      });
      await folderManager.getOrCreateFolder();

      // Limpar cache
      DriveFolderManager.clearCache();

      // Nova chamada deve consultar API novamente
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [{ id: 'folder-2', name: 'TimeFlowTracker' }],
        },
      });
      
      const newManager = new DriveFolderManager(mockDrive, 'test-token');
      const folderId = await newManager.getOrCreateFolder();

      expect(folderId).toBe('folder-2');
      expect(mockDrive.files.list).toHaveBeenCalledTimes(2);
    });
  });
});
