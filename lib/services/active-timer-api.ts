import type { ActiveTimerRecord, TimeEntry, DeviceInfo } from '@/types';

/**
 * Serviço para operações de API do timer ativo
 */
export class ActiveTimerApiService {
  private static readonly BASE_URL = '/api/drive/active-timer';

  /**
   * Busca todos os timers ativos
   */
  static async fetchActiveTimers(): Promise<ActiveTimerRecord[]> {
    const response = await fetch(this.BASE_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Erro ao buscar timers ativos');
    }

    return data.data as ActiveTimerRecord[];
  }

  /**
   * Busca timer ativo de uma categoria específica
   */
  static async fetchActiveTimer(categoryId: string): Promise<ActiveTimerRecord | null> {
    const response = await fetch(`${this.BASE_URL}?categoryId=${categoryId}`);
    const data = await response.json();

    if (!data.success) {
      return null;
    }

    return data.data as ActiveTimerRecord;
  }

  /**
   * Inicia um timer
   */
  static async startTimer(
    categoryId: string,
    deviceInfo: DeviceInfo,
    notes?: string
  ): Promise<ActiveTimerRecord> {
    const response = await fetch(this.BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        categoryId,
        deviceInfo,
        notes,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Erro ao iniciar timer');
    }

    return data.data as ActiveTimerRecord;
  }

  /**
   * Para um timer
   */
  static async stopTimer(
    categoryId: string,
    deviceInfo: DeviceInfo,
    notes?: string
  ): Promise<TimeEntry> {
    const response = await fetch(this.BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'stop',
        categoryId,
        deviceInfo,
        notes,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Erro ao parar timer');
    }

    return data.data as TimeEntry;
  }

  /**
   * Cancela um timer
   */
  static async cancelTimer(categoryId: string, deviceInfo: DeviceInfo): Promise<boolean> {
    const response = await fetch(this.BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cancel',
        categoryId,
        deviceInfo,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Erro ao cancelar timer');
    }

    return true;
  }
}
