/**
 * Testes de Integração para o Recipe Store
 *
 * Testa o gerenciamento de receitas com:
 * - CRUD completo
 * - Contagem de vezes cozinhado/comido
 * - Cálculo de calorias por porção
 */

import { useRecipeStore } from '@/stores/recipeStore';
import { act } from '@testing-library/react';

describe('RecipeStore - Integração', () => {
  beforeEach(() => {
    act(() => {
      useRecipeStore.getState().reset();
    });
  });

  describe('CRUD de Receitas', () => {
    it('deve adicionar uma nova receita', () => {
      const { addRecipe } = useRecipeStore.getState();

      act(() => {
        addRecipe({
          name: 'Frango com batata doce',
          description: 'Receita fitness simples',
          totalCalories: 800,
          portions: 4,
        });
      });

      const state = useRecipeStore.getState();
      expect(state.recipes).toHaveLength(1);
      expect(state.recipes[0].name).toBe('Frango com batata doce');
      expect(state.recipes[0].caloriesPerPortion).toBe(200); // 800/4
    });

    it('deve calcular calorias por porção automaticamente', () => {
      const { addRecipe } = useRecipeStore.getState();

      act(() => {
        addRecipe({
          name: 'Salada',
          totalCalories: 150,
          portions: 2,
        });
      });

      const recipe = useRecipeStore.getState().recipes[0];
      expect(recipe.caloriesPerPortion).toBe(75);
    });

    it('deve lidar com receita sem calorias', () => {
      const { addRecipe } = useRecipeStore.getState();

      act(() => {
        addRecipe({
          name: 'Receita simples',
          portions: 2,
        });
      });

      const recipe = useRecipeStore.getState().recipes[0];
      expect(recipe.totalCalories).toBe(0);
      expect(recipe.caloriesPerPortion).toBe(0);
    });

    it('deve atualizar uma receita', () => {
      const { addRecipe, updateRecipe } = useRecipeStore.getState();

      let recipeId: string;
      act(() => {
        const recipe = addRecipe({
          name: 'Receita Original',
          totalCalories: 500,
          portions: 2,
        });
        recipeId = recipe.id;
      });

      act(() => {
        updateRecipe(recipeId!, {
          name: 'Receita Atualizada',
          totalCalories: 600,
        });
      });

      const recipe = useRecipeStore.getState().recipes[0];
      expect(recipe.name).toBe('Receita Atualizada');
      expect(recipe.totalCalories).toBe(600);
      expect(recipe.caloriesPerPortion).toBe(300); // Recalculado
    });

    it('deve deletar uma receita', () => {
      const { addRecipe, deleteRecipe } = useRecipeStore.getState();

      let recipeId: string;
      act(() => {
        const recipe = addRecipe({ name: 'Para deletar', portions: 1 });
        recipeId = recipe.id;
      });

      expect(useRecipeStore.getState().recipes).toHaveLength(1);

      act(() => {
        deleteRecipe(recipeId!);
      });

      expect(useRecipeStore.getState().recipes).toHaveLength(0);
    });
  });

  describe('Contagem de uso', () => {
    it('deve incrementar vezes cozinhado', () => {
      const { addRecipe, incrementTimesCooked } = useRecipeStore.getState();

      let recipeId: string;
      act(() => {
        const recipe = addRecipe({ name: 'Receita', portions: 1 });
        recipeId = recipe.id;
      });

      expect(useRecipeStore.getState().recipes[0].timesCooked).toBe(0);

      act(() => {
        incrementTimesCooked(recipeId!);
        incrementTimesCooked(recipeId!);
        incrementTimesCooked(recipeId!);
      });

      expect(useRecipeStore.getState().recipes[0].timesCooked).toBe(3);
    });

    it('deve incrementar vezes comido', () => {
      const { addRecipe, incrementTimesEaten } = useRecipeStore.getState();

      let recipeId: string;
      act(() => {
        const recipe = addRecipe({ name: 'Receita', portions: 1 });
        recipeId = recipe.id;
      });

      expect(useRecipeStore.getState().recipes[0].timesEaten).toBe(0);

      act(() => {
        incrementTimesEaten(recipeId!, 1);
        incrementTimesEaten(recipeId!, 1);
      });

      expect(useRecipeStore.getState().recipes[0].timesEaten).toBe(2);
    });
  });

  describe('Seleção de Receita', () => {
    it('deve selecionar uma receita', () => {
      const { addRecipe, selectRecipe } = useRecipeStore.getState();

      let recipeId: string;
      act(() => {
        const recipe = addRecipe({ name: 'Receita', portions: 1 });
        recipeId = recipe.id;
      });

      act(() => {
        selectRecipe(recipeId!);
      });

      expect(useRecipeStore.getState().selectedRecipeId).toBe(recipeId!);
    });

    it('deve limpar seleção ao deletar receita selecionada', () => {
      const { addRecipe, selectRecipe, deleteRecipe } = useRecipeStore.getState();

      let recipeId: string;
      act(() => {
        const recipe = addRecipe({ name: 'Receita', portions: 1 });
        recipeId = recipe.id;
        selectRecipe(recipeId);
      });

      expect(useRecipeStore.getState().selectedRecipeId).toBe(recipeId!);

      act(() => {
        deleteRecipe(recipeId!);
      });

      expect(useRecipeStore.getState().selectedRecipeId).toBeNull();
    });
  });

  describe('Getters', () => {
    it('deve retornar receita por ID', () => {
      const { addRecipe, getRecipeById } = useRecipeStore.getState();

      let recipeId: string;
      act(() => {
        const recipe = addRecipe({
          name: 'Receita específica',
          totalCalories: 400,
          portions: 2,
        });
        recipeId = recipe.id;
      });

      const recipe = useRecipeStore.getState().getRecipeById(recipeId!);
      expect(recipe).toBeDefined();
      expect(recipe?.name).toBe('Receita específica');
    });

    it('deve retornar undefined para ID inexistente', () => {
      const recipe = useRecipeStore.getState().getRecipeById('id-inexistente');
      expect(recipe).toBeUndefined();
    });
  });

  describe('Fluxo de Integração Completo', () => {
    it('deve gerenciar ciclo completo de fazer e comer receitas', () => {
      const { addRecipe, selectRecipe, incrementTimesCooked, incrementTimesEaten } =
        useRecipeStore.getState();

      // 1. Adicionar receitas
      let recipe1Id: string, recipe2Id: string;
      act(() => {
        const r1 = addRecipe({
          name: 'Frango grelhado',
          totalCalories: 600,
          portions: 3,
        });
        const r2 = addRecipe({
          name: 'Salada Caesar',
          totalCalories: 300,
          portions: 2,
        });
        recipe1Id = r1.id;
        recipe2Id = r2.id;
      });

      expect(useRecipeStore.getState().recipes).toHaveLength(2);

      // 2. Selecionar receita 1 para fazer
      act(() => {
        selectRecipe(recipe1Id!);
      });
      expect(useRecipeStore.getState().selectedRecipeId).toBe(recipe1Id);

      // 3. Incrementar "vezes cozinhado"
      act(() => {
        incrementTimesCooked(recipe1Id!);
      });
      expect(useRecipeStore.getState().getRecipeById(recipe1Id!)?.timesCooked).toBe(1);

      // 4. Comer algumas porções
      act(() => {
        incrementTimesEaten(recipe1Id!, 1);
        incrementTimesEaten(recipe1Id!, 1);
      });
      expect(useRecipeStore.getState().getRecipeById(recipe1Id!)?.timesEaten).toBe(2);

      // 5. Fazer e comer outra receita
      act(() => {
        selectRecipe(recipe2Id!);
        incrementTimesCooked(recipe2Id!);
        incrementTimesEaten(recipe2Id!, 1);
      });

      const recipe2 = useRecipeStore.getState().getRecipeById(recipe2Id!);
      expect(recipe2?.timesCooked).toBe(1);
      expect(recipe2?.timesEaten).toBe(1);
    });
  });

  describe('Reset', () => {
    it('deve resetar o store para estado inicial', () => {
      const { addRecipe, selectRecipe, incrementTimesCooked } = useRecipeStore.getState();

      act(() => {
        const recipe = addRecipe({ name: 'Receita', portions: 1 });
        selectRecipe(recipe.id);
        incrementTimesCooked(recipe.id);
      });

      expect(useRecipeStore.getState().recipes).toHaveLength(1);
      expect(useRecipeStore.getState().selectedRecipeId).not.toBeNull();

      act(() => {
        useRecipeStore.getState().reset();
      });

      expect(useRecipeStore.getState().recipes).toHaveLength(0);
      expect(useRecipeStore.getState().selectedRecipeId).toBeNull();
    });
  });
});
