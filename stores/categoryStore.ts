import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types';
import { DEFAULT_CATEGORIES } from '@/types/category';
import { generateId, now } from '@/lib/utils';
import { STORAGE_KEYS } from '@/lib/constants';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}

interface CategoryActions {
  // CRUD
  addCategory: (input: CreateCategoryInput, userId: string) => Category;
  updateCategory: (id: string, input: UpdateCategoryInput) => void;
  deleteCategory: (id: string) => void;
  getCategoryById: (id: string) => Category | undefined;

  // Bulk operations
  setCategories: (categories: Category[]) => void;
  initializeDefaults: (userId: string) => void;

  // State
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

type CategoryStore = CategoryState & CategoryActions;

const initialState: CategoryState = {
  categories: [],
  isLoading: false,
  error: null,
};

export const useCategoryStore = create<CategoryStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addCategory: (input: CreateCategoryInput, userId: string) => {
        const newCategory: Category = {
          id: generateId(),
          ...input,
          isDefault: false,
          userId,
          createdAt: now(),
          updatedAt: now(),
        };

        set((state) => ({
          categories: [...state.categories, newCategory],
        }));

        return newCategory;
      },

      updateCategory: (id: string, input: UpdateCategoryInput) => {
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id
              ? {
                  ...cat,
                  ...input,
                  updatedAt: now(),
                }
              : cat
          ),
        }));
      },

      deleteCategory: (id: string) => {
        set((state) => ({
          categories: state.categories.filter((cat) => cat.id !== id),
        }));
      },

      getCategoryById: (id: string) => {
        return get().categories.find((cat) => cat.id === id);
      },

      setCategories: (categories: Category[]) => {
        set({ categories });
      },

      initializeDefaults: (userId: string) => {
        const { categories } = get();
        if (categories.length === 0) {
          const defaultCategories: Category[] = DEFAULT_CATEGORIES.map((cat) => ({
            id: generateId(),
            ...cat,
            userId,
            createdAt: now(),
            updatedAt: now(),
          }));
          set({ categories: defaultCategories });
        }
      },

      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      reset: () => set(initialState),
    }),
    {
      name: STORAGE_KEYS.CATEGORIES,
      partialize: (state) => ({ categories: state.categories }),
    }
  )
);

// Seletores
export const selectCategories = (state: CategoryStore) => state.categories;
export const selectCategoriesLoading = (state: CategoryStore) => state.isLoading;
export const selectCategoriesError = (state: CategoryStore) => state.error;
