import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/types';
import { generateId, now } from '@/lib/utils';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
}

interface TaskActions {
  // CRUD
  addTask: (input: CreateTaskInput, userId: string) => Task;
  updateTask: (id: string, input: UpdateTaskInput) => void;
  deleteTask: (id: string) => void;
  getTaskById: (id: string) => Task | undefined;

  // Queries
  getTasksByCategory: (categoryId: string) => Task[];
  getActiveTasksByCategory: (categoryId: string) => Task[];

  // Bulk operations
  setTasks: (tasks: Task[]) => void;
  deleteTasksByCategory: (categoryId: string) => void;

  // State
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

type TaskStore = TaskState & TaskActions;

const initialState: TaskState = {
  tasks: [],
  isLoading: false,
  error: null,
};

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addTask: (input: CreateTaskInput, userId: string) => {
        const newTask: Task = {
          id: generateId(),
          name: input.name,
          categoryId: input.categoryId,
          userId,
          description: input.description,
          isCompleted: false,
          createdAt: now(),
          updatedAt: now(),
        };

        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));

        return newTask;
      },

      updateTask: (id: string, input: UpdateTaskInput) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  ...input,
                  updatedAt: now(),
                }
              : task
          ),
        }));
      },

      deleteTask: (id: string) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },

      getTaskById: (id: string) => {
        return get().tasks.find((task) => task.id === id);
      },

      getTasksByCategory: (categoryId: string) => {
        return get().tasks.filter((task) => task.categoryId === categoryId);
      },

      getActiveTasksByCategory: (categoryId: string) => {
        return get().tasks.filter((task) => task.categoryId === categoryId && !task.isCompleted);
      },

      setTasks: (tasks: Task[]) => {
        set({ tasks });
      },

      deleteTasksByCategory: (categoryId: string) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.categoryId !== categoryId),
        }));
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      reset: () => set(initialState),
    }),
    {
      name: 'timeflow_tasks',
      version: 1,
    }
  )
);
