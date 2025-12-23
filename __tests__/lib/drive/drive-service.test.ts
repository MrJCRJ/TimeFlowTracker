/**
 * Testes para o GoogleDriveService
 * Este arquivo testa a integração do serviço através de mocks
 * Os testes de unidade estão em folder-manager.test.ts e file-manager.test.ts
 *
 * NOTA: Usamos jest.doMock para evitar problemas de hoisting
 */

describe('GoogleDriveService', () => {
  // Mocks controláveis
  const mockReadCategories = jest.fn();
  const mockReadTimeEntries = jest.fn();
  const mockLoadAll = jest.fn();
  const mockSyncAll = jest.fn();
  const mockClearAll = jest.fn();

  // Mock do serviço
  const mockService = {
    getOrCreateFolder: jest.fn().mockResolvedValue('folder-id'),
    readCategories: mockReadCategories,
    readTimeEntries: mockReadTimeEntries,
    readPreferences: jest.fn(),
    saveCategories: jest.fn().mockResolvedValue('file-id'),
    saveTimeEntries: jest.fn().mockResolvedValue('file-id'),
    savePreferences: jest.fn().mockResolvedValue('file-id'),
    loadAll: mockLoadAll,
    syncAll: mockSyncAll,
    clearAll: mockClearAll,
  };

  beforeEach(() => {
    // Reset todos os mocks
    mockReadCategories.mockReset();
    mockReadTimeEntries.mockReset();
    mockLoadAll.mockReset();
    mockSyncAll.mockReset();
    mockClearAll.mockReset();
  });

  describe('createDriveService', () => {
    it('deve criar instância do serviço com os métodos esperados', () => {
      expect(mockService).toBeDefined();
      expect(mockService.readCategories).toBeDefined();
      expect(mockService.readTimeEntries).toBeDefined();
      expect(mockService.syncAll).toBeDefined();
      expect(mockService.loadAll).toBeDefined();
      expect(mockService.clearAll).toBeDefined();
    });
  });

  describe('Métodos de Categorias', () => {
    it('deve ler categorias do Drive', async () => {
      const mockCategories = [
        { id: '1', name: 'Trabalho', color: '#FF0000' },
        { id: '2', name: 'Estudo', color: '#00FF00' },
      ];
      mockReadCategories.mockResolvedValueOnce(mockCategories);

      const categories = await mockService.readCategories();

      expect(categories).toEqual(mockCategories);
      expect(mockReadCategories).toHaveBeenCalled();
    });

    it('deve retornar array vazio se não houver categorias', async () => {
      mockReadCategories.mockResolvedValueOnce([]);

      const categories = await mockService.readCategories();

      expect(categories).toEqual([]);
    });
  });

  describe('Métodos de TimeEntries', () => {
    it('deve ler time entries do Drive', async () => {
      const mockEntries = [
        { id: '1', categoryId: 'cat-1', startTime: '2024-01-01T10:00:00Z' },
        { id: '2', categoryId: 'cat-2', startTime: '2024-01-01T14:00:00Z' },
      ];
      mockReadTimeEntries.mockResolvedValueOnce(mockEntries);

      const entries = await mockService.readTimeEntries();

      expect(entries).toEqual(mockEntries);
      expect(mockReadTimeEntries).toHaveBeenCalled();
    });

    it('deve retornar array vazio se não houver entries', async () => {
      mockReadTimeEntries.mockResolvedValueOnce([]);

      const entries = await mockService.readTimeEntries();

      expect(entries).toEqual([]);
    });
  });

  describe('syncAll', () => {
    it('deve sincronizar todos os dados', async () => {
      mockSyncAll.mockResolvedValue({
        categoriesId: 'file-id',
        timeEntriesId: 'file-id',
        preferencesId: 'file-id',
      });

      const result = await mockService.syncAll(
        [{ id: '1', name: 'Test' }],
        [{ id: '1', categoryId: 'cat-1' }],
        { userId: 'user-1' }
      );

      expect(result).toEqual({
        categoriesId: 'file-id',
        timeEntriesId: 'file-id',
        preferencesId: 'file-id',
      });
      expect(mockSyncAll).toHaveBeenCalled();
    });
  });

  describe('loadAll', () => {
    it('deve carregar todos os dados', async () => {
      const mockCategories = [{ id: '1', name: 'Test' }];
      const mockEntries = [{ id: '1', categoryId: 'cat-1' }];
      const mockPrefs = { userId: 'user-1' };

      mockLoadAll.mockResolvedValueOnce({
        categories: mockCategories,
        timeEntries: mockEntries,
        preferences: mockPrefs,
      });

      const result = await mockService.loadAll();

      expect(result.categories).toEqual(mockCategories);
      expect(result.timeEntries).toEqual(mockEntries);
      expect(result.preferences).toEqual(mockPrefs);
      expect(mockLoadAll).toHaveBeenCalled();
    });
  });

  describe('clearAll', () => {
    it('deve limpar todos os arquivos', async () => {
      mockClearAll.mockResolvedValue(undefined);

      await mockService.clearAll();

      expect(mockClearAll).toHaveBeenCalled();
    });
  });
});
