/**
 * Tipos para API
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface SyncMetadata {
  lastSyncAt: string;
  driveFileIds: DriveFileIds;
  pendingChanges: number;
  conflictCount: number;
}

export interface DriveFileIds {
  categories: string | null;
  timeEntries: string | null;
  preferences: string | null;
}

export interface SyncResult {
  success: boolean;
  syncedAt: string;
  categoriesSynced: number;
  entriesSynced: number;
  conflicts: SyncConflict[];
}

export interface SyncConflict {
  type: 'category' | 'timeEntry' | 'preferences';
  id: string;
  localVersion: unknown;
  remoteVersion: unknown;
  resolution: 'local' | 'remote' | 'pending';
}

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'RATE_LIMITED'
  | 'DRIVE_ERROR'
  | 'SYNC_ERROR'
  | 'OFFLINE';
