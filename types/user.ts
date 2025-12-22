/**
 * Tipos para Usuário e Preferências
 */

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: string;
}

export interface UserPreferences {
  userId: string;
  workHours: WorkHours;
  dailyGoals: Record<string, number>; // categoryId -> minutos
  theme: Theme;
  notifications: boolean;
  autoSync: boolean;
  syncInterval: number; // minutos
  updatedAt: string;
}

export interface WorkHours {
  start: string; // HH:mm format
  end: string; // HH:mm format
}

export type Theme = 'light' | 'dark' | 'system';

export interface UpdatePreferencesInput {
  workHours?: WorkHours;
  dailyGoals?: Record<string, number>;
  theme?: Theme;
  notifications?: boolean;
  autoSync?: boolean;
  syncInterval?: number;
}

export const DEFAULT_PREFERENCES: Omit<UserPreferences, 'userId' | 'updatedAt'> = {
  workHours: {
    start: '09:00',
    end: '18:00',
  },
  dailyGoals: {},
  theme: 'system',
  notifications: true,
  autoSync: true,
  syncInterval: 5,
};
