/**
 * Testes para o Category Store
 */

// Mock do localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock do zustand persist
jest.mock('zustand/middleware', () => ({
  persist: (fn: Function) => fn,
  createJSONStorage: () => () => localStorage,
}));

import { useCategoryStore } from '@/stores/categoryStore';
import type { Category } from '@/types';

describe('CategoryStore', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Reset store state
    useCategoryStore.setState({
      categories: [],
      isLoading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('addCategory', () => {
    it('deve criar uma nova categoria', () => {
      const { addCategory } = useCategoryStore.getState();

      const category = addCategory(
        {
          name: 'Nova Categoria',
          color: '#FF5733',
          icon: 'folder',
        },
        'user-1'
      );

      const state = useCategoryStore.getState();
      expect(state.categories).toHaveLength(1);
      expect(category.name).toBe('Nova Categoria');
      expect(category.color).toBe('#FF5733');
      expect(category.userId).toBe('user-1');
    });

    it('deve gerar ID único', () => {
      const { addCategory } = useCategoryStore.getState();

      const cat1 = addCategory({ name: 'Cat 1', color: '#000', icon: 'folder' }, 'user-1');
      const cat2 = addCategory({ name: 'Cat 2', color: '#000', icon: 'folder' }, 'user-1');

      expect(cat1.id).not.toBe(cat2.id);
    });

    it('deve definir isDefault como false para categorias criadas', () => {
      const { addCategory } = useCategoryStore.getState();

      const category = addCategory({ name: 'Cat', color: '#000', icon: 'folder' }, 'user-1');

      expect(category.isDefault).toBe(false);
    });
  });

  describe('updateCategory', () => {
    const mockCategory: Category = {
      id: 'cat-1',
      name: 'Original',
      color: '#000000',
      icon: 'folder',
      isDefault: false,
      userId: 'user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('deve atualizar categoria existente', () => {
      useCategoryStore.setState({ categories: [mockCategory] });

      const { updateCategory } = useCategoryStore.getState();
      updateCategory('cat-1', { name: 'Atualizado' });

      const state = useCategoryStore.getState();
      expect(state.categories[0].name).toBe('Atualizado');
    });

    it('deve manter campos não atualizados', () => {
      useCategoryStore.setState({ categories: [mockCategory] });

      const { updateCategory } = useCategoryStore.getState();
      updateCategory('cat-1', { name: 'Atualizado' });

      const state = useCategoryStore.getState();
      expect(state.categories[0].color).toBe('#000000');
      expect(state.categories[0].icon).toBe('folder');
    });

    it('deve atualizar timestamp', () => {
      useCategoryStore.setState({ categories: [mockCategory] });
      const originalUpdated = mockCategory.updatedAt;

      // Aguardar um pouco para garantir timestamp diferente
      jest.advanceTimersByTime(100);

      const { updateCategory } = useCategoryStore.getState();
      updateCategory('cat-1', { name: 'Atualizado' });

      const state = useCategoryStore.getState();
      expect(state.categories[0].updatedAt).not.toBe(originalUpdated);
    });
  });

  describe('deleteCategory', () => {
    it('deve remover categoria por ID', () => {
      const categories: Category[] = [
        {
          id: 'cat-1',
          name: 'Cat 1',
          color: '#000',
          icon: 'folder',
          isDefault: false,
          userId: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'cat-2',
          name: 'Cat 2',
          color: '#FFF',
          icon: 'folder',
          isDefault: false,
          userId: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      useCategoryStore.setState({ categories });

      const { deleteCategory } = useCategoryStore.getState();
      deleteCategory('cat-1');

      const state = useCategoryStore.getState();
      expect(state.categories).toHaveLength(1);
      expect(state.categories[0].id).toBe('cat-2');
    });

    it('não deve falhar ao deletar ID inexistente', () => {
      const { deleteCategory } = useCategoryStore.getState();

      expect(() => deleteCategory('inexistente')).not.toThrow();
    });
  });

  describe('getCategoryById', () => {
    it('deve retornar categoria por ID', () => {
      const mockCategory: Category = {
        id: 'cat-1',
        name: 'Test',
        color: '#000',
        icon: 'folder',
        isDefault: false,
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      useCategoryStore.setState({ categories: [mockCategory] });

      const { getCategoryById } = useCategoryStore.getState();
      const found = getCategoryById('cat-1');

      expect(found).toBeDefined();
      expect(found?.name).toBe('Test');
    });

    it('deve retornar undefined para ID inexistente', () => {
      const { getCategoryById } = useCategoryStore.getState();
      const found = getCategoryById('inexistente');

      expect(found).toBeUndefined();
    });
  });

  describe('initializeDefaults', () => {
    it('deve criar categorias padrão', () => {
      const { initializeDefaults } = useCategoryStore.getState();

      initializeDefaults('user-1');

      const state = useCategoryStore.getState();
      expect(state.categories.length).toBeGreaterThan(0);
      expect(state.categories.some((c) => c.isDefault)).toBe(true);
    });

    it('não deve duplicar categorias se já existirem', () => {
      const { initializeDefaults } = useCategoryStore.getState();

      initializeDefaults('user-1');
      const firstCount = useCategoryStore.getState().categories.length;

      initializeDefaults('user-1');
      const secondCount = useCategoryStore.getState().categories.length;

      expect(secondCount).toBe(firstCount);
    });
  });

  describe('setCategories', () => {
    it('deve substituir todas as categorias', () => {
      const newCategories: Category[] = [
        {
          id: 'new-1',
          name: 'Nova',
          color: '#000',
          icon: 'folder',
          isDefault: false,
          userId: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const { setCategories } = useCategoryStore.getState();
      setCategories(newCategories);

      const state = useCategoryStore.getState();
      expect(state.categories).toHaveLength(1);
      expect(state.categories[0].id).toBe('new-1');
    });
  });

  describe('reset', () => {
    it('deve limpar todas as categorias', () => {
      useCategoryStore.setState({
        categories: [
          {
            id: 'test',
            name: 'Test',
            color: '#000',
            icon: 'folder',
            isDefault: false,
            userId: 'user-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        isLoading: true,
        error: 'Some error',
      });

      const { reset } = useCategoryStore.getState();
      reset();

      const state = useCategoryStore.getState();
      expect(state.categories).toHaveLength(0);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
