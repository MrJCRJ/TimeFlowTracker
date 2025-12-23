/**
 * Estratégia de throttling para controlar frequência de operações
 */
export class ThrottleStrategy {
  private throttleMs: number;
  private lastExecution = 0;

  constructor(throttleMs: number) {
    this.throttleMs = throttleMs;
  }

  /**
   * Verifica se pode executar operação
   */
  canExecute(): boolean {
    const now = Date.now();
    return now - this.lastExecution >= this.throttleMs;
  }

  /**
   * Executa operação se throttling permitir
   */
  async execute<T>(operation: () => Promise<T>): Promise<T | null> {
    if (!this.canExecute()) {
      return null;
    }

    this.lastExecution = Date.now();
    return operation();
  }

  /**
   * Tempo até próxima execução permitida
   */
  getTimeUntilNext(): number {
    const now = Date.now();
    const timeSinceLast = now - this.lastExecution;
    return Math.max(0, this.throttleMs - timeSinceLast);
  }

  /**
   * Reseta estado de throttling
   */
  reset(): void {
    this.lastExecution = 0;
  }
}
