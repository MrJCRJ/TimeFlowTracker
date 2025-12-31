import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Job, CreateJobInput, UpdateJobInput, Earning, AddEarningInput } from '@/types/entries/work';

const generateId = () => `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const generateEarningId = () => `earn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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
  // CRUD de Jobs
  addJob: (input: CreateJobInput) => Job;
  updateJob: (id: string, updates: UpdateJobInput) => void;
  deleteJob: (id: string) => void;

  // CRUD de Earnings (Ganhos)
  addEarning: (jobId: string, input: AddEarningInput) => Earning | null;
  updateEarning: (jobId: string, earningId: string, updates: Partial<AddEarningInput>) => void;
  deleteEarning: (jobId: string, earningId: string) => void;

  // Seleção
  selectJob: (jobId: string | null) => void;

  // Getters
  getJobById: (id: string) => Job | undefined;
  getActiveJobs: () => Job[];
  getJobEarnings: (jobId: string, month?: string) => Earning[];
  getTotalEarnings: (jobId: string, month?: string) => number;

  // Cálculo de valor/hora (precisa de timeEntries externo)
  calculateHourlyRate: (jobId: string, totalSeconds: number, month?: string) => number | null;

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
          color: input.color,
          isActive: true,
          earnings: [],
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

      // === Funções de Ganhos ===

      addEarning: (jobId: string, input: AddEarningInput) => {
        const job = get().getJobById(jobId);
        if (!job) return null;

        const newEarning: Earning = {
          id: generateEarningId(),
          amount: input.amount,
          date: input.date,
          description: input.description,
        };

        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  earnings: [...j.earnings, newEarning],
                  updatedAt: now(),
                }
              : j
          ),
        }));

        return newEarning;
      },

      updateEarning: (jobId: string, earningId: string, updates: Partial<AddEarningInput>) => {
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  earnings: job.earnings.map((e) =>
                    e.id === earningId ? { ...e, ...updates } : e
                  ),
                  updatedAt: now(),
                }
              : job
          ),
        }));
      },

      deleteEarning: (jobId: string, earningId: string) => {
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  earnings: job.earnings.filter((e) => e.id !== earningId),
                  updatedAt: now(),
                }
              : job
          ),
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

      getJobEarnings: (jobId: string, month?: string) => {
        const job = get().getJobById(jobId);
        if (!job) return [];

        if (!month) return job.earnings;

        // Filtrar por mês (formato: "YYYY-MM")
        return job.earnings.filter((e) => e.date.startsWith(month));
      },

      getTotalEarnings: (jobId: string, month?: string) => {
        const earnings = get().getJobEarnings(jobId, month);
        return earnings.reduce((sum, e) => sum + e.amount, 0);
      },

      /**
       * Calcula o valor/hora baseado em ganhos e tempo trabalhado
       * @param jobId - ID do trabalho
       * @param totalSeconds - Total de segundos trabalhados (vem do timerStore)
       * @param month - Filtro de mês opcional (formato "YYYY-MM")
       * @returns Valor por hora ou null se não houver dados suficientes
       */
      calculateHourlyRate: (jobId: string, totalSeconds: number, month?: string) => {
        const totalEarnings = get().getTotalEarnings(jobId, month);
        
        if (totalEarnings === 0 || totalSeconds === 0) {
          return null;
        }

        const totalHours = totalSeconds / 3600;
        return totalEarnings / totalHours;
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
