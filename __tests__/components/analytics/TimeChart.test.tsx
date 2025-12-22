/**
 * TDD: TimeChart Component Tests
 *
 * Comportamentos esperados:
 * - Renderiza gráfico de pizza com distribuição por categoria
 * - Renderiza gráfico de barras para tendência
 * - Mostra totais por categoria
 * - Suporta diferentes períodos (dia, semana, mês)
 * - Mostra estado vazio quando não há dados
 * - Formata tempo corretamente
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeChart } from '@/components/analytics/TimeChart';
import type { CategoryTimeBreakdown } from '@/types';

// Mock data
const mockBreakdown: CategoryTimeBreakdown[] = [
  {
    categoryId: 'cat-1',
    categoryName: 'Trabalho',
    categoryColor: '#3b82f6',
    totalSeconds: 14400, // 4 horas
    percentage: 50,
  },
  {
    categoryId: 'cat-2',
    categoryName: 'Estudo',
    categoryColor: '#8b5cf6',
    totalSeconds: 7200, // 2 horas
    percentage: 25,
  },
  {
    categoryId: 'cat-3',
    categoryName: 'Exercício',
    categoryColor: '#22c55e',
    totalSeconds: 3600, // 1 hora
    percentage: 12.5,
  },
  {
    categoryId: 'cat-4',
    categoryName: 'Lazer',
    categoryColor: '#f59e0b',
    totalSeconds: 3600, // 1 hora
    percentage: 12.5,
  },
];

// Mock do recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('TimeChart', () => {
  describe('Renderização básica', () => {
    it('deve renderizar o componente corretamente', () => {
      render(<TimeChart data={mockBreakdown} totalSeconds={28800} chartType="pie" />);

      expect(screen.getByTestId('time-chart')).toBeInTheDocument();
    });

    it('deve renderizar gráfico de pizza quando chartType é "pie"', () => {
      render(<TimeChart data={mockBreakdown} totalSeconds={28800} chartType="pie" />);

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('deve renderizar gráfico de barras quando chartType é "bar"', () => {
      render(<TimeChart data={mockBreakdown} totalSeconds={28800} chartType="bar" />);

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('deve mostrar título quando fornecido', () => {
      render(
        <TimeChart
          data={mockBreakdown}
          totalSeconds={28800}
          chartType="pie"
          title="Distribuição de Tempo"
        />
      );

      expect(screen.getByText('Distribuição de Tempo')).toBeInTheDocument();
    });
  });

  describe('Estado vazio', () => {
    it('deve mostrar mensagem quando não há dados', () => {
      render(<TimeChart data={[]} totalSeconds={0} chartType="pie" />);

      expect(screen.getByText(/nenhum dado disponível/i)).toBeInTheDocument();
    });

    it('deve mostrar ícone de estado vazio', () => {
      render(<TimeChart data={[]} totalSeconds={0} chartType="pie" />);

      expect(screen.getByTestId('empty-state-icon')).toBeInTheDocument();
    });
  });

  describe('Legenda', () => {
    it('deve mostrar legenda com nomes das categorias', () => {
      render(<TimeChart data={mockBreakdown} totalSeconds={28800} chartType="pie" showLegend />);

      // Verifica que o componente contém os nomes das categorias
      const chart = screen.getByTestId('time-chart');
      expect(chart).toHaveTextContent('Trabalho');
      expect(chart).toHaveTextContent('Estudo');
      expect(chart).toHaveTextContent('Exercício');
      expect(chart).toHaveTextContent('Lazer');
    });

    it('deve mostrar tempo formatado na legenda', () => {
      render(<TimeChart data={mockBreakdown} totalSeconds={28800} chartType="pie" showLegend />);

      // Verifica que o componente contém os tempos formatados
      const chart = screen.getByTestId('time-chart');
      expect(chart).toHaveTextContent('4h');
      expect(chart).toHaveTextContent('2h');
      expect(chart).toHaveTextContent('1h');
    });

    it('deve mostrar porcentagens na legenda', () => {
      render(<TimeChart data={mockBreakdown} totalSeconds={28800} chartType="pie" showLegend />);

      // Verifica que o componente contém as porcentagens
      const chart = screen.getByTestId('time-chart');
      expect(chart).toHaveTextContent('50%');
      expect(chart).toHaveTextContent('25%');
      expect(chart).toHaveTextContent('12.5%');
    });
  });

  describe('Total', () => {
    it('deve mostrar tempo total quando showTotal é true', () => {
      render(<TimeChart data={mockBreakdown} totalSeconds={28800} chartType="pie" showTotal />);

      // 8 horas total
      expect(screen.getByText(/8h/)).toBeInTheDocument();
    });

    it('deve mostrar label "Total" junto ao tempo', () => {
      render(<TimeChart data={mockBreakdown} totalSeconds={28800} chartType="pie" showTotal />);

      expect(screen.getByText(/total/i)).toBeInTheDocument();
    });
  });

  describe('Interatividade', () => {
    it('deve permitir alternar tipo de gráfico quando showToggle é true', async () => {
      const user = userEvent.setup();

      render(<TimeChart data={mockBreakdown} totalSeconds={28800} chartType="pie" showToggle />);

      // Verifica que começa com pie
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();

      // Clica no toggle para bar
      const toggleButton = screen.getByRole('button', { name: /barras/i });
      await user.click(toggleButton);

      // Verifica mudança para bar
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  describe('Responsividade', () => {
    it('deve usar ResponsiveContainer para responsividade', () => {
      render(<TimeChart data={mockBreakdown} totalSeconds={28800} chartType="pie" />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter role e aria-label apropriados', () => {
      render(
        <TimeChart data={mockBreakdown} totalSeconds={28800} chartType="pie" title="Meu Gráfico" />
      );

      expect(screen.getByRole('figure')).toBeInTheDocument();
      expect(screen.getByLabelText(/meu gráfico/i)).toBeInTheDocument();
    });

    it('deve ter descrição para leitores de tela', () => {
      render(<TimeChart data={mockBreakdown} totalSeconds={28800} chartType="pie" />);

      // Deve ter texto descritivo sobre os dados
      expect(screen.getByText(/trabalho: 4h \(50%\)/i)).toBeInTheDocument();
    });
  });

  describe('Formatação', () => {
    it('deve formatar minutos corretamente', () => {
      const shortData: CategoryTimeBreakdown[] = [
        {
          categoryId: 'cat-1',
          categoryName: 'Rápido',
          categoryColor: '#3b82f6',
          totalSeconds: 1800, // 30 minutos
          percentage: 100,
        },
      ];

      render(<TimeChart data={shortData} totalSeconds={1800} chartType="pie" showLegend />);

      // Verifica que o total mostra 30m
      expect(screen.getByTestId('time-chart')).toHaveTextContent('30m');
    });

    it('deve formatar horas e minutos corretamente', () => {
      const mixedData: CategoryTimeBreakdown[] = [
        {
          categoryId: 'cat-1',
          categoryName: 'Misto',
          categoryColor: '#3b82f6',
          totalSeconds: 5400, // 1h 30m
          percentage: 100,
        },
      ];

      render(<TimeChart data={mixedData} totalSeconds={5400} chartType="pie" showLegend />);

      // Verifica que o total mostra 1h 30m
      expect(screen.getByTestId('time-chart')).toHaveTextContent('1h 30m');
    });
  });
});
