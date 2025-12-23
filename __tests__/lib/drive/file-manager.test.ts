/**
 * Testes para o DriveFileManager
 */
import { DriveFileManager } from '@/lib/drive/file-manager';
import { DriveFolderManager } from '@/lib/drive/folder-manager';

describe('DriveFileManager', () => {
  let mockDrive: any;
  let mockFolderManager: jest.Mocked<DriveFolderManager>;
  let fileManager: DriveFileManager;

  beforeEach(() => {
    mockDrive = {
      files: {
        list: jest.fn(),
        get: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    mockFolderManager = {
      getOrCreateFolder: jest.fn().mockResolvedValue('test-folder-id'),
    } as any;

    fileManager = new DriveFileManager(mockDrive, mockFolderManager);
  });

  describe('findFile', () => {
    it('deve retornar ID do arquivo se encontrado', async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [{ id: 'file-123', name: 'test.json' }],
        },
      });

      const fileId = await fileManager.findFile('test.json');

      expect(fileId).toBe('file-123');
      expect(mockFolderManager.getOrCreateFolder).toHaveBeenCalled();
    });

    it('deve retornar null se arquivo não encontrado', async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: { files: [] },
      });

      const fileId = await fileManager.findFile('nonexistent.json');

      expect(fileId).toBeNull();
    });
  });

  describe('readFile', () => {
    it('deve ler e retornar conteúdo do arquivo', async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: { files: [{ id: 'file-123' }] },
      });
      mockDrive.files.get.mockResolvedValueOnce({
        data: { key: 'value', nested: { data: true } },
      });

      const content = await fileManager.readFile<{ key: string }>('test.json');

      expect(content).toEqual({ key: 'value', nested: { data: true } });
    });

    it('deve retornar null se arquivo não existir', async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: { files: [] },
      });

      const content = await fileManager.readFile('nonexistent.json');

      expect(content).toBeNull();
      expect(mockDrive.files.get).not.toHaveBeenCalled();
    });
  });

  describe('writeFile', () => {
    it('deve criar novo arquivo se não existir', async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: { files: [] },
      });
      mockDrive.files.create.mockResolvedValueOnce({
        data: { id: 'new-file-id' },
      });

      const fileId = await fileManager.writeFile('new.json', { data: 'test' });

      expect(fileId).toBe('new-file-id');
      expect(mockDrive.files.create).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            name: 'new.json',
            parents: ['test-folder-id'],
          }),
        })
      );
    });

    it('deve atualizar arquivo existente', async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: { files: [{ id: 'existing-file-id' }] },
      });

      const fileId = await fileManager.writeFile('existing.json', { updated: true });

      expect(fileId).toBe('existing-file-id');
      expect(mockDrive.files.update).toHaveBeenCalledWith({
        fileId: 'existing-file-id',
        media: {
          mimeType: 'application/json',
          body: JSON.stringify({ updated: true }, null, 2),
        },
      });
      expect(mockDrive.files.create).not.toHaveBeenCalled();
    });

    it('deve lançar erro se criação falhar', async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: { files: [] },
      });
      mockDrive.files.create.mockResolvedValueOnce({
        data: { id: null },
      });

      await expect(fileManager.writeFile('fail.json', {})).rejects.toThrow('Failed to create file');
    });
  });

  describe('listFiles', () => {
    it('deve listar arquivos na pasta', async () => {
      const mockFiles = [
        { id: '1', name: 'file1.json' },
        { id: '2', name: 'file2.json' },
      ];
      mockDrive.files.list.mockResolvedValueOnce({
        data: { files: mockFiles },
      });

      const files = await fileManager.listFiles();

      expect(files).toEqual(mockFiles);
    });

    it('deve retornar array vazio se pasta estiver vazia', async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: { files: null },
      });

      const files = await fileManager.listFiles();

      expect(files).toEqual([]);
    });
  });

  describe('deleteFile', () => {
    it('deve deletar arquivo existente', async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: { files: [{ id: 'file-to-delete' }] },
      });
      mockDrive.files.delete.mockResolvedValueOnce({});

      const result = await fileManager.deleteFile('delete-me.json');

      expect(result).toBe(true);
      expect(mockDrive.files.delete).toHaveBeenCalledWith({ fileId: 'file-to-delete' });
    });

    it('deve retornar false se arquivo não existir', async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: { files: [] },
      });

      const result = await fileManager.deleteFile('nonexistent.json');

      expect(result).toBe(false);
      expect(mockDrive.files.delete).not.toHaveBeenCalled();
    });
  });
});
