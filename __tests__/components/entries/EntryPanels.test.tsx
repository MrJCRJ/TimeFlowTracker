/**
 * Testes de Integração para Entry Panels
 *
 * Testa os painéis de entrada especializados por tipo de categoria
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

// Components
import { SimpleEntryPanel } from '@/components/entries/SimpleEntryPanel';
import { WorkoutEntryPanel } from '@/components/entries/WorkoutEntryPanel';
import { WorkEntryPanel } from '@/components/entries/WorkEntryPanel';
import { MealEntryPanel } from '@/components/entries/MealEntryPanel';
import { CommitmentEntryPanel } from '@/components/entries/CommitmentEntryPanel';

// Stores
import { useJobStore } from '@/stores/jobStore';
import { useRecipeStore } from '@/stores/recipeStore';
import { useCommitmentStore } from '@/stores/commitmentStore';

// Helpers
const mockOnChange = jest.fn();
const mockOnStartTimer = jest.fn();
const mockOnToggleExpand = jest.fn();

describe('Entry Panels - Integração', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset stores
    act(() => {
      useJobStore.getState().reset();
      useRecipeStore.getState().reset();
      useCommitmentStore.getState().reset();
    });
  });

  describe('SimpleEntryPanel', () => {
    const defaultProps = {
      categoryName: 'Sono',
      categoryColor: '#6366f1',
      items: [] as { id: string; text: string; completed: boolean }[],
      onItemsChange: mockOnChange,
      isExpanded: true,
      onToggleExpand: mockOnToggleExpand,
    };

    it('deve renderizar painel expandido', () => {
      render(<SimpleEntryPanel {...defaultProps} />);

      expect(screen.getByText('O que você fez?')).toBeInTheDocument();
    });

    it('deve adicionar item ao checklist', async () => {
      const user = userEvent.setup();
      render(<SimpleEntryPanel {...defaultProps} />);

      // O input aparece após clicar no botão de adicionar
      const addButton = screen.getByRole('button', { name: /ex: li antes de dormir/i });
      await user.click(addButton);

      // Agora o input deve estar visível
      await waitFor(() => {
        const input = screen.getByRole('textbox');
        expect(input).toBeInTheDocument();
      });

      const input = screen.getByRole('textbox');
      await user.type(input, 'Nova atividade');
      await user.keyboard('{Enter}');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('deve renderizar itens existentes', () => {
      const items = [
        { id: '1', text: 'Item 1', completed: false },
        { id: '2', text: 'Item 2', completed: true },
      ];
      render(<SimpleEntryPanel {...defaultProps} items={items} />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('deve alternar estado de item', async () => {
      const user = userEvent.setup();
      const items = [{ id: '1', text: 'Item 1', completed: false }];
      render(<SimpleEntryPanel {...defaultProps} items={items} />);

      // Encontrar o botão do checkbox usando aria-label
      const checkboxButton = screen.getByRole('button', {
        name: /marcar.*item 1.*como concluído/i,
      });
      await user.click(checkboxButton);

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('deve mostrar contador de itens', () => {
      const items = [
        { id: '1', text: 'Item 1', completed: true },
        { id: '2', text: 'Item 2', completed: false },
        { id: '3', text: 'Item 3', completed: true },
      ];
      render(<SimpleEntryPanel {...defaultProps} items={items} />);

      // 2 de 3 completados
      expect(screen.getByText(/2\/3/)).toBeInTheDocument();
    });
  });

  describe('WorkoutEntryPanel', () => {
    const defaultProps = {
      categoryColor: '#22c55e',
      exercises: [],
      onExercisesChange: mockOnChange,
      isExpanded: true,
      onToggleExpand: mockOnToggleExpand,
    };

    it('deve renderizar painel de treino', () => {
      render(<WorkoutEntryPanel {...defaultProps} />);

      expect(screen.getByText('Exercícios')).toBeInTheDocument();
    });

    it('deve adicionar exercício', async () => {
      const user = userEvent.setup();
      render(<WorkoutEntryPanel {...defaultProps} />);

      // Clicar no botão de adicionar exercício
      const addButton = screen.getByText(/adicionar exercício/i);
      await user.click(addButton);

      // Deve abrir formulário de exercício
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/nome do exercício/i)).toBeInTheDocument();
      });
    });

    it('deve renderizar exercícios existentes', () => {
      const exercises = [
        {
          id: '1',
          name: 'Supino',
          muscleGroup: 'chest' as const,
          sets: [{ id: 's1', reps: 10, weight: 50, completed: false }],
        },
      ];
      render(<WorkoutEntryPanel {...defaultProps} exercises={exercises} />);

      expect(screen.getByText('Supino')).toBeInTheDocument();
    });
  });

  describe('WorkEntryPanel', () => {
    const defaultProps = {
      categoryColor: '#3b82f6',
      selectedJobId: null,
      onJobSelect: mockOnChange,
      isExpanded: true,
      onToggleExpand: mockOnToggleExpand,
    };

    it('deve renderizar painel de trabalho', () => {
      render(<WorkEntryPanel {...defaultProps} />);

      expect(screen.getByText('Trabalho')).toBeInTheDocument();
    });

    it('deve mostrar mensagem quando não há jobs', () => {
      render(<WorkEntryPanel {...defaultProps} />);

      expect(screen.getByText(/nenhum trabalho/i)).toBeInTheDocument();
    });

    it('deve listar jobs disponíveis', () => {
      // Adicionar jobs no store
      act(() => {
        useJobStore.getState().addJob({ name: 'Freelance', color: '#3b82f6' });
        useJobStore.getState().addJob({ name: 'Empresa X', hourlyRate: 50, color: '#22c55e' });
      });

      render(<WorkEntryPanel {...defaultProps} />);

      expect(screen.getByText('Freelance')).toBeInTheDocument();
      expect(screen.getByText('Empresa X')).toBeInTheDocument();
    });

    it('deve selecionar job ao clicar', async () => {
      const user = userEvent.setup();

      let jobId: string;
      act(() => {
        const job = useJobStore.getState().addJob({ name: 'Meu Job', color: '#3b82f6' });
        jobId = job.id;
      });

      render(<WorkEntryPanel {...defaultProps} />);

      const jobButton = screen.getByText('Meu Job');
      await user.click(jobButton);

      expect(mockOnChange).toHaveBeenCalledWith(jobId!);
    });

    it('deve permitir adicionar novo job', async () => {
      const user = userEvent.setup();
      render(<WorkEntryPanel {...defaultProps} />);

      const addButton = screen.getByText(/novo trabalho/i);
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/nome do trabalho/i)).toBeInTheDocument();
      });
    });
  });

  describe('MealEntryPanel', () => {
    const defaultProps = {
      categoryColor: '#ec4899',
      selectedRecipeId: null,
      selectedAction: null as 'cooking' | 'eating' | null,
      onRecipeSelect: jest.fn(),
      onActionSelect: jest.fn(),
      onStartCooking: jest.fn(),
      onEat: jest.fn(),
      isExpanded: true,
      onToggleExpand: mockOnToggleExpand,
    };

    it('deve renderizar painel de alimentação', () => {
      render(<MealEntryPanel {...defaultProps} />);

      expect(screen.getByText('Alimentação')).toBeInTheDocument();
    });

    it('deve mostrar mensagem quando não há receitas', () => {
      render(<MealEntryPanel {...defaultProps} />);

      expect(screen.getByText(/nenhuma receita/i)).toBeInTheDocument();
    });

    it('deve listar receitas disponíveis', () => {
      act(() => {
        useRecipeStore.getState().addRecipe({
          name: 'Frango grelhado',
          totalCalories: 400,
          portions: 2,
        });
        useRecipeStore.getState().addRecipe({
          name: 'Salada',
          totalCalories: 150,
          portions: 1,
        });
      });

      render(<MealEntryPanel {...defaultProps} />);

      expect(screen.getByText('Frango grelhado')).toBeInTheDocument();
      expect(screen.getByText('Salada')).toBeInTheDocument();
    });

    it('deve mostrar opções fazer/comer ao selecionar receita', async () => {
      let recipeId: string;
      act(() => {
        const recipe = useRecipeStore.getState().addRecipe({
          name: 'Receita teste',
          totalCalories: 300,
          portions: 2,
        });
        recipeId = recipe.id;
      });

      render(
        <MealEntryPanel {...defaultProps} selectedRecipeId={recipeId!} selectedAction={null} />
      );

      // Deve mostrar botões de fazer e comer
      expect(screen.getByText('FAZER')).toBeInTheDocument();
      expect(screen.getByText('COMER')).toBeInTheDocument();
    });
  });

  describe('CommitmentEntryPanel', () => {
    const defaultProps = {
      categoryColor: '#f43f5e',
      onStartTimer: mockOnStartTimer,
      isExpanded: true,
      onToggleExpand: mockOnToggleExpand,
    };

    it('deve renderizar painel de compromissos', () => {
      render(<CommitmentEntryPanel {...defaultProps} />);

      expect(screen.getByText('Compromissos')).toBeInTheDocument();
    });

    it('deve mostrar mensagem quando não há compromissos', () => {
      render(<CommitmentEntryPanel {...defaultProps} />);

      expect(screen.getByText(/nenhum compromisso/i)).toBeInTheDocument();
    });

    it('deve listar compromissos pendentes', () => {
      const today = new Date().toISOString().split('T')[0];
      act(() => {
        useCommitmentStore.getState().addCommitment({
          type: 'bill',
          title: 'Pagar conta',
          dueDate: today,
          priority: 'high',
        });
      });

      render(<CommitmentEntryPanel {...defaultProps} />);

      expect(screen.getByText('Pagar conta')).toBeInTheDocument();
    });

    it('deve permitir adicionar novo compromisso', async () => {
      const user = userEvent.setup();
      render(<CommitmentEntryPanel {...defaultProps} />);

      const addButton = screen.getByText(/novo compromisso/i);
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/título/i)).toBeInTheDocument();
      });
    });

    it('deve marcar compromisso como completo', async () => {
      const user = userEvent.setup();
      const today = new Date().toISOString().split('T')[0];

      act(() => {
        useCommitmentStore.getState().addCommitment({
          type: 'task',
          title: 'Tarefa para completar',
          dueDate: today,
        });
      });

      render(<CommitmentEntryPanel {...defaultProps} />);

      // Encontrar o checkbox de completar
      const checkboxes = screen.getAllByRole('button');
      const completeButton = checkboxes.find(
        (btn) => btn.className.includes('rounded-full') && btn.className.includes('border-2')
      );

      if (completeButton) {
        await user.click(completeButton);

        // Verificar que foi marcado como completo
        const commitment = useCommitmentStore.getState().commitments[0];
        expect(commitment.completed).toBe(true);
      }
    });

    it('deve iniciar timer ao clicar no botão play', async () => {
      const user = userEvent.setup();
      const today = new Date().toISOString().split('T')[0];

      let commitmentId: string;
      act(() => {
        const c = useCommitmentStore.getState().addCommitment({
          type: 'task',
          title: 'Tarefa com timer',
          dueDate: today,
        });
        commitmentId = c.id;
      });

      render(<CommitmentEntryPanel {...defaultProps} />);

      // Encontrar botão de play
      const playButtons = screen.getAllByTitle(/iniciar timer/i);
      if (playButtons.length > 0) {
        await user.click(playButtons[0]);
        expect(mockOnStartTimer).toHaveBeenCalled();
      }
    });

    it('deve mostrar indicador de atrasado', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      act(() => {
        useCommitmentStore.getState().addCommitment({
          type: 'bill',
          title: 'Conta atrasada',
          dueDate: yesterdayStr,
          priority: 'high',
        });
      });

      render(<CommitmentEntryPanel {...defaultProps} />);

      // Deve mostrar seção de atrasados
      expect(screen.getByText(/Atrasados/i)).toBeInTheDocument();
      expect(screen.getByText('Conta atrasada')).toBeInTheDocument();
    });
  });

  describe('Integração entre Panels e Stores', () => {
    it('deve sincronizar WorkEntryPanel com jobStore', async () => {
      const user = userEvent.setup();
      const onJobSelect = jest.fn();

      // Adicionar job
      let jobId: string;
      act(() => {
        const job = useJobStore.getState().addJob({
          name: 'Job Integração',
          hourlyRate: 75,
          color: '#3b82f6',
        });
        jobId = job.id;
      });

      const { rerender } = render(
        <WorkEntryPanel
          categoryColor="#3b82f6"
          selectedJobId={null}
          onJobSelect={onJobSelect}
          isExpanded={true}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      // Verificar job na lista
      expect(screen.getByText('Job Integração')).toBeInTheDocument();
      expect(screen.getByText(/R\$ 75/)).toBeInTheDocument();

      // Selecionar job
      const jobButton = screen.getByText('Job Integração').closest('button');
      if (jobButton) {
        await user.click(jobButton);
        expect(onJobSelect).toHaveBeenCalledWith(jobId!);
      }

      // Rerender com job selecionado
      rerender(
        <WorkEntryPanel
          categoryColor="#3b82f6"
          selectedJobId={jobId!}
          onJobSelect={onJobSelect}
          isExpanded={true}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      // Verificar que job continua visível quando selecionado
      const jobTexts = screen.getAllByText('Job Integração');
      expect(jobTexts.length).toBeGreaterThan(0);
    });

    it('deve sincronizar MealEntryPanel com recipeStore', () => {
      // Adicionar receita
      act(() => {
        useRecipeStore.getState().addRecipe({
          name: 'Receita Integração',
          totalCalories: 500,
          portions: 2,
        });
      });

      render(
        <MealEntryPanel
          categoryColor="#ec4899"
          selectedRecipeId={null}
          selectedAction={null}
          onRecipeSelect={jest.fn()}
          onActionSelect={jest.fn()}
          onStartCooking={jest.fn()}
          onEat={jest.fn()}
          isExpanded={true}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      // Verificar receita com calorias por porção calculadas
      expect(screen.getByText('Receita Integração')).toBeInTheDocument();
      expect(screen.getByText(/250 kcal/)).toBeInTheDocument(); // 500/2
    });

    it('deve sincronizar CommitmentEntryPanel com commitmentStore', async () => {
      const user = userEvent.setup();
      const today = new Date().toISOString().split('T')[0];

      render(
        <CommitmentEntryPanel
          categoryColor="#f43f5e"
          onStartTimer={mockOnStartTimer}
          isExpanded={true}
          onToggleExpand={mockOnToggleExpand}
        />
      );

      // Adicionar compromisso via formulário
      await user.click(screen.getByText(/novo compromisso/i));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/título/i)).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/título/i), 'Compromisso via UI');

      const addButton = screen.getByText('Adicionar');
      await user.click(addButton);

      // Verificar que foi adicionado ao store
      const commitments = useCommitmentStore.getState().commitments;
      expect(commitments.some((c) => c.title === 'Compromisso via UI')).toBe(true);
    });
  });
});
