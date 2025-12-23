/**
 * Utilitário para gerenciar backoff exponencial
 */
export interface BackoffState {
  count: number;
  until: number;
}

export class BackoffManager {
  private state: BackoffState = { count: 0, until: 0 };

  /**
   * Verifica se está em período de backoff
   */
  isInBackoff(): boolean {
    return Date.now() < this.state.until;
  }

  /**
   * Inicia ou incrementa o backoff
   */
  triggerBackoff(): { minutes: number; until: Date } {
    const backoffCount = this.state.count + 1;
    const backoffMinutes = Math.min(Math.pow(2, backoffCount), 60); // Máximo 1 hora
    const backoffUntil = Date.now() + backoffMinutes * 60 * 1000;

    this.state = { count: backoffCount, until: backoffUntil };

    return {
      minutes: backoffMinutes,
      until: new Date(backoffUntil),
    };
  }

  /**
   * Reseta o estado de backoff
   */
  reset(): void {
    this.state = { count: 0, until: 0 };
  }

  /**
   * Verifica se um erro é de quota exceeded
   */
  static isQuotaError(error: unknown): boolean {
    return (
      error instanceof Error &&
      (error.message.includes('Quota exceeded') ||
        error.message.includes('rateLimitExceeded') ||
        error.message.includes('403'))
    );
  }

  /**
   * Obtém o estado atual
   */
  getState(): BackoffState {
    return { ...this.state };
  }
}
