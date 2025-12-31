/**
 * Tipo: Receitas
 * Usado por: Alimentação
 *
 * Registro de refeições com informações nutricionais para meal prep.
 *
 * Fluxo:
 * 1. Usuário abre categoria Alimentação
 * 2. App mostra lista de receitas já cadastradas
 * 3. Usuário seleciona uma receita
 * 4. App pergunta: "Vai fazer ou comer?"
 *    - FAZER → Inicia timer de preparo
 *    - COMER → Registra consumo (quantas porções comeu)
 */

/**
 * Receita cadastrada pelo usuário
 */
export interface Recipe {
  id: string;
  name: string; // "Frango com batata doce"
  description: string; // Ingredientes, modo de preparo, etc.
  totalCalories: number; // Calorias totais da receita completa
  portions: number; // Quantas porções rende
  caloriesPerPortion: number; // Calculado: totalCalories / portions
  timesCooked: number; // Quantas vezes preparou
  timesEaten: number; // Quantas vezes comeu
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecipeInput {
  name: string;
  description: string;
  totalCalories: number;
  portions: number;
}

export interface UpdateRecipeInput {
  name?: string;
  description?: string;
  totalCalories?: number;
  portions?: number;
}

/**
 * Entrada quando PREPARA a refeição
 */
export interface CookingEntry {
  id: string;
  categoryId: string;
  recipeId: string;
  type: 'cooking'; // Preparando
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  duration: number; // Tempo de preparo em segundos
  portionsMade: number; // Quantas porções fez (pode ser diferente da receita)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Entrada quando COME a refeição
 */
export interface EatingEntry {
  id: string;
  categoryId: string;
  recipeId: string;
  type: 'eating'; // Comendo
  timestamp: string; // Quando comeu (ISO 8601)
  portionsEaten: number; // Quantas porções comeu
  caloriesConsumed: number; // Calculado: portionsEaten * caloriesPerPortion
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MealEntry = CookingEntry | EatingEntry;

/**
 * Type guard para verificar se é uma entrada de cozinhar
 */
export function isCookingEntry(entry: MealEntry): entry is CookingEntry {
  return entry.type === 'cooking';
}

/**
 * Type guard para verificar se é uma entrada de comer
 */
export function isEatingEntry(entry: MealEntry): entry is EatingEntry {
  return entry.type === 'eating';
}
