import { useCallback } from 'react';
import { useRef } from 'react';
import { useActiveTimerOperations } from './timer/useActiveTimerOperations';
import { useActiveTimerState } from './timer/useActiveTimerState';
import { usePollingWithBackoff } from './timer/usePollingWithBackoff';
import type { ActiveTimerRecord, TimeEntry, DeviceInfo } from '@/types';

interface UseActiveTimerDriveOptions {
  /** Intervalo de polling para verificar timers ativos (ms) */
  pollingInterval?: number;
  /** Habilitar polling automático */
  enablePolling?: boolean;
  /** Callback quando um timer é iniciado */
  onTimerStarted?: (timer: ActiveTimerRecord) => void;
  /** Callback quando um timer é parado */
  onTimerStopped?: (entry: TimeEntry) => void;
  /** Callback quando um timer é encontrado de outro dispositivo */
  onRemoteTimerFound?: (timer: ActiveTimerRecord) => void;
}

interface UseActiveTimerDriveReturn {
  /** Timers ativos no Drive */
  activeTimers: ActiveTimerRecord[];
  /** Se está carregando */
  isLoading: boolean;
  /** Erro, se houver */
  error: string | null;
  /** Informações do dispositivo atual */
  deviceInfo: DeviceInfo;
  /** Inicia um timer no Drive */
  startTimer: (categoryId: string, notes?: string) => Promise<ActiveTimerRecord | null>;
  /** Para um timer no Drive */
  stopTimer: (categoryId: string, notes?: string) => Promise<TimeEntry | null>;
  /** Cancela um timer no Drive */
  cancelTimer: (categoryId: string) => Promise<boolean>;
  /** Busca timer ativo de uma categoria */
  getActiveTimer: (categoryId: string) => Promise<ActiveTimerRecord | null>;
  /** Atualiza lista de timers ativos */
  refreshTimers: () => Promise<void>;
  /** Verifica se há timer ativo para uma categoria */
  hasActiveTimer: (categoryId: string) => boolean;
  /** Retorna o timer ativo para uma categoria */
  getTimerForCategory: (categoryId: string) => ActiveTimerRecord | undefined;
}

/**
 * Hook para gerenciar timers ativos via Google Drive
 * Permite sincronização entre múltiplos dispositivos
 */
export function useActiveTimerDrive(
  options: UseActiveTimerDriveOptions = {}
): UseActiveTimerDriveReturn {
  const {
    pollingInterval = 300000, // 5 minutos
    enablePolling = true,
    onTimerStarted,
    onTimerStopped,
    onRemoteTimerFound,
  } = options;

  // Refs para callbacks
  const onTimerStartedRef = useRef(onTimerStarted);
  const onTimerStoppedRef = useRef(onTimerStopped);
  onTimerStartedRef.current = onTimerStarted;
  onTimerStoppedRef.current = onTimerStopped;

  // Hooks para operações e estado
  const operations = useActiveTimerOperations();
  const state = useActiveTimerState({ onRemoteTimerFound });

  // Combina erros de ambos os hooks
  const combinedError = operations.error || state.error;

  // Polling com backoff
  usePollingWithBackoff({
    interval: pollingInterval,
    enabled: enablePolling,
    onPoll: state.updateTimers,
    onError: (error) => {
      // O erro já é gerenciado pelo state hook
      console.error('[useActiveTimerDrive] Erro no polling:', error);
    },
  });

  // Operações do timer com callbacks
  const startTimer = useCallback(
    async (categoryId: string, notes?: string): Promise<ActiveTimerRecord | null> => {
      const timer = await operations.startTimer(categoryId, notes);
      if (timer) {
        state.addTimer(timer);
        onTimerStartedRef.current?.(timer);
      }
      return timer;
    },
    [operations, state]
  );

  const stopTimer = useCallback(
    async (categoryId: string, notes?: string): Promise<TimeEntry | null> => {
      const entry = await operations.stopTimer(categoryId, notes);
      if (entry) {
        state.removeTimer(categoryId);
        onTimerStoppedRef.current?.(entry);
      }
      return entry;
    },
    [operations, state]
  );

  const cancelTimer = useCallback(
    async (categoryId: string): Promise<boolean> => {
      const success = await operations.cancelTimer(categoryId);
      if (success) {
        state.removeTimer(categoryId);
      }
      return success;
    },
    [operations, state]
  );

  const getActiveTimer = useCallback(
    (categoryId: string) => operations.getActiveTimer(categoryId),
    [operations]
  );

  const refreshTimers = useCallback(() => state.updateTimers(), [state]);

  return {
    activeTimers: state.activeTimers,
    isLoading: operations.isLoading,
    error: combinedError,
    deviceInfo: state.deviceInfo,
    startTimer,
    stopTimer,
    cancelTimer,
    getActiveTimer,
    refreshTimers,
    hasActiveTimer: state.hasActiveTimer,
    getTimerForCategory: state.getTimerForCategory,
  };
}
