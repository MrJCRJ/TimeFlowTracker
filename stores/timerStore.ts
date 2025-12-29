import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TimeEntry, TimerState } from '@/types';
import { generateId, now, diffInSeconds } from '@/lib/utils';

interface TimerStoreState {
  isRunning: boolean;
  activeEntry: TimeEntry | null;
  elapsedSeconds: number;
  timeEntries: TimeEntry[];
  isLoading: boolean;
  error: string | null;
}

interface TimerStoreActions {
  // Timer controls
  startTimer: (categoryId: string, userId: string, notes?: string) => TimeEntry;
  stopTimer: (notes?: string) => TimeEntry | null;
  updateElapsed: () => void;
  restoreActiveTimer: (entry: TimeEntry) => void; // Restaurar timer ativo da nuvem

  // Time entries
  addTimeEntry: (entry: TimeEntry) => void;
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteTimeEntry: (id: string) => void;
  setTimeEntries: (entries: TimeEntry[]) => void;

  // State
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Getters
  getTimerState: () => TimerState;
  getTodayEntries: () => TimeEntry[];
  getEntriesByCategory: (categoryId: string) => TimeEntry[];
}

type TimerStore = TimerStoreState & TimerStoreActions;

const initialState: TimerStoreState = {
  isRunning: false,
  activeEntry: null,
  elapsedSeconds: 0,
  timeEntries: [],
  isLoading: false,
  error: null,
};

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      startTimer: (categoryId: string, userId: string, notes?: string) => {
        const existingActive = get().activeEntry;
        if (existingActive) {
          throw new Error('Timer já está rodando');
        }

        const newEntry: TimeEntry = {
          id: generateId(),
          categoryId,
          startTime: now(),
          endTime: null,
          duration: null,
          userId,
          notes: notes ?? null,
          createdAt: now(),
          updatedAt: now(),
        };

        set({
          isRunning: true,
          activeEntry: newEntry,
          elapsedSeconds: 0,
        });

        return newEntry;
      },

      stopTimer: (notes?: string) => {
        const { activeEntry } = get();
        if (!activeEntry) {
          return null;
        }

        const endTime = now();
        const completedEntry: TimeEntry = {
          ...activeEntry,
          endTime,
          duration: diffInSeconds(activeEntry.startTime, endTime),
          notes: notes ?? activeEntry.notes,
          updatedAt: endTime,
        };

        set((state: TimerStoreState) => ({
          isRunning: false,
          activeEntry: null,
          elapsedSeconds: 0,
          timeEntries: [...state.timeEntries, completedEntry],
        }));

        return completedEntry;
      },

      updateElapsed: () => {
        const { activeEntry, isRunning } = get();
        if (!isRunning || !activeEntry) return;

        const elapsed = diffInSeconds(activeEntry.startTime, now());
        set({ elapsedSeconds: elapsed });
      },

      // Restaurar timer ativo da nuvem (para sincronização entre dispositivos)
      restoreActiveTimer: (entry: TimeEntry) => {
        // Só restaurar se não houver timer ativo local
        const { activeEntry: currentActive } = get();
        if (currentActive) return;

        // Calcular tempo decorrido desde o início
        const elapsed = diffInSeconds(entry.startTime, now());

        set({
          isRunning: true,
          activeEntry: entry,
          elapsedSeconds: elapsed,
        });
      },

      addTimeEntry: (entry: TimeEntry) => {
        set((state: TimerStoreState) => ({
          timeEntries: [...state.timeEntries, entry],
        }));
      },

      updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => {
        set((state: TimerStoreState) => ({
          timeEntries: state.timeEntries.map((entry: TimeEntry) =>
            entry.id === id ? { ...entry, ...updates, updatedAt: now() } : entry
          ),
        }));
      },

      deleteTimeEntry: (id: string) => {
        set((state: TimerStoreState) => ({
          timeEntries: state.timeEntries.filter((entry: TimeEntry) => entry.id !== id),
        }));
      },

      setTimeEntries: (entries: TimeEntry[]) => {
        set({ timeEntries: entries });
        // Não marcar como atualizado aqui pois é usado pelo sync para sobrescrever dados
      },

      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      reset: () => set(initialState),

      getTimerState: (): TimerState => {
        const { isRunning, activeEntry, elapsedSeconds } = get();
        return { isRunning, activeEntry, elapsedSeconds };
      },

      getTodayEntries: () => {
        const { timeEntries } = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return timeEntries.filter((entry: TimeEntry) => {
          const entryDate = new Date(entry.startTime);
          return entryDate >= today;
        });
      },

      getEntriesByCategory: (categoryId: string) => {
        const { timeEntries } = get();
        return timeEntries.filter((entry: TimeEntry) => entry.categoryId === categoryId);
      },
    }),
    {
      name: 'timer-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persistir apenas os dados essenciais
        isRunning: state.isRunning,
        activeEntry: state.activeEntry,
        timeEntries: state.timeEntries,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.isRunning && state?.activeEntry) {
          // Recalcular tempo decorrido após reidratação
          const elapsed = diffInSeconds(state.activeEntry.startTime, now());
          state.elapsedSeconds = elapsed;
        }
      },
    }
  )
);

// Seletores
export const selectIsRunning = (state: TimerStore) => state.isRunning;
export const selectActiveEntry = (state: TimerStore) => state.activeEntry;
export const selectElapsedSeconds = (state: TimerStore) => state.elapsedSeconds;
export const selectTimeEntries = (state: TimerStore) => state.timeEntries;
