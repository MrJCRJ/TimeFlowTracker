import { useCallback, useEffect, useRef } from 'react';
import { BackoffManager } from '@/lib/utils/backoff-manager';

interface UsePollingOptions {
  interval: number;
  enabled: boolean;
  onPoll: () => Promise<void> | void;
  onError?: (error: string) => void;
}

/**
 * Hook customizado para polling com backoff automático
 */
export function usePollingWithBackoff({ interval, enabled, onPoll, onError }: UsePollingOptions) {
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isPollingRef = useRef(false);
  const backoffManager = useRef(new BackoffManager());

  // Refs para as funções callback para evitar re-renders
  const onPollRef = useRef(onPoll);
  const onErrorRef = useRef(onError);

  // Atualiza as refs quando as funções mudam
  onPollRef.current = onPoll;
  onErrorRef.current = onError;

  const poll = useCallback(async () => {
    // Verifica se está em backoff
    if (backoffManager.current.isInBackoff()) {
      console.log('[usePollingWithBackoff] Em backoff, pulando polling');
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
      await onPollRef.current();

      // Reset backoff em caso de sucesso
      backoffManager.current.reset();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request foi cancelada, isso é normal
        return;
      }

      // Verifica se é erro de quota
      if (BackoffManager.isQuotaError(err)) {
        const { minutes, until } = backoffManager.current.triggerBackoff();

        console.warn(
          `[usePollingWithBackoff] Quota exceeded detectado. Backoff por ${minutes} minutos até ${until.toLocaleString()}`
        );

        onErrorRef.current?.(
          `Limite de quota excedido. Sincronização pausada por ${minutes} minutos.`
        );
        return;
      }

      console.error('[usePollingWithBackoff] Erro no polling:', err);
      onErrorRef.current?.('Erro durante sincronização');
    } finally {
      isPollingRef.current = false;
    }
  }, []); // Remove dependências para evitar re-renders

  // Configura o polling
  useEffect(() => {
    if (!enabled) {
      // Cancela polling quando desabilitado
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

    // Executa poll inicial
    poll();

    // Configura polling periódico
    pollingRef.current = setInterval(poll, interval);

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
  }, [enabled, interval, poll]);

  return {
    isPolling: isPollingRef.current,
    backoffState: backoffManager.current.getState(),
    forcePoll: poll,
  };
}
