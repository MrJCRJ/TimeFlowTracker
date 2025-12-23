/**
 * Tipos para registro de timer ativo no Drive
 * Permite sincronização entre múltiplos dispositivos
 */

export interface ActiveTimerRecord {
  id: string; // ID único do timer
  categoryId: string;
  userId: string;
  startTime: string; // ISO 8601 timestamp
  deviceId: string; // Identificador único do dispositivo que iniciou
  deviceName: string; // Nome amigável do dispositivo
  notes: string | null;
  createdAt: string; // Quando o registro foi criado
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: string;
  userAgent: string;
}

export interface ActiveTimerFile {
  timer: ActiveTimerRecord;
  updatedAt: string;
}

export interface StopTimerResult {
  success: boolean;
  entry?: import('./timer').TimeEntry;
  error?: string;
}

// Nome do arquivo de timer ativo no Drive (por categoria para permitir múltiplas)
export const getActiveTimerFileName = (categoryId: string): string => {
  return `active_timer_${categoryId}.json`;
};

// Padrão para listar todos os timers ativos
export const ACTIVE_TIMER_FILE_PATTERN = 'active_timer_*.json';
