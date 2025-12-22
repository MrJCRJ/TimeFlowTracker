/**
 * Testes para o componente TimerSync
 */

import { render } from '@testing-library/react';
import { TimerSync } from '@/components/timer/TimerSync';

// Mock dos hooks
jest.mock('@/stores/timerStore', () => ({
  useTimerStore: jest.fn(),
}));

jest.mock('@/hooks/useAutoSync', () => ({
  useAutoSync: jest.fn(),
}));

const mockUseTimerStore = require('@/stores/timerStore').useTimerStore;
const mockUseAutoSync = require('@/hooks/useAutoSync').useAutoSync;

describe('TimerSync', () => {
  const mockUpdateElapsed = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTimerStore.mockReturnValue({
      isRunning: false,
      updateElapsed: mockUpdateElapsed,
    });

    mockUseAutoSync.mockReturnValue({
      syncToCloud: jest.fn(),
      syncFromCloud: jest.fn(),
      isSyncing: false,
      lastSync: null,
    });
  });

  describe('Renderização', () => {
    it('deve renderizar sem conteúdo visível', () => {
      const { container } = render(<TimerSync />);

      expect(container.firstChild).toBeNull();
    });

    it('deve chamar useAutoSync com configuração padrão', () => {
      render(<TimerSync />);

      expect(mockUseAutoSync).toHaveBeenCalledWith({
        autoSync: true,
        syncInterval: 5,
        showNotifications: false,
      });
    });
  });

  describe('Atualização de tempo', () => {
    it('não deve atualizar tempo quando timer não está rodando', () => {
      mockUseTimerStore.mockReturnValue({
        isRunning: false,
        updateElapsed: mockUpdateElapsed,
      });

      render(<TimerSync />);

      expect(mockUpdateElapsed).not.toHaveBeenCalled();
    });

    it('deve atualizar tempo quando timer inicia', () => {
      mockUseTimerStore.mockReturnValue({
        isRunning: true,
        updateElapsed: mockUpdateElapsed,
      });

      render(<TimerSync />);

      expect(mockUpdateElapsed).toHaveBeenCalledTimes(1);
    });
  });
});
