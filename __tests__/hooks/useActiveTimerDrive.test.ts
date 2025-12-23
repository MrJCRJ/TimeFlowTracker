/**
 * Testes para o hook useActiveTimerDrive
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useActiveTimerDrive } from '@/hooks/useActiveTimerDrive';
import type { ActiveTimerRecord, TimeEntry } from '@/types';

// Mock do device info
jest.mock('@/lib/device', () => ({
  getDeviceInfo: () => ({
    deviceId: 'test-device-123',
    deviceName: 'Test Device',
    platform: 'Windows',
    userAgent: 'TestBrowser/1.0',
  }),
}));

// Mock do fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useActiveTimerDrive', () => {
  const mockTimer: ActiveTimerRecord = {
    id: 'timer-123',
    categoryId: 'cat-123',
    userId: 'user-123',
    startTime: new Date().toISOString(),
    deviceId: 'test-device-123',
    deviceName: 'Test Device',
    notes: null,
    createdAt: new Date().toISOString(),
  };

  const mockTimeEntry: TimeEntry = {
    id: 'entry-123',
    categoryId: 'cat-123',
    userId: 'user-123',
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    duration: 3600,
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock padrão para lista vazia
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: [] }),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('inicialização', () => {
    it('deve inicializar com estado padrão', async () => {
      const { result } = renderHook(() => useActiveTimerDrive({ enablePolling: false }));

      expect(result.current.activeTimers).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('deve inicializar deviceInfo', async () => {
      const { result } = renderHook(() => useActiveTimerDrive({ enablePolling: false }));

      await waitFor(() => {
        expect(result.current.deviceInfo.deviceId).toBe('test-device-123');
        expect(result.current.deviceInfo.deviceName).toBe('Test Device');
        expect(result.current.deviceInfo.platform).toBe('Windows');
      });
    });
  });

  describe('refreshTimers', () => {
    it('deve buscar timers ativos', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockTimer] }),
      });

      const { result } = renderHook(() => useActiveTimerDrive({ enablePolling: false }));

      await act(async () => {
        await result.current.refreshTimers();
      });

      expect(result.current.activeTimers).toHaveLength(1);
      expect(result.current.activeTimers[0].id).toBe('timer-123');
    });

    it('deve tratar erro na requisição', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useActiveTimerDrive({ enablePolling: false }));

      await act(async () => {
        await result.current.refreshTimers();
      });

      expect(result.current.error).toBe('Erro ao buscar timers ativos');
    });
  });

  describe('startTimer', () => {
    it('deve iniciar um timer com sucesso', async () => {
      const onTimerStarted = jest.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockTimer }),
      });

      const { result } = renderHook(() =>
        useActiveTimerDrive({ enablePolling: false, onTimerStarted })
      );

      let timer: ActiveTimerRecord | null = null;
      await act(async () => {
        timer = await result.current.startTimer('cat-123', 'Test notes');
      });

      expect(timer).toBeTruthy();
      expect(timer?.categoryId).toBe('cat-123');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/drive/active-timer',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('start'),
        })
      );
      expect(onTimerStarted).toHaveBeenCalledWith(mockTimer);
    });

    it('deve tratar erro ao iniciar timer', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: false,
            error: { message: 'Timer já existe' },
          }),
      });

      const { result } = renderHook(() => useActiveTimerDrive({ enablePolling: false }));

      let timer: ActiveTimerRecord | null = null;
      await act(async () => {
        timer = await result.current.startTimer('cat-123');
      });

      expect(timer).toBeNull();
      expect(result.current.error).toBe('Timer já existe');
    });
  });

  describe('stopTimer', () => {
    it('deve parar um timer com sucesso', async () => {
      const onTimerStopped = jest.fn();

      // Primeiro retorna lista com timer
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockTimer] }),
      });

      const { result } = renderHook(() =>
        useActiveTimerDrive({ enablePolling: false, onTimerStopped })
      );

      // Carrega os timers
      await act(async () => {
        await result.current.refreshTimers();
      });

      // Mock para parar o timer
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockTimeEntry }),
      });

      let entry: TimeEntry | null = null;
      await act(async () => {
        entry = await result.current.stopTimer('cat-123', 'Completed');
      });

      expect(entry).toBeTruthy();
      expect(entry?.categoryId).toBe('cat-123');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/drive/active-timer',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('stop'),
        })
      );
      expect(onTimerStopped).toHaveBeenCalledWith(mockTimeEntry);
    });

    it('deve tratar erro ao parar timer', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: false,
            error: { message: 'Timer não encontrado' },
          }),
      });

      const { result } = renderHook(() => useActiveTimerDrive({ enablePolling: false }));

      let entry: TimeEntry | null = null;
      await act(async () => {
        entry = await result.current.stopTimer('cat-123');
      });

      expect(entry).toBeNull();
      expect(result.current.error).toBe('Timer não encontrado');
    });
  });

  describe('cancelTimer', () => {
    it('deve cancelar um timer com sucesso', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() => useActiveTimerDrive({ enablePolling: false }));

      let success = false;
      await act(async () => {
        success = await result.current.cancelTimer('cat-123');
      });

      expect(success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/drive/active-timer',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('cancel'),
        })
      );
    });

    it('deve tratar erro ao cancelar timer', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: false,
            error: { message: 'Erro ao cancelar' },
          }),
      });

      const { result } = renderHook(() => useActiveTimerDrive({ enablePolling: false }));

      let success = false;
      await act(async () => {
        success = await result.current.cancelTimer('cat-123');
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Erro ao cancelar');
    });
  });

  describe('getActiveTimer', () => {
    it('deve buscar timer ativo específico', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockTimer }),
      });

      const { result } = renderHook(() => useActiveTimerDrive({ enablePolling: false }));

      let timer: ActiveTimerRecord | null = null;
      await act(async () => {
        timer = await result.current.getActiveTimer('cat-123');
      });

      expect(timer).toBeTruthy();
      expect(timer?.categoryId).toBe('cat-123');
      expect(mockFetch).toHaveBeenCalledWith('/api/drive/active-timer?categoryId=cat-123');
    });

    it('deve retornar null quando não encontrar timer', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false }),
      });

      const { result } = renderHook(() => useActiveTimerDrive({ enablePolling: false }));

      let timer: ActiveTimerRecord | null = null;
      await act(async () => {
        timer = await result.current.getActiveTimer('cat-456');
      });

      expect(timer).toBeNull();
    });
  });

  describe('hasActiveTimer', () => {
    it('deve retornar true quando há timer ativo', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockTimer] }),
      });

      const { result } = renderHook(() => useActiveTimerDrive({ enablePolling: false }));

      await act(async () => {
        await result.current.refreshTimers();
      });

      expect(result.current.hasActiveTimer('cat-123')).toBe(true);
    });

    it('deve retornar false quando não há timer ativo', async () => {
      const { result } = renderHook(() => useActiveTimerDrive({ enablePolling: false }));

      expect(result.current.hasActiveTimer('cat-999')).toBe(false);
    });
  });

  describe('getTimerForCategory', () => {
    it('deve retornar o timer para a categoria', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockTimer] }),
      });

      const { result } = renderHook(() => useActiveTimerDrive({ enablePolling: false }));

      await act(async () => {
        await result.current.refreshTimers();
      });

      const timer = result.current.getTimerForCategory('cat-123');
      expect(timer).toBeTruthy();
      expect(timer?.id).toBe('timer-123');
    });

    it('deve retornar undefined quando não há timer', () => {
      const { result } = renderHook(() => useActiveTimerDrive({ enablePolling: false }));

      const timer = result.current.getTimerForCategory('cat-999');
      expect(timer).toBeUndefined();
    });
  });

  describe('polling', () => {
    it('deve fazer polling quando habilitado', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      renderHook(() => useActiveTimerDrive({ enablePolling: true, pollingInterval: 1000 }));

      // Busca inicial
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Avança o tempo para o primeiro polling
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    it('deve limpar intervalo quando desmontar', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const { unmount } = renderHook(() =>
        useActiveTimerDrive({ enablePolling: true, pollingInterval: 1000 })
      );

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('callback onRemoteTimerFound', () => {
    it('deve chamar callback quando encontrar timer de outro dispositivo', async () => {
      const remoteTimer: ActiveTimerRecord = {
        ...mockTimer,
        deviceId: 'outro-device-456',
        deviceName: 'Outro Device',
      };

      const onRemoteTimerFound = jest.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [remoteTimer] }),
      });

      const { result } = renderHook(() =>
        useActiveTimerDrive({ enablePolling: false, onRemoteTimerFound })
      );

      await act(async () => {
        await result.current.refreshTimers();
      });

      // O callback recebe o timer como parâmetro
      expect(onRemoteTimerFound).toHaveBeenCalled();
      expect(onRemoteTimerFound.mock.calls[0][0]).toMatchObject({
        deviceId: 'outro-device-456',
        deviceName: 'Outro Device',
      });
    });

    it('não deve chamar callback para timer do mesmo dispositivo', async () => {
      const onRemoteTimerFound = jest.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [mockTimer] }),
      });

      const { result } = renderHook(() =>
        useActiveTimerDrive({ enablePolling: false, onRemoteTimerFound })
      );

      await act(async () => {
        await result.current.refreshTimers();
      });

      expect(onRemoteTimerFound).not.toHaveBeenCalled();
    });
  });
});
