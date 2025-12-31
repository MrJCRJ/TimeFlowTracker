import { create } from 'zustand';
import {
  FIXED_CATEGORIES,
  CATEGORIES_BY_ID,
  type Category,
  type CategoryId,
  type CategoryType,
} from '@/types/category';

/**
 * CategoryStore - Store simplificado para categorias fixas
 *
 * As categorias são fixas e definidas em types/category.ts.
 * Este store fornece apenas métodos de leitura.
 */

interface CategoryState {
  categories: Category[];
}

interface CategoryActions {
  // Leitura
  getCategoryById: (id: CategoryId) => Category | undefined;
  getCategoriesByType: (type: CategoryType) => Category[];
}

type CategoryStore = CategoryState & CategoryActions;

export const useCategoryStore = create<CategoryStore>()(() => ({
  // Estado - categorias fixas
  categories: FIXED_CATEGORIES,

  // Getters
  getCategoryById: (id: CategoryId) => CATEGORIES_BY_ID[id],

  getCategoriesByType: (type: CategoryType) => FIXED_CATEGORIES.filter((cat) => cat.type === type),
}));

// Seletores
export const selectCategories = (state: CategoryStore) => state.categories;
export const selectCategoryById = (id: CategoryId) => (state: CategoryStore) =>
  state.getCategoryById(id);
export const selectCategoriesByType = (type: CategoryType) => (state: CategoryStore) =>
  state.getCategoriesByType(type);
