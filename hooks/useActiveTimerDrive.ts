import { useState, useCallback, useEffect, useRef } from 'react';
import { getDeviceInfo } from '@/lib/device';
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
    pollingInterval = 300000, // 5 minutos (era 30 segundos)
    enablePolling = true,
    onTimerStarted,
    onTimerStopped,
    onRemoteTimerFound,
  } = options;

  const [activeTimers, setActiveTimers] = useState<ActiveTimerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    deviceId: '',
    deviceName: '',
    platform: '',
    userAgent: '',
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isPollingRef = useRef(false); // Flag específica para polling
  const previousTimersRef = useRef<ActiveTimerRecord[]>([]);
  const backoffRef = useRef({ count: 0, until: 0 }); // Para backoff em caso de quota exceeded

  // Inicializa device info no cliente
  useEffect(() => {
    setDeviceInfo(getDeviceInfo());
  }, []);

  /**
   * Busca todos os timers ativos do Drive
   */
  const refreshTimers = useCallback(async () => {
    try {
      setError(null);

      const response = await fetch('/api/drive/active-timer');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const timers = data.data as ActiveTimerRecord[];
        setActiveTimers(timers);

        // Reset backoff em caso de sucesso
        backoffRef.current = { count: 0, until: 0 };

        // Detecta timers iniciados por outros dispositivos
        if (onRemoteTimerFound) {
          const currentDeviceId = getDeviceInfo().deviceId;
          const newRemoteTimers = timers.filter(
            (t) =>
              t.deviceId !== currentDeviceId &&
              !previousTimersRef.current.some((pt) => pt.id === t.id)
          );
          newRemoteTimers.forEach(onRemoteTimerFound);
        }

        previousTimersRef.current = timers;
      }
    } catch (err) {
      // Verifica se é erro de quota exceeded
      const isQuotaError =
        err instanceof Error &&
        (err.message.includes('Quota exceeded') ||
          err.message.includes('rateLimitExceeded') ||
          err.message.includes('403'));

      if (isQuotaError) {
        console.warn('[useActiveTimerDrive] Quota exceeded detectado em refreshTimers');
        setError('Limite de quota do Google Drive excedido. Tente novamente mais tarde.');
        return;
      }

      console.error('[useActiveTimerDrive] Erro ao buscar timers:', err);
      setError('Erro ao buscar timers ativos');
    }
  }, [onRemoteTimerFound]);

  /**
   * Busca timers via polling (com deduplicação)
   */
  const pollTimers = useCallback(async () => {
    // Verifica se está em backoff por quota exceeded
    const now = Date.now();
    if (backoffRef.current.until > now) {
      console.log('[useActiveTimerDrive] Em backoff por quota exceeded, pulando polling');
      return;
    }

    // Evita múltiplas polls simultâneas
    if (isPollingRef.current) {
      return;
    }

    // Cancela request anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Cria novo AbortController
    abortControllerRef.current = new AbortController();
    isPollingRef.current = true;

    try {
      setError(null);

      const response = await fetch('/api/drive/active-timer', {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const timers = data.data as ActiveTimerRecord[];
        setActiveTimers(timers);

        // Reset backoff em caso de sucesso
        backoffRef.current = { count: 0, until: 0 };

        // Detecta timers iniciados por outros dispositivos
        if (onRemoteTimerFound) {
          const currentDeviceId = getDeviceInfo().deviceId;
          const newRemoteTimers = timers.filter(
            (t) =>
              t.deviceId !== currentDeviceId &&
              !previousTimersRef.current.some((pt) => pt.id === t.id)
          );
          newRemoteTimers.forEach(onRemoteTimerFound);
        }

        previousTimersRef.current = timers;
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request foi cancelada, isso é normal
        return;
      }

      // Verifica se é erro de quota exceeded
      const isQuotaError =
        err instanceof Error &&
        (err.message.includes('Quota exceeded') ||
          err.message.includes('rateLimitExceeded') ||
          err.message.includes('403'));

      if (isQuotaError) {
        // Implementa backoff exponencial
        const backoffCount = backoffRef.current.count + 1;
        const backoffMinutes = Math.min(Math.pow(2, backoffCount), 60); // Máximo 1 hora
        const backoffUntil = now + backoffMinutes * 60 * 1000;

        backoffRef.current = { count: backoffCount, until: backoffUntil };

        console.warn(
          `[useActiveTimerDrive] Quota exceeded detectado. Backoff por ${backoffMinutes} minutos até ${new Date(backoffUntil).toLocaleString()}`
        );
        setError(`Limite de quota excedido. Sincronização pausada por ${backoffMinutes} minutos.`);
        return;
      }

      console.error('[useActiveTimerDrive] Erro ao buscar timers:', err);
      setError('Erro ao buscar timers ativos');
    } finally {
      isPollingRef.current = false;
    }
  }, [onRemoteTimerFound]);

  /**
   * Inicia um timer no Drive
   */
  const startTimer = useCallback(
    async (categoryId: string, notes?: string): Promise<ActiveTimerRecord | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const currentDeviceInfo = getDeviceInfo();

        const response = await fetch('/api/drive/active-timer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'start',
            categoryId,
            deviceInfo: currentDeviceInfo,
            notes,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Erro ao iniciar timer');
          return null;
        }

        const timer = data.data as ActiveTimerRecord;
        setActiveTimers((prev) => [...prev, timer]);
        onTimerStarted?.(timer);

        return timer;
      } catch (err) {
        console.error('[useActiveTimerDrive] Erro ao iniciar timer:', err);
        setError('Erro ao iniciar timer');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [onTimerStarted]
  );

  /**
   * Para um timer no Drive
   */
  const stopTimer = useCallback(
    async (categoryId: string, notes?: string): Promise<TimeEntry | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const currentDeviceInfo = getDeviceInfo();

        const response = await fetch('/api/drive/active-timer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'stop',
            categoryId,
            deviceInfo: currentDeviceInfo,
            notes,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error?.message || 'Erro ao parar timer');
          return null;
        }

        const entry = data.data as TimeEntry;
        setActiveTimers((prev) => prev.filter((t) => t.categoryId !== categoryId));
        onTimerStopped?.(entry);

        return entry;
      } catch (err) {
        console.error('[useActiveTimerDrive] Erro ao parar timer:', err);
        setError('Erro ao parar timer');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [onTimerStopped]
  );

  /**
   * Cancela um timer sem registrar entrada
   */
  const cancelTimer = useCallback(async (categoryId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const currentDeviceInfo = getDeviceInfo();

      const response = await fetch('/api/drive/active-timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          categoryId,
          deviceInfo: currentDeviceInfo,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || 'Erro ao cancelar timer');
        return false;
      }

      setActiveTimers((prev) => prev.filter((t) => t.categoryId !== categoryId));
      return true;
    } catch (err) {
      console.error('[useActiveTimerDrive] Erro ao cancelar timer:', err);
      setError('Erro ao cancelar timer');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Busca timer ativo de uma categoria específica
   */
  const getActiveTimer = useCallback(
    async (categoryId: string): Promise<ActiveTimerRecord | null> => {
      try {
        const response = await fetch(`/api/drive/active-timer?categoryId=${categoryId}`);
        const data = await response.json();

        if (!data.success) {
          return null;
        }

        return data.data as ActiveTimerRecord;
      } catch (err) {
        console.error('[useActiveTimerDrive] Erro ao buscar timer:', err);
        return null;
      }
    },
    []
  );

  /**
   * Verifica se há timer ativo para uma categoria
   */
  const hasActiveTimer = useCallback(
    (categoryId: string): boolean => {
      return activeTimers.some((t) => t.categoryId === categoryId);
    },
    [activeTimers]
  );

  /**
   * Retorna o timer ativo para uma categoria
   */
  const getTimerForCategory = useCallback(
    (categoryId: string): ActiveTimerRecord | undefined => {
      return activeTimers.find((t) => t.categoryId === categoryId);
    },
    [activeTimers]
  );

  // Polling para verificar timers ativos
  useEffect(() => {
    if (!enablePolling) {
      // Cancela polling e requests pendentes quando desabilitado
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      isPollingRef.current = false;
      return;
    }

    // Busca inicial
    refreshTimers();

    // Configura polling
    pollingRef.current = setInterval(pollTimers, pollingInterval);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      isPollingRef.current = false;
    };
  }, [enablePolling, pollingInterval, refreshTimers, pollTimers]);

  return {
    activeTimers,
    isLoading,
    error,
    deviceInfo,
    startTimer,
    stopTimer,
    cancelTimer,
    getActiveTimer,
    refreshTimers,
    hasActiveTimer,
    getTimerForCategory,
  };
}
