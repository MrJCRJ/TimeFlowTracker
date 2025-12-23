import { useCallback, useState } from 'react';
import { getDeviceInfo } from '@/lib/device';
import { ActiveTimerApiService } from '@/lib/services/active-timer-api';
import type { ActiveTimerRecord, TimeEntry } from '@/types';

/**
 * Hook para operações básicas do timer ativo
 */
export function useActiveTimerOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTimer = useCallback(
    async (categoryId: string, notes?: string): Promise<ActiveTimerRecord | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const deviceInfo = getDeviceInfo();
        const timer = await ActiveTimerApiService.startTimer(categoryId, deviceInfo, notes);

        return timer;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao iniciar timer';
        console.error('[useActiveTimerOperations] Erro ao iniciar timer:', err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const stopTimer = useCallback(
    async (categoryId: string, notes?: string): Promise<TimeEntry | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const deviceInfo = getDeviceInfo();
        const entry = await ActiveTimerApiService.stopTimer(categoryId, deviceInfo, notes);

        return entry;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao parar timer';
        console.error('[useActiveTimerOperations] Erro ao parar timer:', err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const cancelTimer = useCallback(async (categoryId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const deviceInfo = getDeviceInfo();
      const success = await ActiveTimerApiService.cancelTimer(categoryId, deviceInfo);

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao cancelar timer';
      console.error('[useActiveTimerOperations] Erro ao cancelar timer:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getActiveTimer = useCallback(
    async (categoryId: string): Promise<ActiveTimerRecord | null> => {
      try {
        return await ActiveTimerApiService.fetchActiveTimer(categoryId);
      } catch (err) {
        console.error('[useActiveTimerOperations] Erro ao buscar timer:', err);
        return null;
      }
    },
    []
  );

  return {
    isLoading,
    error,
    startTimer,
    stopTimer,
    cancelTimer,
    getActiveTimer,
    clearError: () => setError(null),
  };
}
