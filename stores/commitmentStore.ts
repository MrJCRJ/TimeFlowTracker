import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Commitment,
  CreateCommitmentInput,
  UpdateCommitmentInput,
  Subtask,
  Recurrence,
} from '@/types/entries/commitment';

const generateId = () => `commit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();

/**
 * Calcula a próxima data baseado na recorrência
 */
function calculateNextDate(currentDate: string, recurrence: Recurrence): string {
  const date = new Date(currentDate);

  switch (recurrence.type) {
    case 'daily':
      date.setDate(date.getDate() + recurrence.interval);
      break;
    case 'weekly':
      date.setDate(date.getDate() + recurrence.interval * 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + recurrence.interval);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + recurrence.interval);
      break;
  }

  return date.toISOString().split('T')[0];
}

/**
 * Verifica se a próxima data está dentro do período de recorrência
 */
function isWithinRecurrencePeriod(nextDate: string, recurrence: Recurrence): boolean {
  if (!recurrence.endDate) return true;
  return nextDate <= recurrence.endDate;
}

interface CommitmentStoreState {
  commitments: Commitment[];
  selectedCommitmentId: string | null; // Para uso no timer
}

interface CommitmentStoreActions {
  // CRUD
  addCommitment: (input: CreateCommitmentInput) => Commitment;
  updateCommitment: (id: string, updates: UpdateCommitmentInput) => void;
  deleteCommitment: (id: string) => void;
  setCommitments: (commitments: Commitment[]) => void; // Para restauração de dados

  // Seleção para timer
  selectCommitment: (commitmentId: string | null) => void;

  // Completar
  toggleComplete: (id: string) => void;
  toggleSubtask: (commitmentId: string, subtaskId: string) => void;
  addSubtask: (commitmentId: string, text: string) => void;
  removeSubtask: (commitmentId: string, subtaskId: string) => void;

  // Recorrência
  generateNextRecurrence: (id: string) => Commitment | null;

  // Getters
  getCommitmentById: (id: string) => Commitment | undefined;
  getPendingCommitments: () => Commitment[];
  getCompletedCommitments: () => Commitment[];
  getOverdueCommitments: () => Commitment[];
  getUpcomingCommitments: (days: number) => Commitment[];
  getCommitmentsByDate: (date: string) => Commitment[];
  getRecurringCommitments: () => Commitment[];

  // Reset
  reset: () => void;
}

type CommitmentStore = CommitmentStoreState & CommitmentStoreActions;

const initialState: CommitmentStoreState = {
  commitments: [],
  selectedCommitmentId: null,
};

export const useCommitmentStore = create<CommitmentStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addCommitment: (input: CreateCommitmentInput) => {
        const subtasks: Subtask[] =
          input.subtasks?.map((st) => ({
            id: generateId(),
            text: st.text,
            completed: false,
          })) || [];

        const newCommitment: Commitment = {
          id: generateId(),
          categoryId: 'commitments',
          type: input.type,
          title: input.title,
          description: input.description,
          dueDate: input.dueDate,
          dueTime: input.dueTime,
          completed: false,
          subtasks: subtasks.length > 0 ? subtasks : undefined,
          recurrence: input.recurrence,
          reminder: input.reminder ?? true,
          priority: input.priority ?? 'medium',
          createdAt: now(),
          updatedAt: now(),
        };

        set((state) => ({
          commitments: [...state.commitments, newCommitment],
        }));

        return newCommitment;
      },

      updateCommitment: (id: string, updates: UpdateCommitmentInput) => {
        set((state) => ({
          commitments: state.commitments.map((commitment) =>
            commitment.id === id
              ? {
                  ...commitment,
                  ...updates,
                  updatedAt: now(),
                }
              : commitment
          ),
        }));
      },

      deleteCommitment: (id: string) => {
        set((state) => ({
          commitments: state.commitments.filter((c) => c.id !== id),
          selectedCommitmentId:
            state.selectedCommitmentId === id ? null : state.selectedCommitmentId,
        }));
      },

      selectCommitment: (commitmentId: string | null) => {
        set({ selectedCommitmentId: commitmentId });
      },

      toggleComplete: (id: string) => {
        const commitment = get().commitments.find((c) => c.id === id);
        if (!commitment) return;

        const isCompleting = !commitment.completed;

        set((state) => ({
          commitments: state.commitments.map((c) =>
            c.id === id
              ? {
                  ...c,
                  completed: isCompleting,
                  completedAt: isCompleting ? now() : undefined,
                  updatedAt: now(),
                }
              : c
          ),
        }));

        // Se está completando e tem recorrência, gera próxima ocorrência
        if (isCompleting && commitment.recurrence) {
          get().generateNextRecurrence(id);
        }
      },

      generateNextRecurrence: (id: string) => {
        const commitment = get().commitments.find((c) => c.id === id);
        if (!commitment || !commitment.recurrence) return null;

        const nextDate = calculateNextDate(commitment.dueDate, commitment.recurrence);

        // Verifica se está dentro do período de recorrência
        if (!isWithinRecurrencePeriod(nextDate, commitment.recurrence)) {
          return null;
        }

        // Cria nova ocorrência com subtasks resetadas
        const newCommitment: Commitment = {
          id: generateId(),
          categoryId: commitment.categoryId,
          type: commitment.type,
          title: commitment.title,
          description: commitment.description,
          dueDate: nextDate,
          dueTime: commitment.dueTime,
          completed: false,
          subtasks: commitment.subtasks?.map((st) => ({
            id: generateId(),
            text: st.text,
            completed: false,
          })),
          recurrence: commitment.recurrence,
          reminder: commitment.reminder,
          priority: commitment.priority,
          createdAt: now(),
          updatedAt: now(),
        };

        set((state) => ({
          commitments: [...state.commitments, newCommitment],
        }));

        return newCommitment;
      },

      toggleSubtask: (commitmentId: string, subtaskId: string) => {
        set((state) => ({
          commitments: state.commitments.map((commitment) => {
            if (commitment.id !== commitmentId || !commitment.subtasks) return commitment;

            return {
              ...commitment,
              subtasks: commitment.subtasks.map((st) =>
                st.id === subtaskId
                  ? {
                      ...st,
                      completed: !st.completed,
                      completedAt: !st.completed ? now() : undefined,
                    }
                  : st
              ),
              updatedAt: now(),
            };
          }),
        }));
      },

      addSubtask: (commitmentId: string, text: string) => {
        const newSubtask: Subtask = {
          id: generateId(),
          text,
          completed: false,
        };

        set((state) => ({
          commitments: state.commitments.map((commitment) =>
            commitment.id === commitmentId
              ? {
                  ...commitment,
                  subtasks: [...(commitment.subtasks || []), newSubtask],
                  updatedAt: now(),
                }
              : commitment
          ),
        }));
      },

      removeSubtask: (commitmentId: string, subtaskId: string) => {
        set((state) => ({
          commitments: state.commitments.map((commitment) =>
            commitment.id === commitmentId
              ? {
                  ...commitment,
                  subtasks: commitment.subtasks?.filter((st) => st.id !== subtaskId),
                  updatedAt: now(),
                }
              : commitment
          ),
        }));
      },

      getCommitmentById: (id: string) => {
        return get().commitments.find((c) => c.id === id);
      },

      getPendingCommitments: () => {
        return get().commitments.filter((c) => !c.completed);
      },

      getCompletedCommitments: () => {
        return get().commitments.filter((c) => c.completed);
      },

      getOverdueCommitments: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().commitments.filter((c) => !c.completed && c.dueDate < today);
      },

      getUpcomingCommitments: (days: number) => {
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + days);

        const todayStr = today.toISOString().split('T')[0];
        const futureStr = futureDate.toISOString().split('T')[0];

        return get().commitments.filter(
          (c) => !c.completed && c.dueDate >= todayStr && c.dueDate <= futureStr
        );
      },

      getCommitmentsByDate: (date: string) => {
        return get().commitments.filter((c) => c.dueDate === date);
      },

      getRecurringCommitments: () => {
        return get().commitments.filter((c) => c.recurrence !== undefined);
      },

      reset: () => {
        set(initialState);
      },

      setCommitments: (commitments: Commitment[]) => {
        set({ commitments });
      },
    }),
    {
      name: 'timeflow_commitments',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
