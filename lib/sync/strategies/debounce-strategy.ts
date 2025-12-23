/**
 * Estratégia de debouncing para agrupar operações
 */
export class DebounceStrategy {
  private debounceMs: number;
  private timeoutId: NodeJS.Timeout | null = null;
  private pendingOperation: (() => void) | null = null;

  constructor(debounceMs: number) {
    this.debounceMs = debounceMs;
  }

  /**
   * Agenda execução de operação com debounce
   */
  schedule(operation: () => void): void {
    // Cancela operação anterior
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Armazena operação pendente
    this.pendingOperation = operation;

    // Agenda nova execução
    this.timeoutId = setTimeout(() => {
      if (this.pendingOperation) {
        this.pendingOperation();
        this.pendingOperation = null;
      }
      this.timeoutId = null;
    }, this.debounceMs);
  }

  /**
   * Executa operação imediatamente, cancelando debounce
   */
  executeNow(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.pendingOperation) {
      this.pendingOperation();
      this.pendingOperation = null;
    }
  }

  /**
   * Cancela operação pendente
   */
  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.pendingOperation = null;
  }

  /**
   * Verifica se há operação pendente
   */
  hasPendingOperation(): boolean {
    return this.pendingOperation !== null;
  }
}
