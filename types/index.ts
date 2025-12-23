/**
 * Central export para todos os tipos
 */

// Re-export de todos os tipos
export * from './category';
export * from './timer';
export * from './user';
export * from './api';
export * from './active-timer';

// Tipos utilitários
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Tipos de timestamp
export type ISODateString = string; // ISO 8601 date string
export type TimeString = string; // HH:mm format
