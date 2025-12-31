/**
 * Testes de Integração para o Job Store
 *
 * Testa o gerenciamento de trabalhos/jobs com:
 * - CRUD completo de Jobs
 * - CRUD de Earnings (Ganhos)
 * - Seleção de job para timer
 * - Cálculo de valor/hora dinâmico
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
      act(() => {
        useJobStore.getState().addJob({
          name: 'Freelance Web',
          color: '#3b82f6',
        });
      });

      const state = useJobStore.getState();
      expect(state.jobs).toHaveLength(1);
      expect(state.jobs[0].name).toBe('Freelance Web');
      expect(state.jobs[0].color).toBe('#3b82f6');
      expect(state.jobs[0].isActive).toBe(true);
      expect(state.jobs[0].earnings).toEqual([]);
    });

    it('deve adicionar múltiplos jobs', () => {
      const { addJob } = useJobStore.getState();

      act(() => {
        addJob({ name: 'Trabalho 1', color: '#3b82f6' });
        addJob({ name: 'Trabalho 2', color: '#22c55e' });
        addJob({ name: 'Trabalho 3', color: '#f59e0b' });
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
          color: '#22c55e',
        });
      });

      const state = useJobStore.getState();
      const updatedJob = state.jobs.find((j) => j.id === jobId);
      expect(updatedJob?.name).toBe('Job Atualizado');
      expect(updatedJob?.color).toBe('#22c55e');
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

  describe('CRUD de Earnings (Ganhos)', () => {
    it('deve adicionar um ganho a um job', () => {
      const { addJob, addEarning } = useJobStore.getState();

      let jobId: string;
      act(() => {
        const job = addJob({ name: 'Freelance', color: '#3b82f6' });
        jobId = job.id;
      });

      act(() => {
        addEarning(jobId!, {
          amount: 500,
          date: '2024-01-15T10:00:00.000Z',
          description: 'Projeto X',
        });
      });

      const job = useJobStore.getState().getJobById(jobId!);
      expect(job?.earnings).toHaveLength(1);
      expect(job?.earnings[0].amount).toBe(500);
      expect(job?.earnings[0].description).toBe('Projeto X');
    });

    it('deve adicionar múltiplos ganhos a um job', () => {
      const { addJob, addEarning } = useJobStore.getState();

      let jobId: string;
      act(() => {
        const job = addJob({ name: 'Freelance', color: '#3b82f6' });
        jobId = job.id;
      });

      act(() => {
        addEarning(jobId!, { amount: 500, date: '2024-01-10T10:00:00.000Z' });
        addEarning(jobId!, { amount: 300, date: '2024-01-15T10:00:00.000Z' });
        addEarning(jobId!, { amount: 700, date: '2024-01-20T10:00:00.000Z' });
      });

      const job = useJobStore.getState().getJobById(jobId!);
      expect(job?.earnings).toHaveLength(3);
    });

    it('deve deletar um ganho', () => {
      const { addJob, addEarning, deleteEarning } = useJobStore.getState();

      let jobId: string;
      let earningId: string;
      act(() => {
        const job = addJob({ name: 'Freelance', color: '#3b82f6' });
        jobId = job.id;
        const earning = addEarning(jobId, { amount: 500, date: '2024-01-15T10:00:00.000Z' });
        earningId = earning!.id;
      });

      expect(useJobStore.getState().getJobById(jobId!)?.earnings).toHaveLength(1);

      act(() => {
        deleteEarning(jobId!, earningId!);
      });

      expect(useJobStore.getState().getJobById(jobId!)?.earnings).toHaveLength(0);
    });

    it('deve atualizar um ganho', () => {
      const { addJob, addEarning, updateEarning } = useJobStore.getState();

      let jobId: string;
      let earningId: string;
      act(() => {
        const job = addJob({ name: 'Freelance', color: '#3b82f6' });
        jobId = job.id;
        const earning = addEarning(jobId, { amount: 500, date: '2024-01-15T10:00:00.000Z' });
        earningId = earning!.id;
      });

      act(() => {
        updateEarning(jobId!, earningId!, { amount: 750, description: 'Valor atualizado' });
      });

      const job = useJobStore.getState().getJobById(jobId!);
      expect(job?.earnings[0].amount).toBe(750);
      expect(job?.earnings[0].description).toBe('Valor atualizado');
    });

    it('deve retornar null ao adicionar earning a job inexistente', () => {
      const { addEarning } = useJobStore.getState();

      let result: ReturnType<typeof addEarning>;
      act(() => {
        result = addEarning('job-inexistente', { amount: 500, date: '2024-01-15T10:00:00.000Z' });
      });

      expect(result!).toBeNull();
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
      const { addJob } = useJobStore.getState();

      let jobId: string;
      act(() => {
        const job = addJob({ name: 'Job específico', color: '#3b82f6' });
        jobId = job.id;
      });

      const job = useJobStore.getState().getJobById(jobId!);
      expect(job).toBeDefined();
      expect(job?.name).toBe('Job específico');
      expect(job?.color).toBe('#3b82f6');
    });

    it('deve retornar undefined para ID inexistente', () => {
      const job = useJobStore.getState().getJobById('id-inexistente');
      expect(job).toBeUndefined();
    });

    it('deve retornar ganhos de um job filtrados por mês', () => {
      const { addJob, addEarning } = useJobStore.getState();

      let jobId: string;
      act(() => {
        const job = addJob({ name: 'Freelance', color: '#3b82f6' });
        jobId = job.id;
        // Janeiro
        addEarning(jobId, { amount: 500, date: '2024-01-10T10:00:00.000Z' });
        addEarning(jobId, { amount: 300, date: '2024-01-15T10:00:00.000Z' });
        // Fevereiro
        addEarning(jobId, { amount: 700, date: '2024-02-05T10:00:00.000Z' });
      });

      const januaryEarnings = useJobStore.getState().getJobEarnings(jobId!, '2024-01');
      expect(januaryEarnings).toHaveLength(2);

      const februaryEarnings = useJobStore.getState().getJobEarnings(jobId!, '2024-02');
      expect(februaryEarnings).toHaveLength(1);

      const allEarnings = useJobStore.getState().getJobEarnings(jobId!);
      expect(allEarnings).toHaveLength(3);
    });

    it('deve calcular total de ganhos', () => {
      const { addJob, addEarning } = useJobStore.getState();

      let jobId: string;
      act(() => {
        const job = addJob({ name: 'Freelance', color: '#3b82f6' });
        jobId = job.id;
        addEarning(jobId, { amount: 500, date: '2024-01-10T10:00:00.000Z' });
        addEarning(jobId, { amount: 300, date: '2024-01-15T10:00:00.000Z' });
        addEarning(jobId, { amount: 700, date: '2024-02-05T10:00:00.000Z' });
      });

      const januaryTotal = useJobStore.getState().getTotalEarnings(jobId!, '2024-01');
      expect(januaryTotal).toBe(800);

      const totalAll = useJobStore.getState().getTotalEarnings(jobId!);
      expect(totalAll).toBe(1500);
    });
  });

  describe('Cálculo de Valor/Hora', () => {
    it('deve calcular valor/hora corretamente', () => {
      const { addJob, addEarning } = useJobStore.getState();

      let jobId: string;
      act(() => {
        const job = addJob({ name: 'Freelance', color: '#3b82f6' });
        jobId = job.id;
        // Total: R$ 1000 no mês
        addEarning(jobId, { amount: 600, date: '2024-01-10T10:00:00.000Z' });
        addEarning(jobId, { amount: 400, date: '2024-01-20T10:00:00.000Z' });
      });

      // 10 horas trabalhadas = 36000 segundos
      const hourlyRate = useJobStore.getState().calculateHourlyRate(jobId!, 36000, '2024-01');

      // R$ 1000 / 10h = R$ 100/h
      expect(hourlyRate).toBe(100);
    });

    it('deve retornar null se não houver ganhos', () => {
      const { addJob } = useJobStore.getState();

      let jobId: string;
      act(() => {
        const job = addJob({ name: 'Freelance', color: '#3b82f6' });
        jobId = job.id;
      });

      const hourlyRate = useJobStore.getState().calculateHourlyRate(jobId!, 36000, '2024-01');
      expect(hourlyRate).toBeNull();
    });

    it('deve retornar null se não houver horas trabalhadas', () => {
      const { addJob, addEarning } = useJobStore.getState();

      let jobId: string;
      act(() => {
        const job = addJob({ name: 'Freelance', color: '#3b82f6' });
        jobId = job.id;
        addEarning(jobId, { amount: 500, date: '2024-01-10T10:00:00.000Z' });
      });

      const hourlyRate = useJobStore.getState().calculateHourlyRate(jobId!, 0, '2024-01');
      expect(hourlyRate).toBeNull();
    });
  });

  describe('Fluxo de Integração Completo', () => {
    it('deve gerenciar múltiplos jobs e seleção corretamente', () => {
      const { addJob, selectJob, updateJob, deleteJob } = useJobStore.getState();

      // Adicionar jobs
      let job1Id: string, job2Id: string, job3Id: string;
      act(() => {
        const job1 = addJob({ name: 'Empresa A', color: '#3b82f6' });
        const job2 = addJob({ name: 'Freelance', color: '#22c55e' });
        const job3 = addJob({ name: 'Projeto X', color: '#f59e0b' });
        job1Id = job1.id;
        job2Id = job2.id;
        job3Id = job3.id;
      });

      expect(useJobStore.getState().jobs).toHaveLength(3);

      // Selecionar job
      act(() => {
        selectJob(job2Id!);
      });
      expect(useJobStore.getState().selectedJobId).toBe(job2Id!);

      // Desativar um job
      act(() => {
        updateJob(job3Id!, { isActive: false });
      });
      expect(useJobStore.getState().getActiveJobs()).toHaveLength(2);

      // Deletar job selecionado
      act(() => {
        deleteJob(job2Id!);
      });
      expect(useJobStore.getState().selectedJobId).toBeNull();
      expect(useJobStore.getState().jobs).toHaveLength(2);

      // Verificar estado final
      const finalJobs = useJobStore.getState().jobs;
      expect(finalJobs.map((j) => j.name)).toContain('Empresa A');
      expect(finalJobs.map((j) => j.name)).toContain('Projeto X');
    });
  });

  describe('Reset', () => {
    it('deve resetar o store para estado inicial', () => {
      const { addJob, selectJob, addEarning, reset } = useJobStore.getState();

      act(() => {
        const job = addJob({ name: 'Job', color: '#3b82f6' });
        selectJob(job.id);
        addEarning(job.id, { amount: 500, date: '2024-01-15T10:00:00.000Z' });
      });

      expect(useJobStore.getState().jobs).toHaveLength(1);
      expect(useJobStore.getState().selectedJobId).not.toBeNull();

      act(() => {
        reset();
      });

      expect(useJobStore.getState().jobs).toHaveLength(0);
      expect(useJobStore.getState().selectedJobId).toBeNull();
    });
  });
});
