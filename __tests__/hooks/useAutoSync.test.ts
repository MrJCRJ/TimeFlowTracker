/**
 * Testes para o hook useAutoSync
 * Usa injeção de dependência para passar mock do SyncManager
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSync } from '@/hooks/useAutoSync';

// Mock do next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock dos stores
jest.mock('@/stores/timerStore', () => ({
  useTimerStore: jest.fn(),
}));

jest.mock('@/stores/categoryStore', () => ({
  useCategoryStore: jest.fn(),
}));

jest.mock('@/stores/notificationStore', () => ({
  useNotificationStore: jest.fn(),
}));

// Mock do fetch
global.fetch = jest.fn();

const mockUseSession = require('next-auth/react').useSession;
const mockUseTimerStore = require('@/stores/timerStore').useTimerStore;
const mockUseCategoryStore = require('@/stores/categoryStore').useCategoryStore;
const mockUseNotificationStore = require('@/stores/notificationStore').useNotificationStore;

// Função helper para criar mock do SyncManager
function createMockSyncManager() {
  return {
    configure: jest.fn(),
    syncToCloud: jest.fn().mockResolvedValue({ success: true, direction: 'upload' }),
    syncFromCloud: jest.fn().mockResolvedValue({ success: true, direction: 'download' }),
    scheduleSync: jest.fn(),
    cancel: jest.fn(),
    getStatus: jest.fn().mockReturnValue({
      isSyncing: false,
      lastSyncTime: 0,
      queueLength: 0,
      hasLocalChanges: false,
    }),
  };
}

describe('useAutoSync', () => {
  const mockSession = {
    accessToken: 'mock-token',
    user: { id: 'user-1' },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSyncManager: any;

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();

    // Cria novo mock do SyncManager para cada teste
    mockSyncManager = createMockSyncManager();

    mockUseSession.mockReturnValue({ data: mockSession });

    // Mock selector-based stores
    mockUseTimerStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        timeEntries: [],
        activeEntry: null,
        isRunning: false,
        setTimeEntries: jest.fn(),
        restoreActiveTimer: jest.fn(),
      };
      return selector ? selector(state) : state;
    });

    mockUseCategoryStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        categories: [],
        setCategories: jest.fn(),
      };
      return selector ? selector(state) : state;
    });

    mockUseNotificationStore.mockReturnValue({
      addNotification: jest.fn(),
    });
  });

  it('deve retornar objeto com métodos de sincronização', () => {
    const { result } = renderHook(() => useAutoSync({ syncManagerInstance: mockSyncManager }));

    expect(result.current).toHaveProperty('syncToCloud');
    expect(result.current).toHaveProperty('syncFromCloud');
    expect(result.current).toHaveProperty('isSyncing');
    expect(result.current).toHaveProperty('lastSync');
    expect(result.current).toHaveProperty('getStatus');
    expect(typeof result.current.syncToCloud).toBe('function');
    expect(typeof result.current.syncFromCloud).toBe('function');
    expect(typeof result.current.getStatus).toBe('function');
  });

  it('deve aceitar configuração customizada', () => {
    const { result } = renderHook(() =>
      useAutoSync({
        autoSync: false,
        syncIntervalMinutes: 10,
        syncManagerInstance: mockSyncManager,
      })
    );

    expect(result.current).toBeDefined();
  });

  it('deve sincronizar dados quando syncToCloud é chamado', async () => {
    const { result } = renderHook(() =>
      useAutoSync({
        autoSync: false,
        syncManagerInstance: mockSyncManager,
      })
    );

    await act(async () => {
      const success = await result.current.syncToCloud();
      expect(success).toBe(true);
    });

    expect(mockSyncManager.syncToCloud).toHaveBeenCalled();
  });

  it('não deve sincronizar sem token de acesso', async () => {
    mockUseSession.mockReturnValue({ data: null });

    const { result } = renderHook(() =>
      useAutoSync({
        syncManagerInstance: mockSyncManager,
      })
    );

    await act(async () => {
      const success = await result.current.syncToCloud();
      expect(success).toBe(false);
    });

    expect(mockSyncManager.syncToCloud).not.toHaveBeenCalled();
  });

  it('deve lidar com erro na sincronização', async () => {
    mockSyncManager.syncToCloud.mockResolvedValueOnce({
      success: false,
      direction: 'upload',
      error: 'Network error',
    });

    const { result } = renderHook(() =>
      useAutoSync({
        autoSync: false,
        syncManagerInstance: mockSyncManager,
      })
    );

    await act(async () => {
      const success = await result.current.syncToCloud();
      expect(success).toBe(false);
    });

    expect(mockSyncManager.syncToCloud).toHaveBeenCalled();
  });

  it('deve lidar com resposta de erro do servidor', async () => {
    mockSyncManager.syncToCloud.mockResolvedValueOnce({
      success: false,
      direction: 'upload',
      error: 'Server error',
    });

    const { result } = renderHook(() =>
      useAutoSync({
        autoSync: false,
        syncManagerInstance: mockSyncManager,
      })
    );

    await act(async () => {
      const success = await result.current.syncToCloud();
      expect(success).toBe(false);
    });
  });

  it('deve carregar dados da nuvem quando syncFromCloud é chamado', async () => {
    // Mock da resposta para restauração de timer
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        data: {
          categories: [{ id: 'cat-1', name: 'Test Category' }],
          timeEntries: [{ id: 'entry-1', categoryId: 'cat-1' }],
        },
      }),
    });

    const { result } = renderHook(() =>
      useAutoSync({
        autoSync: false,
        syncManagerInstance: mockSyncManager,
      })
    );

    await act(async () => {
      const success = await result.current.syncFromCloud();
      expect(success).toBe(true);
    });

    expect(mockSyncManager.syncFromCloud).toHaveBeenCalled();
  });

  it('deve sincronizar quando o timer iniciar', async () => {
    jest.useFakeTimers();

    // Estado inicial do timer
    let isRunningValue = false;

    mockUseTimerStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        timeEntries: [],
        activeEntry: null,
        isRunning: isRunningValue,
        setTimeEntries: jest.fn(),
        restoreActiveTimer: jest.fn(),
      };
      return selector ? selector(state) : state;
    });

    // Renderizar o hook com timer parado
    const { rerender } = renderHook(() =>
      useAutoSync({
        autoSync: false,
        syncManagerInstance: mockSyncManager,
      })
    );

    // Simular timer iniciando
    isRunningValue = true;

    // Re-renderizar para que o hook detecte a mudança
    rerender();

    // Avançar o tempo para executar o setTimeout
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });

    // Verificar se scheduleSync foi chamado
    await waitFor(() => {
      expect(mockSyncManager.scheduleSync).toHaveBeenCalledWith(true);
    });

    jest.useRealTimers();
  });

  it('deve configurar o SyncManager com callbacks corretos', () => {
    renderHook(() =>
      useAutoSync({
        syncManagerInstance: mockSyncManager,
      })
    );

    // Verifica se configure foi chamado
    expect(mockSyncManager.configure).toHaveBeenCalled();

    // Verifica se os callbacks estão corretos
    const configCall = mockSyncManager.configure.mock.calls[0][0];
    expect(configCall).toHaveProperty('getAccessToken');
    expect(configCall).toHaveProperty('getLocalData');
    expect(configCall).toHaveProperty('setLocalData');
    expect(typeof configCall.getAccessToken).toBe('function');
  });

  it('deve retornar status do SyncManager', () => {
    const { result } = renderHook(() =>
      useAutoSync({
        syncManagerInstance: mockSyncManager,
      })
    );

    const status = result.current.getStatus();
    expect(status).toEqual({
      isSyncing: false,
      lastSyncTime: 0,
      queueLength: 0,
      hasLocalChanges: false,
    });
  });
});
