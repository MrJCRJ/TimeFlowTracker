/**
 * Tipos para Categorias
 */

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  isDefault: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  color: string;
  icon: string;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string;
  icon?: string;
}

export type CategoryColor =
  | '#3b82f6' // blue - work
  | '#8b5cf6' // violet - study
  | '#22c55e' // green - exercise
  | '#f59e0b' // amber - leisure
  | '#6366f1' // indigo - sleep
  | '#ec4899' // pink - food
  | '#14b8a6' // teal - commute
  | '#6b7280' // gray - other
  | string; // custom

export type CategoryIcon =
  | 'briefcase'
  | 'book'
  | 'dumbbell'
  | 'gamepad-2'
  | 'moon'
  | 'utensils'
  | 'car'
  | 'folder'
  | string; // custom

export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Trabalho', color: '#3b82f6', icon: 'briefcase', isDefault: true },
  { name: 'Estudo', color: '#8b5cf6', icon: 'book', isDefault: true },
  { name: 'Exercício', color: '#22c55e', icon: 'dumbbell', isDefault: true },
  { name: 'Lazer', color: '#f59e0b', icon: 'gamepad-2', isDefault: true },
  { name: 'Sono', color: '#6366f1', icon: 'moon', isDefault: true },
  { name: 'Alimentação', color: '#ec4899', icon: 'utensils', isDefault: true },
  { name: 'Transporte', color: '#14b8a6', icon: 'car', isDefault: true },
  { name: 'Outros', color: '#6b7280', icon: 'folder', isDefault: true },
];
