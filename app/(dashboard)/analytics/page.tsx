'use client';

import React, { useState, useMemo } from 'react';
import { useCategoryStore } from '@/stores/categoryStore';
import { useTimerStore } from '@/stores/timerStore';
import { TimeChart } from '@/components/analytics/TimeChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDuration, isToday, isThisWeek, isThisMonth } from '@/lib/utils';
import { Calendar, Clock, TrendingUp } from 'lucide-react';
import type { CategoryTimeBreakdown, TimeEntry } from '@/types';

type TimePeriod = 'today' | 'week' | 'month' | 'custom';

export default function AnalyticsPage() {
  const { categories } = useCategoryStore();
  const { timeEntries } = useTimerStore();

  const [period, setPeriod] = useState<TimePeriod>('week');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Filter entries based on period
  const filteredEntries = useMemo(() => {
    return timeEntries.filter((entry: TimeEntry) => {
      switch (period) {
        case 'today':
          return isToday(entry.startTime);
        case 'week':
          return isThisWeek(entry.startTime);
        case 'month':
          return isThisMonth(entry.startTime);
        case 'custom':
          if (!customStartDate || !customEndDate) return false;
          const entryDate = new Date(entry.startTime);
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          return entryDate >= start && entryDate <= end;
        default:
          return true;
      }
    });
  }, [timeEntries, period, customStartDate, customEndDate]);

  // Calculate category breakdown
  const categoryBreakdown = useMemo((): CategoryTimeBreakdown[] => {
    const categoryTotals = new Map<string, number>();

    filteredEntries.forEach((entry: TimeEntry) => {
      const current = categoryTotals.get(entry.categoryId) ?? 0;
      categoryTotals.set(entry.categoryId, current + (entry.duration ?? 0));
    });

    const totalSeconds = Array.from(categoryTotals.values()).reduce(
      (a: number, b: number) => a + b,
      0
    );

    return categories
      .filter((cat) => categoryTotals.has(cat.id))
      .map((cat) => {
        const seconds = categoryTotals.get(cat.id) ?? 0;
        return {
          categoryId: cat.id,
          categoryName: cat.name,
          categoryColor: cat.color,
          totalSeconds: seconds,
          percentage: totalSeconds > 0 ? Math.round((seconds / totalSeconds) * 100) : 0,
        };
      })
      .sort((a, b) => b.totalSeconds - a.totalSeconds);
  }, [filteredEntries, categories]);

  // Calculate daily breakdown for bar chart
  const dailyBreakdown = useMemo(() => {
    const dailyTotals = new Map<string, Map<string, number>>();

    filteredEntries.forEach((entry: TimeEntry) => {
      const date = new Date(entry.startTime).toLocaleDateString('pt-BR');

      if (!dailyTotals.has(date)) {
        dailyTotals.set(date, new Map());
      }

      const dayMap = dailyTotals.get(date)!;
      const current = dayMap.get(entry.categoryId) ?? 0;
      dayMap.set(entry.categoryId, current + (entry.duration ?? 0));
    });

    return Array.from(dailyTotals.entries())
      .map(([date, categoryMap]) => {
        const result: Record<string, string | number> = { date };
        categoryMap.forEach((seconds, categoryId) => {
          const category = categories.find((c) => c.id === categoryId);
          if (category) {
            result[category.name] = Math.round(seconds / 60); // Convert to minutes
          }
        });
        return result;
      })
      .sort((a, b) => {
        const dateA = (a.date as string).split('/').reverse().join('-');
        const dateB = (b.date as string).split('/').reverse().join('-');
        return dateA.localeCompare(dateB);
      });
  }, [filteredEntries, categories]);

  // Total time
  const totalSeconds = useMemo(() => {
    return categoryBreakdown.reduce((acc, cat) => acc + cat.totalSeconds, 0);
  }, [categoryBreakdown]);

  // Average per day
  const averagePerDay = useMemo(() => {
    if (dailyBreakdown.length === 0) return 0;
    return totalSeconds / dailyBreakdown.length;
  }, [totalSeconds, dailyBreakdown.length]);

  // Period label
  const periodLabel = useMemo(() => {
    switch (period) {
      case 'today':
        return 'Hoje';
      case 'week':
        return 'Esta Semana';
      case 'month':
        return 'Este Mês';
      case 'custom':
        if (customStartDate && customEndDate) {
          return `${new Date(customStartDate).toLocaleDateString('pt-BR')} - ${new Date(customEndDate).toLocaleDateString('pt-BR')}`;
        }
        return 'Período Personalizado';
      default:
        return '';
    }
  }, [period, customStartDate, customEndDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Análise</h1>
          <p className="mt-1 text-muted-foreground">Visualize seu uso do tempo</p>
        </div>

        {/* Period Selector */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={period === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('today')}
          >
            Hoje
          </Button>
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('week')}
          >
            Semana
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('month')}
          >
            Mês
          </Button>
          <Button
            variant={period === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('custom')}
          >
            <Calendar className="mr-1 h-4 w-4" />
            Personalizado
          </Button>
        </div>
      </div>

      {/* Custom Date Range */}
      {period === 'custom' && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label htmlFor="startDate" className="mb-1 block text-sm font-medium">
                  Data Inicial
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="rounded-md border bg-background px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="mb-1 block text-sm font-medium">
                  Data Final
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="rounded-md border bg-background px-3 py-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tempo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{formatDuration(totalSeconds)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{periodLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Média Diária</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {formatDuration(Math.round(averagePerDay))}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {dailyBreakdown.length} dias com registros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categorias Usadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{categoryBreakdown.length}</span>
              <span className="text-muted-foreground">de {categories.length}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {filteredEntries.length} registros totais
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {filteredEntries.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pie Chart */}
          <TimeChart
            data={categoryBreakdown}
            totalSeconds={totalSeconds}
            chartType="pie"
            title={`Distribuição - ${periodLabel}`}
            showLegend
            showTotal
          />

          {/* Bar Chart */}
          <TimeChart
            data={categoryBreakdown}
            totalSeconds={totalSeconds}
            chartType="bar"
            title={`Por Categoria - ${periodLabel}`}
            showLegend={false}
            showTotal={false}
          />
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Clock className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
            <h3 className="mb-2 text-xl font-medium">Nenhum dado para este período</h3>
            <p className="mx-auto max-w-md text-muted-foreground">
              {period === 'custom' && (!customStartDate || !customEndDate)
                ? 'Selecione as datas inicial e final para visualizar os dados.'
                : 'Comece a rastrear seu tempo para ver as análises aqui.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detailed Category List */}
      {categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryBreakdown.map((item, index) => (
                <div key={item.categoryId}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-lg font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.categoryColor }}
                      />
                      <span className="font-medium">{item.categoryName}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">{formatDuration(item.totalSeconds)}</span>
                      <span className="ml-2 text-muted-foreground">({item.percentage}%)</span>
                    </div>
                  </div>
                  <div className="ml-9 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.categoryColor,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
