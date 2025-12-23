import { useState, useCallback, useRef, useEffect } from 'react';
import { getDeviceInfo } from '@/lib/device';
import { ActiveTimerApiService } from '@/lib/services/active-timer-api';
import { BackoffManager } from '@/lib/utils/backoff-manager';
import type { ActiveTimerRecord, DeviceInfo } from '@/types';

interface UseActiveTimerStateOptions {
  onRemoteTimerFound?: (timer: ActiveTimerRecord) => void;
}

/**
 * Hook para gerenciar o estado dos timers ativos
 */
export function useActiveTimerState(options: UseActiveTimerStateOptions = {}) {
  const { onRemoteTimerFound } = options;

  // Ref para a função callback
  const onRemoteTimerFoundRef = useRef(onRemoteTimerFound);
  onRemoteTimerFoundRef.current = onRemoteTimerFound;

  const [activeTimers, setActiveTimers] = useState<ActiveTimerRecord[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    deviceId: '',
    deviceName: '',
    platform: '',
    userAgent: '',
  });
  const [error, setError] = useState<string | null>(null);

  const previousTimersRef = useRef<ActiveTimerRecord[]>([]);
  const backoffManager = useRef(new BackoffManager());

  // Inicializa device info
  useEffect(() => {
    setDeviceInfo(getDeviceInfo());
  }, []);

  const updateTimers = useCallback(async () => {
    try {
      setError(null);

      const timers = await ActiveTimerApiService.fetchActiveTimers();
      setActiveTimers(timers);

      // Reset backoff em caso de sucesso
      backoffManager.current.reset();

      // Detecta timers de outros dispositivos
      if (onRemoteTimerFoundRef.current) {
        const currentDeviceId = getDeviceInfo().deviceId;
        const newRemoteTimers = timers.filter(
          (t) =>
            t.deviceId !== currentDeviceId &&
            !previousTimersRef.current.some((pt) => pt.id === t.id)
        );
        newRemoteTimers.forEach(onRemoteTimerFoundRef.current);
      }

      previousTimersRef.current = timers;
    } catch (err) {
      // Verifica se é erro de quota
      if (BackoffManager.isQuotaError(err)) {
        console.warn('[useActiveTimerState] Quota exceeded detectado');
        setError('Limite de quota do Google Drive excedido. Tente novamente mais tarde.');
        return;
      }

      console.error('[useActiveTimerState] Erro ao buscar timers:', err);
      setError('Erro ao buscar timers ativos');
    }
  }, []); // Remove dependência para evitar re-renders

  const addTimer = useCallback((timer: ActiveTimerRecord) => {
    setActiveTimers((prev) => [...prev, timer]);
  }, []);

  const removeTimer = useCallback((categoryId: string) => {
    setActiveTimers((prev) => prev.filter((t) => t.categoryId !== categoryId));
  }, []);

  const hasActiveTimer = useCallback(
    (categoryId: string): boolean => {
      return activeTimers.some((t) => t.categoryId === categoryId);
    },
    [activeTimers]
  );

  const getTimerForCategory = useCallback(
    (categoryId: string): ActiveTimerRecord | undefined => {
      return activeTimers.find((t) => t.categoryId === categoryId);
    },
    [activeTimers]
  );

  return {
    activeTimers,
    deviceInfo,
    error,
    updateTimers,
    addTimer,
    removeTimer,
    hasActiveTimer,
    getTimerForCategory,
    clearError: () => setError(null),
  };
}
