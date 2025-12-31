/**
 * Testes de Integração para o Job Store
 *
 * Testa o gerenciamento de trabalhos/jobs com:
 * - CRUD completo
 * - Seleção de job para timer
 * - Cálculo de ganhos
 */

import { useJobStore } from '@/stores/jobStore';
import { act } from '@testing-library/react';

describe('JobStore - Integração', () => {
  beforeEach(() => {
    // Reset store antes de cada teste
    act(() => {
      useJobStore.getState().reset();
    });
  });

  describe('CRUD de Jobs', () => {
    it('deve adicionar um novo job', () => {
      const { addJob, jobs } = useJobStore.getState();

      act(() => {
        addJob({
          name: 'Freelance Web',
          hourlyRate: 50,
          color: '#3b82f6',
        });
      });

      const state = useJobStore.getState();
      expect(state.jobs).toHaveLength(1);
      expect(state.jobs[0].name).toBe('Freelance Web');
      expect(state.jobs[0].hourlyRate).toBe(50);
      expect(state.jobs[0].isActive).toBe(true);
    });

    it('deve adicionar múltiplos jobs', () => {
      const { addJob } = useJobStore.getState();

      act(() => {
        addJob({ name: 'Trabalho 1', color: '#3b82f6' });
        addJob({ name: 'Trabalho 2', hourlyRate: 100, color: '#22c55e' });
        addJob({ name: 'Trabalho 3', hourlyRate: 75, color: '#f59e0b' });
      });

      const state = useJobStore.getState();
      expect(state.jobs).toHaveLength(3);
    });

    it('deve atualizar um job existente', () => {
      const { addJob } = useJobStore.getState();

      let jobId: string;
      act(() => {
        const job = addJob({ name: 'Job Original', color: '#3b82f6' });
        jobId = job.id;
      });

      act(() => {
        useJobStore.getState().updateJob(jobId!, {
          name: 'Job Atualizado',
          hourlyRate: 120,
        });
      });

      const state = useJobStore.getState();
      const updatedJob = state.jobs.find((j) => j.id === jobId);
      expect(updatedJob?.name).toBe('Job Atualizado');
      expect(updatedJob?.hourlyRate).toBe(120);
    });

    it('deve deletar um job', () => {
      const { addJob } = useJobStore.getState();

      let jobId: string;
      act(() => {
        const job = addJob({ name: 'Job para deletar', color: '#3b82f6' });
        jobId = job.id;
      });

      expect(useJobStore.getState().jobs).toHaveLength(1);

      act(() => {
        useJobStore.getState().deleteJob(jobId!);
      });

      expect(useJobStore.getState().jobs).toHaveLength(0);
    });

    it('deve limpar seleção ao deletar job selecionado', () => {
      const { addJob, selectJob } = useJobStore.getState();

      let jobId: string;
      act(() => {
        const job = addJob({ name: 'Job selecionado', color: '#3b82f6' });
        jobId = job.id;
        selectJob(jobId);
      });

      expect(useJobStore.getState().selectedJobId).toBe(jobId!);

      act(() => {
        useJobStore.getState().deleteJob(jobId!);
      });

      expect(useJobStore.getState().selectedJobId).toBeNull();
    });
  });

  describe('Seleção de Job', () => {
    it('deve selecionar um job', () => {
      const { addJob, selectJob } = useJobStore.getState();

      let jobId: string;
      act(() => {
        const job = addJob({ name: 'Job para selecionar', color: '#3b82f6' });
        jobId = job.id;
      });

      act(() => {
        selectJob(jobId!);
      });

      expect(useJobStore.getState().selectedJobId).toBe(jobId!);
    });

    it('deve desselecionar job passando null', () => {
      const { addJob, selectJob } = useJobStore.getState();

      act(() => {
        const job = addJob({ name: 'Job', color: '#3b82f6' });
        selectJob(job.id);
      });

      expect(useJobStore.getState().selectedJobId).not.toBeNull();

      act(() => {
        selectJob(null);
      });

      expect(useJobStore.getState().selectedJobId).toBeNull();
    });
  });

  describe('Getters', () => {
    it('deve retornar apenas jobs ativos', () => {
      const { addJob, updateJob } = useJobStore.getState();

      act(() => {
        addJob({ name: 'Job Ativo 1', color: '#3b82f6' });
        const inactiveJob = addJob({ name: 'Job Inativo', color: '#22c55e' });
        addJob({ name: 'Job Ativo 2', color: '#f59e0b' });

        updateJob(inactiveJob.id, { isActive: false });
      });

      const activeJobs = useJobStore.getState().getActiveJobs();
      expect(activeJobs).toHaveLength(2);
      expect(activeJobs.every((j) => j.isActive)).toBe(true);
    });

    it('deve retornar job por ID', () => {
      const { addJob, getJobById } = useJobStore.getState();

      let jobId: string;
      act(() => {
        const job = addJob({ name: 'Job específico', hourlyRate: 80, color: '#3b82f6' });
        jobId = job.id;
      });

      const job = useJobStore.getState().getJobById(jobId!);
      expect(job).toBeDefined();
      expect(job?.name).toBe('Job específico');
      expect(job?.hourlyRate).toBe(80);
    });

    it('deve retornar undefined para ID inexistente', () => {
      const job = useJobStore.getState().getJobById('id-inexistente');
      expect(job).toBeUndefined();
    });
  });

  describe('Fluxo de Integração Completo', () => {
    it('deve gerenciar múltiplos jobs e seleção corretamente', () => {
      const { addJob, selectJob, updateJob, deleteJob, getActiveJobs } = useJobStore.getState();

      // Adicionar jobs
      let job1Id: string, job2Id: string, job3Id: string;
      act(() => {
        const job1 = addJob({ name: 'Empresa A', hourlyRate: 50, color: '#3b82f6' });
        const job2 = addJob({ name: 'Freelance', hourlyRate: 100, color: '#22c55e' });
        const job3 = addJob({ name: 'Projeto X', hourlyRate: 75, color: '#f59e0b' });
        job1Id = job1.id;
        job2Id = job2.id;
        job3Id = job3.id;
      });

      expect(useJobStore.getState().jobs).toHaveLength(3);

      // Selecionar job
      act(() => {
        selectJob(job2Id!);
      });
      expect(useJobStore.getState().selectedJobId).toBe(job2Id);

      // Desativar um job
      act(() => {
        updateJob(job1Id!, { isActive: false });
      });
      expect(useJobStore.getState().getActiveJobs()).toHaveLength(2);

      // Trocar seleção
      act(() => {
        selectJob(job3Id!);
      });
      expect(useJobStore.getState().selectedJobId).toBe(job3Id);

      // Deletar job selecionado
      act(() => {
        deleteJob(job3Id!);
      });
      expect(useJobStore.getState().selectedJobId).toBeNull();
      expect(useJobStore.getState().jobs).toHaveLength(2);
    });
  });

  describe('Reset', () => {
    it('deve resetar o store para estado inicial', () => {
      const { addJob, selectJob } = useJobStore.getState();

      act(() => {
        const job = addJob({ name: 'Job', color: '#3b82f6' });
        selectJob(job.id);
      });

      expect(useJobStore.getState().jobs).toHaveLength(1);
      expect(useJobStore.getState().selectedJobId).not.toBeNull();

      act(() => {
        useJobStore.getState().reset();
      });

      expect(useJobStore.getState().jobs).toHaveLength(0);
      expect(useJobStore.getState().selectedJobId).toBeNull();
    });
  });
});
