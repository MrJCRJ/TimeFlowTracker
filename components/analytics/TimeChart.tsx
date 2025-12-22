'use client';

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { cn, formatDuration } from '@/lib/utils';
import { BarChart3, PieChart as PieChartIcon, Clock } from 'lucide-react';
import type { CategoryTimeBreakdown } from '@/types';

type ChartType = 'pie' | 'bar';

interface TimeChartProps {
  data: CategoryTimeBreakdown[];
  totalSeconds: number;
  chartType?: ChartType;
  title?: string;
  showLegend?: boolean;
  showTotal?: boolean;
  showToggle?: boolean;
  className?: string;
}

/**
 * TimeChart - Componente de gráficos para análise de tempo
 *
 * Funcionalidades:
 * - Gráfico de pizza para distribuição
 * - Gráfico de barras para comparação
 * - Legenda com tempo e porcentagem
 * - Toggle entre tipos de gráfico
 * - Estado vazio
 */
export function TimeChart({
  data,
  totalSeconds,
  chartType: initialChartType = 'pie',
  title,
  showLegend = true,
  showTotal = true,
  showToggle = false,
  className,
}: TimeChartProps) {
  const [chartType, setChartType] = useState<ChartType>(initialChartType);

  // Prepara dados para o gráfico
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        name: item.categoryName,
        value: item.totalSeconds,
        color: item.categoryColor,
        percentage: item.percentage,
        formattedTime: formatDuration(item.totalSeconds),
      })),
    [data]
  );

  // Estado vazio
  if (data.length === 0 || totalSeconds === 0) {
    return (
      <div
        data-testid="time-chart"
        role="figure"
        aria-label={title ?? 'Gráfico de tempo'}
        className={cn(
          'flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-border bg-card p-8',
          className
        )}
      >
        <Clock data-testid="empty-state-icon" className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Nenhum dado disponível</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Comece a registrar tempo para ver estatísticas
        </p>
      </div>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: { name: string; formattedTime: string; percentage: number } }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border border-border bg-popover p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.formattedTime} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      data-testid="time-chart"
      role="figure"
      aria-label={title ?? 'Gráfico de tempo'}
      className={cn('rounded-lg border border-border bg-card p-4', className)}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        {title && <h3 className="text-lg font-semibold">{title}</h3>}

        {showToggle && (
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            <button
              onClick={() => setChartType('pie')}
              aria-label="Gráfico de pizza"
              className={cn(
                'flex items-center gap-1 rounded px-3 py-1.5 text-sm transition-colors',
                chartType === 'pie'
                  ? 'bg-background text-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <PieChartIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Pizza</span>
            </button>
            <button
              onClick={() => setChartType('bar')}
              aria-label="Gráfico de barras"
              className={cn(
                'flex items-center gap-1 rounded px-3 py-1.5 text-sm transition-colors',
                chartType === 'bar'
                  ? 'bg-background text-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Barras</span>
            </button>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          ) : (
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tickFormatter={(value) => formatDuration(value)} />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Total */}
      {showTotal && (
        <div className="mt-4 flex items-center justify-center gap-2 border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">Total:</span>
          <span className="text-xl font-bold">{formatDuration(totalSeconds)}</span>
        </div>
      )}

      {/* Legenda customizada */}
      {showLegend && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="grid grid-cols-2 gap-2">
            {data.map((item) => (
              <div key={item.categoryId} className="flex items-center gap-2 text-sm">
                <div
                  className="h-3 w-3 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: item.categoryColor }}
                />
                <span className="truncate">{item.categoryName}:</span>
                <span className="text-muted-foreground">
                  {formatDuration(item.totalSeconds)} ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Screen reader description */}
      <div className="sr-only">
        {data.map((item) => (
          <span key={item.categoryId}>
            {item.categoryName}: {formatDuration(item.totalSeconds)} ({item.percentage}%).{' '}
          </span>
        ))}
      </div>
    </div>
  );
}

export default TimeChart;
