import type { Category, TimeEntry } from '@/types';

/**
 * Estado atual dos dados para comparação
 */
export interface DataState {
  categories: Category[];
  timeEntries: TimeEntry[];
  activeTimerId: string | null;
  hash: string;
  timestamp: number;
}

/**
 * Resultado de uma operação de sync
 */
export interface SyncResult {
  success: boolean;
  direction: 'upload' | 'download' | 'none';
  conflicts?: boolean;
  error?: string;
}

/**
 * Callbacks para integração com stores
 */
export interface SyncCallbacks {
  getAccessToken: () => string | null;
  getLocalData: () => {
    categories: Category[];
    timeEntries: TimeEntry[];
    activeTimerId: string | null;
  };
  setLocalData: (data: { categories: Category[]; timeEntries: TimeEntry[] }) => void;
  onSyncComplete?: (result: SyncResult) => void;
}
