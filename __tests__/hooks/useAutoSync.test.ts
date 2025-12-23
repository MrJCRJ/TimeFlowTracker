/**
 * Testes para o hook useAutoSync
 */

import { renderHook, act } from '@testing-library/react';
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

describe('useAutoSync', () => {
  const mockSession = {
    accessToken: 'mock-token',
    user: { id: 'user-1' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({ data: mockSession });
    mockUseTimerStore.mockReturnValue({
      timeEntries: [],
      activeEntry: null,
      isRunning: false,
      setTimeEntries: jest.fn(),
    });
    mockUseCategoryStore.mockReturnValue({
      categories: [],
      setCategories: jest.fn(),
    });
    mockUseNotificationStore.mockReturnValue({
      addNotification: jest.fn(),
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    });
  });

  it('deve retornar objeto com métodos de sincronização', () => {
    const { result } = renderHook(() => useAutoSync());

    expect(result.current).toHaveProperty('syncToCloud');
    expect(result.current).toHaveProperty('syncFromCloud');
    expect(result.current).toHaveProperty('isSyncing');
    expect(result.current).toHaveProperty('lastSync');
    expect(typeof result.current.syncToCloud).toBe('function');
    expect(typeof result.current.syncFromCloud).toBe('function');
  });

  it('deve aceitar configuração customizada', () => {
    const { result } = renderHook(() => useAutoSync({ autoSync: false, syncInterval: 10 }));

    expect(result.current).toBeDefined();
  });

  it('deve sincronizar dados quando syncToCloud é chamado', async () => {
    const { result } = renderHook(() => useAutoSync({ autoSync: false })); // Desabilitar auto-sync

    await act(async () => {
      await result.current.syncToCloud();
    });

    // Verifica se foi chamado com backup (POST)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/drive/backup',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );
  });

  it('não deve sincronizar sem token de acesso', async () => {
    mockUseSession.mockReturnValue({ data: null });

    const { result } = renderHook(() => useAutoSync());

    await act(async () => {
      const success = await result.current.syncToCloud();
      expect(success).toBe(false);
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('deve lidar com erro na sincronização', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAutoSync({ autoSync: false }));

    await act(async () => {
      const success = await result.current.syncToCloud();
      expect(success).toBe(false);
    });

    // Verifica se tentou fazer a chamada
    expect(global.fetch).toHaveBeenCalledWith('/api/drive/backup', expect.any(Object));
  });

  it('deve lidar com resposta de erro do servidor', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Server error' }),
    });

    const { result } = renderHook(() => useAutoSync({ autoSync: false }));

    await act(async () => {
      const success = await result.current.syncToCloud();
      expect(success).toBe(false);
    });
  });

  it('deve carregar dados da nuvem quando syncFromCloud é chamado', async () => {
    const mockSetCategories = jest.fn();
    const mockSetTimeEntries = jest.fn();

    mockUseCategoryStore.mockReturnValue({
      categories: [],
      setCategories: mockSetCategories,
    });

    mockUseTimerStore.mockReturnValue({
      timeEntries: [],
      activeEntry: null,
      isRunning: false,
      setTimeEntries: mockSetTimeEntries,
    });

    // Mock da resposta de sync
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

    const { result } = renderHook(() => useAutoSync({ autoSync: false }));

    await act(async () => {
      await result.current.syncFromCloud();
    });

    expect(mockSetCategories).toHaveBeenCalledWith([{ id: 'cat-1', name: 'Test Category' }]);
    expect(mockSetTimeEntries).toHaveBeenCalledWith([{ id: 'entry-1', categoryId: 'cat-1' }]);
  });

  it('deve sincronizar quando o timer iniciar', async () => {
    jest.useFakeTimers();

    // Mock do timer store inicialmente com timer parado
    const mockTimerStore = {
      timeEntries: [],
      activeEntry: null,
      isRunning: false,
      setTimeEntries: jest.fn(),
    };

    mockUseTimerStore.mockReturnValue(mockTimerStore);

    // Mock da resposta de backup
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    });

    renderHook(() => useAutoSync({ autoSync: false }));

    // Simular timer iniciando
    mockTimerStore.isRunning = true;

    // Mock do rerender não é necessário, o hook deve reagir à mudança

    // Avançar o tempo para executar o setTimeout
    jest.advanceTimersByTime(600);

    // Verificar se syncToCloud foi chamado (através do fetch)
    expect(global.fetch).toHaveBeenCalledWith('/api/drive/backup', expect.any(Object));

    jest.useRealTimers();
  });
});
