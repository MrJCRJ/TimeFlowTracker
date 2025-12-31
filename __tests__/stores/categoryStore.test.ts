/**
 * Testes para o Category Store (Categorias Fixas)
 */

import { useCategoryStore } from '@/stores/categoryStore';
import { FIXED_CATEGORIES } from '@/types/category';

describe('CategoryStore', () => {
  describe('categories', () => {
    it('deve ter todas as categorias fixas', () => {
      const { categories } = useCategoryStore.getState();

      expect(categories).toHaveLength(FIXED_CATEGORIES.length);
      expect(categories).toEqual(FIXED_CATEGORIES);
    });

    it('deve ter 10 categorias', () => {
      const { categories } = useCategoryStore.getState();

      expect(categories).toHaveLength(10);
    });

    it('deve ter as categorias corretas', () => {
      const { categories } = useCategoryStore.getState();
      const categoryIds = categories.map((c) => c.id);

      expect(categoryIds).toContain('sleep');
      expect(categoryIds).toContain('leisure');
      expect(categoryIds).toContain('workout');
      expect(categoryIds).toContain('work');
      expect(categoryIds).toContain('study');
      expect(categoryIds).toContain('food');
      expect(categoryIds).toContain('home');
      expect(categoryIds).toContain('hygiene');
      expect(categoryIds).toContain('commitments');
      expect(categoryIds).toContain('other');
    });
  });

  describe('getCategoryById', () => {
    it('deve retornar categoria por ID', () => {
      const { getCategoryById } = useCategoryStore.getState();

      const sleep = getCategoryById('sleep');
      expect(sleep).toBeDefined();
      expect(sleep?.name).toBe('Sono');
      expect(sleep?.type).toBe('simple');

      const workout = getCategoryById('workout');
      expect(workout).toBeDefined();
      expect(workout?.name).toBe('Treino');
      expect(workout?.type).toBe('workout');
    });

    it('deve retornar undefined para ID inválido', () => {
      const { getCategoryById } = useCategoryStore.getState();

      // @ts-expect-error - testando ID inválido
      const invalid = getCategoryById('invalid-id');
      expect(invalid).toBeUndefined();
    });
  });

  describe('getCategoriesByType', () => {
    it('deve retornar categorias do tipo simple', () => {
      const { getCategoriesByType } = useCategoryStore.getState();

      const simpleCategories = getCategoriesByType('simple');

      expect(simpleCategories.length).toBeGreaterThan(0);
      expect(simpleCategories.every((c) => c.type === 'simple')).toBe(true);
      expect(simpleCategories.map((c) => c.id)).toContain('sleep');
      expect(simpleCategories.map((c) => c.id)).toContain('leisure');
      expect(simpleCategories.map((c) => c.id)).toContain('home');
    });

    it('deve retornar categorias do tipo task', () => {
      const { getCategoriesByType } = useCategoryStore.getState();

      const taskCategories = getCategoriesByType('task');

      expect(taskCategories.length).toBeGreaterThan(0);
      expect(taskCategories.every((c) => c.type === 'task')).toBe(true);
      expect(taskCategories.map((c) => c.id)).toContain('study');
      expect(taskCategories.map((c) => c.id)).toContain('other');
    });

    it('deve retornar categoria única para tipos especializados', () => {
      const { getCategoriesByType } = useCategoryStore.getState();

      const workoutCategories = getCategoriesByType('workout');
      expect(workoutCategories).toHaveLength(1);
      expect(workoutCategories[0].id).toBe('workout');

      const workCategories = getCategoriesByType('work');
      expect(workCategories).toHaveLength(1);
      expect(workCategories[0].id).toBe('work');

      const mealCategories = getCategoriesByType('meal');
      expect(mealCategories).toHaveLength(1);
      expect(mealCategories[0].id).toBe('food');

      const commitmentCategories = getCategoriesByType('commitment');
      expect(commitmentCategories).toHaveLength(1);
      expect(commitmentCategories[0].id).toBe('commitments');
    });
  });

  describe('categoria properties', () => {
    it('todas as categorias devem ter os campos obrigatórios', () => {
      const { categories } = useCategoryStore.getState();

      categories.forEach((category) => {
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
        expect(category.color).toBeDefined();
        expect(category.icon).toBeDefined();
        expect(category.type).toBeDefined();
        expect(category.description).toBeDefined();
      });
    });

    it('todas as cores devem ser hex válidas', () => {
      const { categories } = useCategoryStore.getState();
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

      categories.forEach((category) => {
        expect(category.color).toMatch(hexColorRegex);
      });
    });
  });
});
