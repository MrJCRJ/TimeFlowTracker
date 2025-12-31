import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Store para histórico de autocomplete
 * Armazena nomes de exercícios, tarefas e atividades já utilizados para sugestões
 */

interface AutocompleteHistoryState {
  exerciseNames: string[];
  taskNames: string[];
  activityNames: string[]; // Atividades simples (sono, lazer, casa, higiene)
}

interface AutocompleteHistoryActions {
  addExerciseName: (name: string) => void;
  addTaskName: (name: string) => void;
  addActivityName: (name: string) => void;
  getExerciseSuggestions: (query: string) => string[];
  getTaskSuggestions: (query: string) => string[];
  getActivitySuggestions: (query: string) => string[];
  setAutocomplete: (data: {
    exerciseNames: string[];
    taskNames: string[];
    activityNames?: string[];
  }) => void;
  reset: () => void;
}

type AutocompleteHistoryStore = AutocompleteHistoryState & AutocompleteHistoryActions;

const MAX_HISTORY_ITEMS = 100;

const initialState: AutocompleteHistoryState = {
  exerciseNames: [],
  taskNames: [],
  activityNames: [],
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

      addActivityName: (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;

        set((state) => {
          const filtered = state.activityNames.filter(
            (n) => n.toLowerCase() !== trimmed.toLowerCase()
          );
          const newList = [trimmed, ...filtered].slice(0, MAX_HISTORY_ITEMS);
          return { activityNames: newList };
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

      getActivitySuggestions: (query: string) => {
        const q = query.toLowerCase().trim();
        if (!q) return get().activityNames.slice(0, 5);

        return get()
          .activityNames.filter((name) => name.toLowerCase().includes(q))
          .slice(0, 5);
      },

      reset: () => {
        set(initialState);
      },

      setAutocomplete: (data: {
        exerciseNames: string[];
        taskNames: string[];
        activityNames?: string[];
      }) => {
        set({
          exerciseNames: data.exerciseNames || [],
          taskNames: data.taskNames || [],
          activityNames: data.activityNames || [],
        });
      },
    }),
    {
      name: 'timeflow_autocomplete_history',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
