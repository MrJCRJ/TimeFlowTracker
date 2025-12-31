import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Recipe, CreateRecipeInput, UpdateRecipeInput } from '@/types/entries/meal';

const generateId = () => `recipe_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();

interface RecipeStoreState {
  recipes: Recipe[];
  selectedRecipeId: string | null; // Receita selecionada para ação
}

interface RecipeStoreActions {
  // CRUD
  addRecipe: (input: CreateRecipeInput) => Recipe;
  updateRecipe: (id: string, updates: UpdateRecipeInput) => void;
  deleteRecipe: (id: string) => void;
  setRecipes: (recipes: Recipe[]) => void; // Para restauração de dados

  // Seleção
  selectRecipe: (recipeId: string | null) => void;

  // Incrementar contadores
  incrementTimesCooked: (recipeId: string) => void;
  incrementTimesEaten: (recipeId: string, portions: number) => void;

  // Getters
  getRecipeById: (id: string) => Recipe | undefined;

  // Reset
  reset: () => void;
}

type RecipeStore = RecipeStoreState & RecipeStoreActions;

const initialState: RecipeStoreState = {
  recipes: [],
  selectedRecipeId: null,
};

export const useRecipeStore = create<RecipeStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addRecipe: (input: CreateRecipeInput) => {
        const totalCalories = input.totalCalories ?? 0;
        const caloriesPerPortion =
          input.portions > 0 ? Math.round(totalCalories / input.portions) : 0;

        const newRecipe: Recipe = {
          id: generateId(),
          name: input.name,
          description: input.description,
          totalCalories,
          portions: input.portions,
          caloriesPerPortion,
          timesCooked: 0,
          timesEaten: 0,
          createdAt: now(),
          updatedAt: now(),
        };

        set((state) => ({
          recipes: [...state.recipes, newRecipe],
        }));

        return newRecipe;
      },

      updateRecipe: (id: string, updates: UpdateRecipeInput) => {
        set((state) => ({
          recipes: state.recipes.map((recipe) => {
            if (recipe.id !== id) return recipe;

            const totalCalories = updates.totalCalories ?? recipe.totalCalories;
            const portions = updates.portions ?? recipe.portions;
            const caloriesPerPortion = Math.round(totalCalories / portions);

            return {
              ...recipe,
              ...updates,
              caloriesPerPortion,
              updatedAt: now(),
            };
          }),
        }));
      },

      deleteRecipe: (id: string) => {
        set((state) => ({
          recipes: state.recipes.filter((recipe) => recipe.id !== id),
          selectedRecipeId: state.selectedRecipeId === id ? null : state.selectedRecipeId,
        }));
      },

      selectRecipe: (recipeId: string | null) => {
        set({ selectedRecipeId: recipeId });
      },

      incrementTimesCooked: (recipeId: string) => {
        set((state) => ({
          recipes: state.recipes.map((recipe) =>
            recipe.id === recipeId
              ? { ...recipe, timesCooked: recipe.timesCooked + 1, updatedAt: now() }
              : recipe
          ),
        }));
      },

      incrementTimesEaten: (recipeId: string, portions: number) => {
        set((state) => ({
          recipes: state.recipes.map((recipe) =>
            recipe.id === recipeId
              ? {
                  ...recipe,
                  timesEaten: recipe.timesEaten + portions,
                  updatedAt: now(),
                }
              : recipe
          ),
        }));
      },

      getRecipeById: (id: string) => {
        return get().recipes.find((recipe) => recipe.id === id);
      },

      reset: () => {
        set(initialState);
      },

      setRecipes: (recipes: Recipe[]) => {
        set({ recipes });
      },
    }),
    {
      name: 'timeflow_recipes',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
