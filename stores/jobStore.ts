import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Job, CreateJobInput, UpdateJobInput } from '@/types/entries/work';

const generateId = () => `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();

// Cores padrão para trabalhos
export const JOB_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#22c55e', // green
  '#14b8a6', // teal
  '#f43f5e', // rose
  '#6366f1', // indigo
] as const;

interface JobStoreState {
  jobs: Job[];
  selectedJobId: string | null; // Trabalho selecionado para o timer atual
}

interface JobStoreActions {
  // CRUD
  addJob: (input: CreateJobInput) => Job;
  updateJob: (id: string, updates: UpdateJobInput) => void;
  deleteJob: (id: string) => void;

  // Seleção
  selectJob: (jobId: string | null) => void;

  // Getters
  getJobById: (id: string) => Job | undefined;
  getActiveJobs: () => Job[];

  // Reset
  reset: () => void;
}

type JobStore = JobStoreState & JobStoreActions;

const initialState: JobStoreState = {
  jobs: [],
  selectedJobId: null,
};

export const useJobStore = create<JobStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addJob: (input: CreateJobInput) => {
        const newJob: Job = {
          id: generateId(),
          name: input.name,
          hourlyRate: input.hourlyRate,
          color: input.color,
          isActive: true,
          createdAt: now(),
          updatedAt: now(),
        };

        set((state) => ({
          jobs: [...state.jobs, newJob],
        }));

        return newJob;
      },

      updateJob: (id: string, updates: UpdateJobInput) => {
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id
              ? {
                  ...job,
                  ...updates,
                  updatedAt: now(),
                }
              : job
          ),
        }));
      },

      deleteJob: (id: string) => {
        set((state) => ({
          jobs: state.jobs.filter((job) => job.id !== id),
          selectedJobId: state.selectedJobId === id ? null : state.selectedJobId,
        }));
      },

      selectJob: (jobId: string | null) => {
        set({ selectedJobId: jobId });
      },

      getJobById: (id: string) => {
        return get().jobs.find((job) => job.id === id);
      },

      getActiveJobs: () => {
        return get().jobs.filter((job) => job.isActive);
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'timeflow_jobs',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
