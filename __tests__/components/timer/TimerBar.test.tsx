/**
 * TDD: TimerBar Component Tests
 *
 * Ciclo TDD:
 * 1. ✅ Escrever testes (RED - devem falhar)
 * 2. ⏳ Implementar componente (GREEN - testes passam)
 * 3. ⏳ Refatorar mantendo testes verdes
 *
 * Comportamentos esperados:
 * - Renderiza corretamente com categorias
 * - Permite selecionar categoria para iniciar timer
 * - Mostra tempo decorrido quando timer ativo
 * - Permite parar timer ativo
 * - Persiste estado no localStorage
 * - Formata tempo corretamente (HH:MM:SS)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimerBar } from '@/components/timer/TimerBar';
import type { Category } from '@/types';

// Mock do useCategoryStore - deve vir antes dos imports que o usam
const mockInitializeDefaults = jest.fn();
jest.mock('@/stores/categoryStore', () => ({
  useCategoryStore: () => ({
    categories: [],
    initializeDefaults: mockInitializeDefaults,
    getCategoryById: jest.fn(),
  }),
}));

// Mock store para testes
const mockStore = {
  isRunning: false,
  activeEntry: null,
  elapsedSeconds: 0,
  startTimer: jest.fn(),
  stopTimer: jest.fn(),
  updateElapsed: jest.fn(),
};

// Mock store ativo para testes de timer ativo
const activeStore = {
  isRunning: true,
  activeEntry: {
    id: 'entry-1',
    categoryId: 'cat-1',
    startTime: new Date().toISOString(),
    endTime: null,
    duration: null,
    userId: 'user-1',
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  elapsedSeconds: 125, // 2:05
  startTimer: jest.fn(),
  stopTimer: jest.fn(),
  updateElapsed: jest.fn(),
};

// Mock das categorias
const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Trabalho',
    color: '#3b82f6',
    icon: 'briefcase',
    isDefault: true,
    userId: 'user-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-2',
    name: 'Estudo',
    color: '#8b5cf6',
    icon: 'book',
    isDefault: true,
    userId: 'user-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-3',
    name: 'Exercício',
    color: '#22c55e',
    icon: 'dumbbell',
    isDefault: true,
    userId: 'user-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

// Mock do useTimerStore
const mockStartTimer = jest.fn();
const mockStopTimer = jest.fn();
const mockUpdateElapsed = jest.fn();

jest.mock('@/stores/timerStore', () => ({
  useTimerStore: jest.fn(() => ({
    isRunning: false,
    activeEntry: null,
    elapsedSeconds: 0,
    startTimer: mockStartTimer,
    stopTimer: mockStopTimer,
    updateElapsed: mockUpdateElapsed,
  })),
}));

describe('TimerBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Renderização inicial', () => {
    it('deve renderizar o componente corretamente', () => {
      render(<TimerBar categories={mockCategories} userId="user-1" store={mockStore} />);

      // Verifica se o componente existe
      expect(screen.getByTestId('timer-bar')).toBeInTheDocument();
    });

    it('deve mostrar texto indicando para selecionar categoria quando timer inativo', () => {
      render(<TimerBar categories={mockCategories} userId="user-1" store={mockStore} />);

      expect(screen.getByText(/selecione uma categoria/i)).toBeInTheDocument();
    });

    it('deve renderizar botões de categorias', () => {
      render(<TimerBar categories={mockCategories} userId="user-1" store={mockStore} />);

      expect(screen.getByText('Trabalho')).toBeInTheDocument();
      expect(screen.getByText('Estudo')).toBeInTheDocument();
      expect(screen.getByText('Exercício')).toBeInTheDocument();
    });

    it('deve mostrar tempo zerado (00:00) quando timer inativo', () => {
      render(<TimerBar categories={mockCategories} userId="user-1" store={mockStore} />);

      expect(screen.getByTestId('timer-display')).toHaveTextContent('00:00');
    });
  });

  describe('Iniciar timer', () => {
    it('deve chamar startTimer quando categoria é clicada', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(<TimerBar categories={mockCategories} userId="user-1" store={mockStore} />);

      const trabalhoButton = screen.getByRole('button', { name: /trabalho/i });
      await user.click(trabalhoButton);

      expect(mockStore.startTimer).toHaveBeenCalledWith('cat-1', 'user-1');
    });

    it('deve mostrar categoria ativa quando timer ativo', () => {
      render(<TimerBar categories={mockCategories} userId="user-1" store={activeStore} />);

      expect(screen.getByText(/registrando: trabalho/i)).toBeInTheDocument();
    });
  });

  describe('Timer ativo', () => {
    beforeEach(() => {
      const useTimerStoreMock = require('@/stores/timerStore').useTimerStore;
      useTimerStoreMock.mockReturnValue({
        isRunning: true,
        activeEntry: {
          id: 'entry-1',
          categoryId: 'cat-1',
          startTime: new Date().toISOString(),
          endTime: null,
          duration: null,
          userId: 'user-1',
          notes: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        elapsedSeconds: 125, // 2:05
        startTimer: mockStartTimer,
        stopTimer: mockStopTimer,
        updateElapsed: mockUpdateElapsed,
      });
    });

    it('deve mostrar mensagem de "Registrando: [categoria]" quando timer ativo', () => {
      render(<TimerBar categories={mockCategories} userId="user-1" store={activeStore} />);

      expect(screen.getByText(/registrando: trabalho/i)).toBeInTheDocument();
    });

    it('deve mostrar tempo decorrido formatado corretamente', () => {
      render(<TimerBar categories={mockCategories} userId="user-1" store={activeStore} />);

      // 125 segundos = 02:05
      expect(screen.getByTestId('timer-display')).toHaveTextContent('02:05');
    });

    it('deve mostrar botão de parar quando timer ativo', () => {
      render(<TimerBar categories={mockCategories} userId="user-1" store={activeStore} />);

      expect(screen.getByRole('button', { name: /parar/i })).toBeInTheDocument();
    });

    it('deve chamar stopTimer quando botão parar é clicado', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(<TimerBar categories={mockCategories} userId="user-1" store={activeStore} />);

      const stopButton = screen.getByRole('button', { name: /parar/i });
      await user.click(stopButton);

      expect(activeStore.stopTimer).toHaveBeenCalled();
    });
  });

  describe('Formatação de tempo', () => {
    it('deve formatar segundos corretamente para MM:SS', () => {
      const useTimerStoreMock = require('@/stores/timerStore').useTimerStore;
      useTimerStoreMock.mockReturnValue({
        isRunning: true,
        activeEntry: { categoryId: 'cat-1' },
        elapsedSeconds: 65, // 1:05
        startTimer: mockStartTimer,
        stopTimer: mockStopTimer,
        updateElapsed: mockUpdateElapsed,
      });

      render(<TimerBar categories={mockCategories} userId="user-1" />);

      expect(screen.getByTestId('timer-display')).toHaveTextContent('01:05');
    });

    it('deve formatar horas corretamente para HH:MM:SS', () => {
      const useTimerStoreMock = require('@/stores/timerStore').useTimerStore;
      useTimerStoreMock.mockReturnValue({
        isRunning: true,
        activeEntry: { categoryId: 'cat-1' },
        elapsedSeconds: 3665, // 1:01:05
        startTimer: mockStartTimer,
        stopTimer: mockStopTimer,
        updateElapsed: mockUpdateElapsed,
      });

      render(<TimerBar categories={mockCategories} userId="user-1" />);

      expect(screen.getByTestId('timer-display')).toHaveTextContent('01:01:05');
    });
  });

  describe('Atualização em tempo real', () => {
    it('deve chamar updateElapsed a cada segundo quando timer ativo', () => {
      const useTimerStoreMock = require('@/stores/timerStore').useTimerStore;
      useTimerStoreMock.mockReturnValue({
        isRunning: true,
        activeEntry: { categoryId: 'cat-1' },
        elapsedSeconds: 0,
        startTimer: mockStartTimer,
        stopTimer: mockStopTimer,
        updateElapsed: mockUpdateElapsed,
      });

      render(<TimerBar categories={mockCategories} userId="user-1" />);

      // Avança 3 segundos
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(mockUpdateElapsed).toHaveBeenCalledTimes(3);
    });

    it('não deve chamar updateElapsed quando timer inativo', () => {
      const useTimerStoreMock = require('@/stores/timerStore').useTimerStore;
      useTimerStoreMock.mockReturnValue({
        isRunning: false,
        activeEntry: null,
        elapsedSeconds: 0,
        startTimer: mockStartTimer,
        stopTimer: mockStopTimer,
        updateElapsed: mockUpdateElapsed,
      });

      render(<TimerBar categories={mockCategories} userId="user-1" />);

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(mockUpdateElapsed).not.toHaveBeenCalled();
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter role apropriado para barra de timer', () => {
      render(<TimerBar categories={mockCategories} userId="user-1" store={mockStore} />);

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('deve ter aria-label descritivo', () => {
      render(<TimerBar categories={mockCategories} userId="user-1" store={mockStore} />);

      expect(screen.getByLabelText(/barra de timer/i)).toBeInTheDocument();
    });

    it('botões de categoria devem ser focáveis por teclado', () => {
      render(<TimerBar categories={mockCategories} userId="user-1" store={mockStore} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });

  describe('Estados de erro', () => {
    it('deve mostrar mensagem quando não há categorias', () => {
      render(<TimerBar categories={[]} userId="user-1" store={mockStore} />);

      expect(screen.getByText(/nenhuma categoria disponível/i)).toBeInTheDocument();
    });
  });

  describe('Estados de loading', () => {
    it('deve mostrar LoadingState quando está carregando', () => {
      render(<TimerBar categories={[]} userId="user-1" store={mockStore} isLoading={true} />);

      // Verifica se o LoadingState está sendo renderizado
      expect(screen.getByTestId('timer-bar')).toBeInTheDocument();

      // Verifica se não mostra a mensagem de "nenhuma categoria"
      expect(screen.queryByText(/nenhuma categoria disponível/i)).not.toBeInTheDocument();
    });

    it('deve mostrar categorias quando não está carregando', () => {
      render(
        <TimerBar categories={mockCategories} userId="user-1" store={mockStore} isLoading={false} />
      );

      // Verifica se as categorias são mostradas
      expect(screen.getByText('Trabalho')).toBeInTheDocument();
      expect(screen.getByText('Estudo')).toBeInTheDocument();
    });
  });
});
