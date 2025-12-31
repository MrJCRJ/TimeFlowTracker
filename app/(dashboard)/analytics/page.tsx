'use client';

import React, { useState, useMemo } from 'react';
import { useCategoryStore } from '@/stores/categoryStore';
import { useTimerStore } from '@/stores/timerStore';
import { TimeChart } from '@/components/analytics/TimeChart';
import { PeriodSelector, TimePeriod } from '@/components/analytics/PeriodSelector';
import { AnalyticsSummaryCards } from '@/components/analytics/AnalyticsSummaryCards';
import { CategoryBreakdownList } from '@/components/analytics/CategoryBreakdownList';
import { WorkAnalytics } from '@/components/analytics/WorkAnalytics';
import { MealAnalytics } from '@/components/analytics/MealAnalytics';
import { CommitmentAnalytics } from '@/components/analytics/CommitmentAnalytics';
import { WorkoutAnalytics } from '@/components/analytics/WorkoutAnalytics';
import { Card, CardContent } from '@/components/ui/card';
import { isToday, isThisWeek, isThisMonth } from '@/lib/utils';
import { Clock } from 'lucide-react';
import type { CategoryTimeBreakdown, TimeEntry } from '@/types';

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Análise</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Visualize seu uso do tempo
          </p>
        </div>
      </div>

      {/* Period Selector */}
      <PeriodSelector
        period={period}
        onPeriodChange={setPeriod}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomStartDateChange={setCustomStartDate}
        onCustomEndDateChange={setCustomEndDate}
      />

      {/* Summary Cards */}
      <AnalyticsSummaryCards
        totalSeconds={totalSeconds}
        averagePerDay={averagePerDay}
        daysWithRecords={dailyBreakdown.length}
        categoriesUsed={categoryBreakdown.length}
        totalCategories={categories.length}
        totalEntries={filteredEntries.length}
        periodLabel={periodLabel}
      />

      {/* Charts */}
      {filteredEntries.length > 0 ? (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
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
          <CardContent className="py-12 text-center sm:py-16">
            <Clock
              className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50 sm:h-16 sm:w-16"
              aria-hidden="true"
            />
            <h3 className="mb-2 text-lg font-medium sm:text-xl">Nenhum dado para este período</h3>
            <p className="mx-auto max-w-md text-sm text-muted-foreground sm:text-base">
              {period === 'custom' && (!customStartDate || !customEndDate)
                ? 'Selecione as datas inicial e final para visualizar os dados.'
                : 'Comece a rastrear seu tempo para ver as análises aqui.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detailed Category List */}
      <CategoryBreakdownList breakdown={categoryBreakdown} />

      {/* Specialized Analytics */}
      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-lg font-semibold sm:text-xl">Análises Detalhadas</h2>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Trabalho */}
          <WorkAnalytics filteredEntries={filteredEntries} periodLabel={periodLabel} />

          {/* Treino */}
          <WorkoutAnalytics filteredEntries={filteredEntries} periodLabel={periodLabel} />

          {/* Alimentação */}
          <MealAnalytics periodLabel={periodLabel} />

          {/* Compromissos */}
          <CommitmentAnalytics periodLabel={periodLabel} />
        </div>
      </div>
    </div>
  );
}
