/**
 * Testes de Integração para o Commitment Store
 *
 * Testa o gerenciamento de compromissos com:
 * - CRUD completo
 * - Subtarefas
 * - Recorrência
 * - Filtros (atrasados, próximos, por data)
 */

import { useCommitmentStore } from '@/stores/commitmentStore';
import { act } from '@testing-library/react';

describe('CommitmentStore - Integração', () => {
  beforeEach(() => {
    act(() => {
      useCommitmentStore.getState().reset();
    });
  });

  // Helper para criar datas
  const today = () => new Date().toISOString().split('T')[0];
  const daysFromNow = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };
  const daysAgo = (days: number) => daysFromNow(-days);

  describe('CRUD de Compromissos', () => {
    it('deve adicionar um novo compromisso', () => {
      const { addCommitment } = useCommitmentStore.getState();

      act(() => {
        addCommitment({
          type: 'bill',
          title: 'Pagar conta de luz',
          dueDate: daysFromNow(5),
          priority: 'high',
        });
      });

      const state = useCommitmentStore.getState();
      expect(state.commitments).toHaveLength(1);
      expect(state.commitments[0].title).toBe('Pagar conta de luz');
      expect(state.commitments[0].type).toBe('bill');
      expect(state.commitments[0].priority).toBe('high');
      expect(state.commitments[0].completed).toBe(false);
    });

    it('deve usar valores padrão para campos opcionais', () => {
      const { addCommitment } = useCommitmentStore.getState();

      act(() => {
        addCommitment({
          type: 'task',
          title: 'Tarefa simples',
          dueDate: today(),
        });
      });

      const commitment = useCommitmentStore.getState().commitments[0];
      expect(commitment.priority).toBe('medium');
      expect(commitment.reminder).toBe(true);
    });

    it('deve atualizar um compromisso', () => {
      const { addCommitment, updateCommitment } = useCommitmentStore.getState();

      let commitmentId: string;
      act(() => {
        const c = addCommitment({
          type: 'task',
          title: 'Tarefa original',
          dueDate: today(),
        });
        commitmentId = c.id;
      });

      act(() => {
        updateCommitment(commitmentId!, {
          title: 'Tarefa atualizada',
          priority: 'high',
        });
      });

      const commitment = useCommitmentStore.getState().commitments[0];
      expect(commitment.title).toBe('Tarefa atualizada');
      expect(commitment.priority).toBe('high');
    });

    it('deve deletar um compromisso', () => {
      const { addCommitment, deleteCommitment } = useCommitmentStore.getState();

      let commitmentId: string;
      act(() => {
        const c = addCommitment({
          type: 'task',
          title: 'Para deletar',
          dueDate: today(),
        });
        commitmentId = c.id;
      });

      expect(useCommitmentStore.getState().commitments).toHaveLength(1);

      act(() => {
        deleteCommitment(commitmentId!);
      });

      expect(useCommitmentStore.getState().commitments).toHaveLength(0);
    });
  });

  describe('Completar Compromissos', () => {
    it('deve marcar como completo', () => {
      const { addCommitment, toggleComplete } = useCommitmentStore.getState();

      let commitmentId: string;
      act(() => {
        const c = addCommitment({
          type: 'task',
          title: 'Tarefa',
          dueDate: today(),
        });
        commitmentId = c.id;
      });

      expect(useCommitmentStore.getState().commitments[0].completed).toBe(false);

      act(() => {
        toggleComplete(commitmentId!);
      });

      const commitment = useCommitmentStore.getState().commitments[0];
      expect(commitment.completed).toBe(true);
      expect(commitment.completedAt).toBeDefined();
    });

    it('deve desmarcar compromisso completo', () => {
      const { addCommitment, toggleComplete } = useCommitmentStore.getState();

      let commitmentId: string;
      act(() => {
        const c = addCommitment({
          type: 'task',
          title: 'Tarefa',
          dueDate: today(),
        });
        commitmentId = c.id;
        toggleComplete(commitmentId);
      });

      expect(useCommitmentStore.getState().commitments[0].completed).toBe(true);

      act(() => {
        toggleComplete(commitmentId!);
      });

      const commitment = useCommitmentStore.getState().commitments[0];
      expect(commitment.completed).toBe(false);
      expect(commitment.completedAt).toBeUndefined();
    });
  });

  describe('Subtarefas', () => {
    it('deve adicionar compromisso com subtarefas', () => {
      const { addCommitment } = useCommitmentStore.getState();

      act(() => {
        addCommitment({
          type: 'task',
          title: 'Tarefa com subtarefas',
          dueDate: today(),
          subtasks: [{ text: 'Subtarefa 1' }, { text: 'Subtarefa 2' }, { text: 'Subtarefa 3' }],
        });
      });

      const commitment = useCommitmentStore.getState().commitments[0];
      expect(commitment.subtasks).toHaveLength(3);
      expect(commitment.subtasks?.[0].completed).toBe(false);
    });

    it('deve adicionar subtarefa a compromisso existente', () => {
      const { addCommitment, addSubtask } = useCommitmentStore.getState();

      let commitmentId: string;
      act(() => {
        const c = addCommitment({
          type: 'task',
          title: 'Tarefa',
          dueDate: today(),
        });
        commitmentId = c.id;
      });

      act(() => {
        addSubtask(commitmentId!, 'Nova subtarefa');
      });

      const commitment = useCommitmentStore.getState().commitments[0];
      expect(commitment.subtasks).toHaveLength(1);
      expect(commitment.subtasks?.[0].text).toBe('Nova subtarefa');
    });

    it('deve alternar estado de subtarefa', () => {
      const { addCommitment, toggleSubtask } = useCommitmentStore.getState();

      let commitmentId: string;
      let subtaskId: string;
      act(() => {
        const c = addCommitment({
          type: 'task',
          title: 'Tarefa',
          dueDate: today(),
          subtasks: [{ text: 'Subtarefa' }],
        });
        commitmentId = c.id;
        subtaskId = c.subtasks![0].id;
      });

      act(() => {
        toggleSubtask(commitmentId!, subtaskId!);
      });

      const subtask = useCommitmentStore.getState().commitments[0].subtasks?.[0];
      expect(subtask?.completed).toBe(true);
      expect(subtask?.completedAt).toBeDefined();
    });

    it('deve remover subtarefa', () => {
      const { addCommitment, removeSubtask } = useCommitmentStore.getState();

      let commitmentId: string;
      let subtaskId: string;
      act(() => {
        const c = addCommitment({
          type: 'task',
          title: 'Tarefa',
          dueDate: today(),
          subtasks: [{ text: 'Subtarefa 1' }, { text: 'Subtarefa 2' }],
        });
        commitmentId = c.id;
        subtaskId = c.subtasks![0].id;
      });

      expect(useCommitmentStore.getState().commitments[0].subtasks).toHaveLength(2);

      act(() => {
        removeSubtask(commitmentId!, subtaskId!);
      });

      expect(useCommitmentStore.getState().commitments[0].subtasks).toHaveLength(1);
    });
  });

  describe('Recorrência', () => {
    it('deve adicionar compromisso com recorrência', () => {
      const { addCommitment } = useCommitmentStore.getState();

      act(() => {
        addCommitment({
          type: 'bill',
          title: 'Conta mensal',
          dueDate: today(),
          recurrence: {
            type: 'monthly',
            interval: 1,
          },
        });
      });

      const commitment = useCommitmentStore.getState().commitments[0];
      expect(commitment.recurrence).toBeDefined();
      expect(commitment.recurrence?.type).toBe('monthly');
      expect(commitment.recurrence?.interval).toBe(1);
    });

    it('deve gerar próxima ocorrência ao completar', () => {
      const { addCommitment, toggleComplete } = useCommitmentStore.getState();

      let commitmentId: string;
      const startDate = today();
      act(() => {
        const c = addCommitment({
          type: 'bill',
          title: 'Conta mensal',
          dueDate: startDate,
          recurrence: {
            type: 'monthly',
            interval: 1,
          },
        });
        commitmentId = c.id;
      });

      expect(useCommitmentStore.getState().commitments).toHaveLength(1);

      act(() => {
        toggleComplete(commitmentId!);
      });

      // Deve ter 2 compromissos: o original (completo) + nova ocorrência
      const commitments = useCommitmentStore.getState().commitments;
      expect(commitments).toHaveLength(2);

      const original = commitments.find((c) => c.id === commitmentId);
      const next = commitments.find((c) => c.id !== commitmentId);

      expect(original?.completed).toBe(true);
      expect(next?.completed).toBe(false);
      expect(next?.dueDate).not.toBe(startDate);
    });

    it('deve respeitar data fim da recorrência', () => {
      const { addCommitment, toggleComplete } = useCommitmentStore.getState();

      let commitmentId: string;
      act(() => {
        const c = addCommitment({
          type: 'bill',
          title: 'Conta',
          dueDate: today(),
          recurrence: {
            type: 'monthly',
            interval: 1,
            endDate: today(), // Termina hoje
          },
        });
        commitmentId = c.id;
      });

      act(() => {
        toggleComplete(commitmentId!);
      });

      // Não deve gerar próxima ocorrência
      expect(useCommitmentStore.getState().commitments).toHaveLength(1);
    });

    it('deve gerar próxima recorrência diária corretamente', () => {
      const { addCommitment, toggleComplete } = useCommitmentStore.getState();

      let commitmentId: string;
      const startDate = today();
      act(() => {
        const c = addCommitment({
          type: 'task',
          title: 'Tarefa diária',
          dueDate: startDate,
          recurrence: {
            type: 'daily',
            interval: 3, // A cada 3 dias
          },
        });
        commitmentId = c.id;
      });

      act(() => {
        toggleComplete(commitmentId!);
      });

      const next = useCommitmentStore.getState().commitments.find((c) => !c.completed);
      expect(next?.dueDate).toBe(daysFromNow(3));
    });

    it('deve resetar subtarefas na nova ocorrência', () => {
      const { addCommitment, toggleSubtask, toggleComplete } = useCommitmentStore.getState();

      let commitmentId: string;
      act(() => {
        const c = addCommitment({
          type: 'task',
          title: 'Tarefa',
          dueDate: today(),
          subtasks: [{ text: 'Sub 1' }, { text: 'Sub 2' }],
          recurrence: { type: 'weekly', interval: 1 },
        });
        commitmentId = c.id;
        // Completar todas as subtarefas
        c.subtasks!.forEach((st) => toggleSubtask(c.id, st.id));
      });

      act(() => {
        toggleComplete(commitmentId!);
      });

      const next = useCommitmentStore.getState().commitments.find((c) => !c.completed);
      expect(next?.subtasks?.every((st) => !st.completed)).toBe(true);
    });
  });

  describe('Filtros', () => {
    beforeEach(() => {
      const { addCommitment } = useCommitmentStore.getState();

      act(() => {
        // Atrasado
        addCommitment({ type: 'bill', title: 'Atrasado 1', dueDate: daysAgo(3) });
        addCommitment({ type: 'task', title: 'Atrasado 2', dueDate: daysAgo(1) });

        // Hoje
        addCommitment({ type: 'event', title: 'Hoje', dueDate: today() });

        // Próximos dias
        addCommitment({ type: 'appointment', title: 'Amanhã', dueDate: daysFromNow(1) });
        addCommitment({ type: 'birthday', title: 'Em 5 dias', dueDate: daysFromNow(5) });
        addCommitment({ type: 'task', title: 'Em 10 dias', dueDate: daysFromNow(10) });
      });
    });

    it('deve retornar compromissos atrasados', () => {
      const overdue = useCommitmentStore.getState().getOverdueCommitments();
      expect(overdue).toHaveLength(2);
      expect(overdue.every((c) => c.dueDate < today())).toBe(true);
    });

    it('deve retornar compromissos dos próximos N dias', () => {
      const upcoming = useCommitmentStore.getState().getUpcomingCommitments(7);
      // Hoje + Amanhã + Em 5 dias = 3
      expect(upcoming).toHaveLength(3);
    });

    it('deve retornar compromissos por data', () => {
      const todayCommitments = useCommitmentStore.getState().getCommitmentsByDate(today());
      expect(todayCommitments).toHaveLength(1);
      expect(todayCommitments[0].title).toBe('Hoje');
    });

    it('deve retornar compromissos pendentes', () => {
      const { toggleComplete, commitments } = useCommitmentStore.getState();

      act(() => {
        toggleComplete(commitments[0].id);
      });

      const pending = useCommitmentStore.getState().getPendingCommitments();
      expect(pending).toHaveLength(5); // 6 - 1 completo
    });

    it('deve retornar compromissos completados', () => {
      const { toggleComplete, commitments } = useCommitmentStore.getState();

      act(() => {
        toggleComplete(commitments[0].id);
        toggleComplete(commitments[1].id);
      });

      const completed = useCommitmentStore.getState().getCompletedCommitments();
      expect(completed).toHaveLength(2);
    });

    it('deve retornar compromissos recorrentes', () => {
      const { addCommitment } = useCommitmentStore.getState();

      act(() => {
        addCommitment({
          type: 'bill',
          title: 'Conta recorrente',
          dueDate: today(),
          recurrence: { type: 'monthly', interval: 1 },
        });
      });

      const recurring = useCommitmentStore.getState().getRecurringCommitments();
      expect(recurring).toHaveLength(1);
    });
  });

  describe('Seleção para Timer', () => {
    it('deve selecionar compromisso', () => {
      const { addCommitment, selectCommitment } = useCommitmentStore.getState();

      let commitmentId: string;
      act(() => {
        const c = addCommitment({ type: 'task', title: 'Tarefa', dueDate: today() });
        commitmentId = c.id;
      });

      act(() => {
        selectCommitment(commitmentId!);
      });

      expect(useCommitmentStore.getState().selectedCommitmentId).toBe(commitmentId!);
    });

    it('deve limpar seleção ao deletar compromisso selecionado', () => {
      const { addCommitment, selectCommitment, deleteCommitment } = useCommitmentStore.getState();

      let commitmentId: string;
      act(() => {
        const c = addCommitment({ type: 'task', title: 'Tarefa', dueDate: today() });
        commitmentId = c.id;
        selectCommitment(commitmentId);
      });

      expect(useCommitmentStore.getState().selectedCommitmentId).toBe(commitmentId!);

      act(() => {
        deleteCommitment(commitmentId!);
      });

      expect(useCommitmentStore.getState().selectedCommitmentId).toBeNull();
    });
  });

  describe('Reset', () => {
    it('deve resetar o store para estado inicial', () => {
      const { addCommitment, selectCommitment } = useCommitmentStore.getState();

      act(() => {
        const c = addCommitment({ type: 'task', title: 'Tarefa', dueDate: today() });
        selectCommitment(c.id);
      });

      expect(useCommitmentStore.getState().commitments).toHaveLength(1);

      act(() => {
        useCommitmentStore.getState().reset();
      });

      expect(useCommitmentStore.getState().commitments).toHaveLength(0);
      expect(useCommitmentStore.getState().selectedCommitmentId).toBeNull();
    });
  });
});
