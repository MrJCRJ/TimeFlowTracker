/**
 * Estratégia de retry com backoff exponencial
 */
export class RetryStrategy {
  private maxRetries: number;
  private currentRetry = 0;

  constructor(maxRetries: number) {
    this.maxRetries = maxRetries;
  }

  /**
   * Executa uma operação com retry
   */
  async execute<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number, error: Error) => void
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.maxRetries) {
          this.currentRetry = attempt + 1;
          onRetry?.(this.currentRetry, lastError);

          // Aguarda antes de tentar novamente
          await this.delay(1000 * this.currentRetry);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Reseta contador de retry
   */
  reset(): void {
    this.currentRetry = 0;
  }

  /**
   * Retorna o número atual de tentativas
   */
  getCurrentRetry(): number {
    return this.currentRetry;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
