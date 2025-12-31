import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Store para histórico de autocomplete
 * Armazena nomes de exercícios e tarefas já utilizados para sugestões
 */

interface AutocompleteHistoryState {
  exerciseNames: string[];
  taskNames: string[];
}

interface AutocompleteHistoryActions {
  addExerciseName: (name: string) => void;
  addTaskName: (name: string) => void;
  getExerciseSuggestions: (query: string) => string[];
  getTaskSuggestions: (query: string) => string[];
  reset: () => void;
}

type AutocompleteHistoryStore = AutocompleteHistoryState & AutocompleteHistoryActions;

const MAX_HISTORY_ITEMS = 100;

const initialState: AutocompleteHistoryState = {
  exerciseNames: [],
  taskNames: [],
};

export const useAutocompleteStore = create<AutocompleteHistoryStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addExerciseName: (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;

        set((state) => {
          // Remover duplicatas (case insensitive) e adicionar no início
          const filtered = state.exerciseNames.filter(
            (n) => n.toLowerCase() !== trimmed.toLowerCase()
          );
          const newList = [trimmed, ...filtered].slice(0, MAX_HISTORY_ITEMS);
          return { exerciseNames: newList };
        });
      },

      addTaskName: (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;

        set((state) => {
          // Remover duplicatas (case insensitive) e adicionar no início
          const filtered = state.taskNames.filter((n) => n.toLowerCase() !== trimmed.toLowerCase());
          const newList = [trimmed, ...filtered].slice(0, MAX_HISTORY_ITEMS);
          return { taskNames: newList };
        });
      },

      getExerciseSuggestions: (query: string) => {
        const q = query.toLowerCase().trim();
        if (!q) return get().exerciseNames.slice(0, 5);

        return get()
          .exerciseNames.filter((name) => name.toLowerCase().includes(q))
          .slice(0, 5);
      },

      getTaskSuggestions: (query: string) => {
        const q = query.toLowerCase().trim();
        if (!q) return get().taskNames.slice(0, 5);

        return get()
          .taskNames.filter((name) => name.toLowerCase().includes(q))
          .slice(0, 5);
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'timeflow_autocomplete_history',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
