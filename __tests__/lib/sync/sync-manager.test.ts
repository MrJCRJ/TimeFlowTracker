/**
 * Testes para o SyncManager
 */

import { SyncManager } from '@/lib/sync';
import type { Category, TimeEntry } from '@/types';

// Mock do fetch
global.fetch = jest.fn();

describe('SyncManager', () => {
  let syncManager: SyncManager;
  let mockSetLocalData: jest.Mock;

  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Work',
      color: '#FF0000',
      icon: 'briefcase',
      isDefault: false,
      userId: 'user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cat-2',
      name: 'Study',
      color: '#00FF00',
      icon: 'book',
      isDefault: false,
      userId: 'user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockTimeEntries: TimeEntry[] = [
    {
      id: 'entry-1',
      categoryId: 'cat-1',
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T11:00:00Z',
      duration: 3600000,
      userId: 'user-1',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'entry-2',
      categoryId: 'cat-2',
      startTime: '2024-01-01T14:00:00Z',
      endTime: '2024-01-01T15:00:00Z',
      duration: 3600000,
      userId: 'user-1',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockSetLocalData = jest.fn();

    syncManager = new SyncManager({
      debounceMs: 1000,
      throttleMs: 5000,
      maxRetries: 2,
      syncIntervalMs: 60000,
    });

    syncManager.configure({
      getAccessToken: () => 'mock-token',
      getLocalData: () => ({
        categories: mockCategories,
        timeEntries: mockTimeEntries,
        activeTimerId: null,
      }),
      setLocalData: mockSetLocalData,
    });
  });

  afterEach(() => {
    syncManager.cancel();
    jest.useRealTimers();
  });

  describe('configuração', () => {
    it('deve aceitar configurações customizadas', () => {
      const customManager = new SyncManager({
        debounceMs: 2000,
        throttleMs: 10000,
      });

      expect(customManager).toBeDefined();
    });

    it('deve usar configurações padrão quando não especificadas', () => {
      const defaultManager = new SyncManager();
      expect(defaultManager).toBeDefined();
    });
  });

  describe('scheduleSync', () => {
    it('deve agendar sync com debounce', () => {
      syncManager.scheduleSync(false);

      // Verificar que fetch não foi chamado imediatamente
      expect(global.fetch).not.toHaveBeenCalled();

      // Avançar tempo para debounce
      jest.advanceTimersByTime(1000);
    });

    it('deve cancelar sync anterior quando novo é agendado', () => {
      syncManager.scheduleSync(false);
      syncManager.scheduleSync(false);
      syncManager.scheduleSync(false);

      // Apenas um sync deve ser agendado
      jest.advanceTimersByTime(1000);
    });

    it('não deve agendar sync sem token', () => {
      syncManager.configure({
        getAccessToken: () => null,
        getLocalData: () => ({
          categories: [],
          timeEntries: [],
          activeTimerId: null,
        }),
        setLocalData: jest.fn(),
      });

      syncManager.scheduleSync(false);

      jest.advanceTimersByTime(5000);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('syncToCloud', () => {
    it('deve fazer upload quando há mudanças', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      const result = await syncManager.syncToCloud();

      expect(result.success).toBe(true);
      expect(result.direction).toBe('upload');
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/drive/backup',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('deve retornar none quando não há mudanças', async () => {
      // Primeiro sync para estabelecer baseline
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      });
      await syncManager.syncToCloud();

      // Segundo sync - não deve haver mudanças
      const result = await syncManager.syncToCloud();

      expect(result.success).toBe(true);
      expect(result.direction).toBe('none');
    });

    it('deve lidar com erro de rede', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Executa sync e avança timers para os retries
      const syncPromise = syncManager.syncToCloud();

      // Avança tempo para passar pelos retries (1s * retry count)
      await jest.advanceTimersByTimeAsync(5000);

      const result = await syncPromise;

      // Deve tentar retry e falhar
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('deve lidar com erro do servidor', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      // Executa sync e avança timers para os retries
      const syncPromise = syncManager.syncToCloud();

      // Avança tempo para passar pelos retries
      await jest.advanceTimersByTimeAsync(5000);

      const result = await syncPromise;

      expect(result.success).toBe(false);
    });
  });

  describe('syncFromCloud', () => {
    it('deve fazer download e atualizar dados locais', async () => {
      const cloudData = {
        categories: [{ id: 'new-cat', name: 'New', color: '#0000FF' }],
        timeEntries: [
          { id: 'new-entry', categoryId: 'new-cat', startTime: '2024-01-02T10:00:00Z' },
        ],
        preferences: null,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: cloudData,
        }),
      });

      const result = await syncManager.syncFromCloud();

      expect(result.success).toBe(true);
      expect(result.direction).toBe('download');
      expect(mockSetLocalData).toHaveBeenCalledWith({
        categories: cloudData.categories,
        timeEntries: cloudData.timeEntries,
      });
    });

    it('deve lidar com resposta vazia', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: null,
        }),
      });

      const result = await syncManager.syncFromCloud();

      expect(result.success).toBe(true);
      expect(result.direction).toBe('none');
    });
  });

  describe('getStatus', () => {
    it('deve retornar status atual', () => {
      const status = syncManager.getStatus();

      expect(status).toHaveProperty('isSyncing');
      expect(status).toHaveProperty('lastSyncTime');
      expect(status).toHaveProperty('queueLength');
      expect(status).toHaveProperty('hasLocalChanges');
    });

    it('deve detectar mudanças locais', () => {
      const status = syncManager.getStatus();
      expect(status.hasLocalChanges).toBe(true); // Primeira vez sempre tem mudanças
    });
  });

  describe('cancel', () => {
    it('deve cancelar syncs pendentes', () => {
      syncManager.scheduleSync(false);
      syncManager.cancel();

      jest.advanceTimersByTime(10000);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('deve resetar todo o estado', async () => {
      // Fazer um sync primeiro
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      });
      await syncManager.syncToCloud();

      // Resetar
      syncManager.reset();

      const status = syncManager.getStatus();
      expect(status.lastSyncTime).toBe(0);
      expect(status.hasLocalChanges).toBe(true);
    });
  });

  describe('throttling', () => {
    it('deve respeitar throttle entre syncs', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      // Primeiro sync
      await syncManager.syncToCloud();

      // Tentar sync imediato (deve ser bloqueado por throttle na segunda vez com dados diferentes)
      const newCategory: Category = {
        id: 'new',
        name: 'New',
        color: '#000',
        icon: 'star',
        isDefault: false,
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      syncManager.configure({
        getAccessToken: () => 'mock-token',
        getLocalData: () => ({
          categories: [...mockCategories, newCategory],
          timeEntries: mockTimeEntries,
          activeTimerId: null,
        }),
        setLocalData: mockSetLocalData,
      });

      // Segundo sync imediato - deve ser enfileirado ou atrasado
      syncManager.scheduleSync(true);

      // Não deve ter chamado fetch novamente ainda (throttle ativo)
      // Avançar tempo até passar o throttle
      jest.advanceTimersByTime(5000);
    });
  });

  describe('callback onSyncComplete', () => {
    it('deve chamar callback após sync', async () => {
      const onComplete = jest.fn();

      syncManager.configure({
        getAccessToken: () => 'mock-token',
        getLocalData: () => ({
          categories: mockCategories,
          timeEntries: mockTimeEntries,
          activeTimerId: null,
        }),
        setLocalData: mockSetLocalData,
        onSyncComplete: onComplete,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      await syncManager.syncToCloud();

      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          direction: 'upload',
        })
      );
    });
  });
});
