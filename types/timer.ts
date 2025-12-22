/**
 * Tipos para Timer e Time Entries
 */

export interface TimeEntry {
  id: string;
  categoryId: string;
  startTime: string; // ISO 8601 timestamp
  endTime: string | null; // null se timer ativo
  duration: number | null; // duração em segundos, null se timer ativo
  userId: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeEntryInput {
  categoryId: string;
  notes?: string;
}

export interface UpdateTimeEntryInput {
  categoryId?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

export interface TimerState {
  isRunning: boolean;
  activeEntry: TimeEntry | null;
  elapsedSeconds: number;
}

export interface TimerStats {
  totalToday: number; // segundos
  totalWeek: number; // segundos
  totalMonth: number; // segundos
  categoryBreakdown: CategoryTimeBreakdown[];
}

export interface CategoryTimeBreakdown {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  totalSeconds: number;
  percentage: number;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalSeconds: number;
  entries: TimeEntry[];
  categoryBreakdown: CategoryTimeBreakdown[];
}

export interface WeeklyStats {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  totalSeconds: number;
  dailyTotals: { date: string; seconds: number }[];
  categoryBreakdown: CategoryTimeBreakdown[];
}

export type TimeRange = 'today' | 'week' | 'month' | 'custom';

export interface TimeRangeFilter {
  range: TimeRange;
  startDate?: string;
  endDate?: string;
}
