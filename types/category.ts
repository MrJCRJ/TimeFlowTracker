/**
 * Tipos para Categorias Fixas
 *
 * O sistema usa categorias fixas, cada uma com seu tipo de entrada especializado.
 * Não é possível criar, editar ou deletar categorias.
 */

/**
 * Tipos de entrada especializados por categoria
 */
export type CategoryType =
  | 'simple' // Sono, Lazer, Casa - Timer + checklist opcional
  | 'task' // Estudo, Outros - Timer + lista de tarefas
  | 'workout' // Treino - Exercícios com séries/reps/peso
  | 'work' // Trabalho - Múltiplos trabalhos + ganhos
  | 'meal' // Alimentação - Receitas + fazer/comer
  | 'commitment'; // Compromissos - Tarefas datadas + subtarefas

/**
 * IDs fixos das categorias (usados para referência)
 */
export type CategoryId =
  | 'sleep'
  | 'leisure'
  | 'workout'
  | 'work'
  | 'study'
  | 'food'
  | 'home'
  | 'hygiene'
  | 'commitments'
  | 'other';

export interface Category {
  id: CategoryId;
  name: string;
  color: string;
  icon: string;
  type: CategoryType;
  description: string;
}

/**
 * Cores das categorias
 */
export type CategoryColor =
  | '#3b82f6' // blue - work
  | '#8b5cf6' // violet - study
  | '#22c55e' // green - workout
  | '#f59e0b' // amber - leisure
  | '#6366f1' // indigo - sleep
  | '#ec4899' // pink - food
  | '#14b8a6' // teal - home
  | '#06b6d4' // cyan - hygiene
  | '#f43f5e' // rose - commitments
  | '#6b7280'; // gray - other

export type CategoryIcon =
  | 'briefcase'
  | 'book'
  | 'dumbbell'
  | 'gamepad-2'
  | 'moon'
  | 'utensils'
  | 'home'
  | 'sparkles'
  | 'calendar'
  | 'folder';

/**
 * Categorias fixas do sistema
 * Ordem: define a ordem de exibição no app
 */
export const FIXED_CATEGORIES: Category[] = [
  {
    id: 'sleep',
    name: 'Sono',
    color: '#6366f1',
    icon: 'moon',
    type: 'simple',
    description: 'Registre suas horas de sono e qualidade do descanso',
  },
  {
    id: 'leisure',
    name: 'Lazer',
    color: '#f59e0b',
    icon: 'gamepad-2',
    type: 'simple',
    description: 'Tempo dedicado a hobbies e entretenimento',
  },
  {
    id: 'workout',
    name: 'Treino',
    color: '#22c55e',
    icon: 'dumbbell',
    type: 'workout',
    description: 'Registre seus exercícios com séries, reps e peso',
  },
  {
    id: 'work',
    name: 'Trabalho',
    color: '#3b82f6',
    icon: 'briefcase',
    type: 'work',
    description: 'Gerencie múltiplos trabalhos e acompanhe ganhos',
  },
  {
    id: 'study',
    name: 'Estudo',
    color: '#8b5cf6',
    icon: 'book',
    type: 'task',
    description: 'Acompanhe seu tempo de estudo e tarefas concluídas',
  },
  {
    id: 'food',
    name: 'Alimentação',
    color: '#ec4899',
    icon: 'utensils',
    type: 'meal',
    description: 'Gerencie receitas, tempo de preparo e calorias',
  },
  {
    id: 'home',
    name: 'Casa',
    color: '#14b8a6',
    icon: 'home',
    type: 'simple',
    description: 'Tarefas domésticas como limpeza e organização',
  },
  {
    id: 'hygiene',
    name: 'Higiene',
    color: '#06b6d4',
    icon: 'sparkles',
    type: 'simple',
    description: 'Cuidados pessoais como banho, skincare, unhas e depilação',
  },
  {
    id: 'commitments',
    name: 'Compromissos',
    color: '#f43f5e',
    icon: 'calendar',
    type: 'commitment',
    description: 'Contas, eventos, aniversários e tarefas datadas',
  },
  {
    id: 'other',
    name: 'Outros',
    color: '#6b7280',
    icon: 'folder',
    type: 'task',
    description: 'Atividades diversas que não se encaixam em outras categorias',
  },
];

/**
 * Mapa de categorias por ID para acesso rápido
 */
export const CATEGORIES_BY_ID: Record<CategoryId, Category> = FIXED_CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  },
  {} as Record<CategoryId, Category>
);

/**
 * Helper para obter categoria por ID
 */
export function getCategoryById(id: CategoryId): Category {
  return CATEGORIES_BY_ID[id];
}

/**
 * Helper para obter todas as categorias de um tipo
 */
export function getCategoriesByType(type: CategoryType): Category[] {
  return FIXED_CATEGORIES.filter((cat) => cat.type === type);
}
