'use client';

import React, { useMemo } from 'react';
import { useCategoryStore } from '@/stores/categoryStore';
import { useTimerStore } from '@/stores/timerStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimeChart } from '@/components/analytics/TimeChart';
import { formatDuration, formatTime, isToday, isThisWeek } from '@/lib/utils';
import { Clock, Target, TrendingUp, Zap } from 'lucide-react';
import type { CategoryTimeBreakdown } from '@/types';

export default function DashboardPage() {
  const { categories } = useCategoryStore();
  const { timeEntries, isRunning, elapsedSeconds, activeEntry } = useTimerStore();

  // Calculate today's stats
  const todayStats = useMemo(() => {
    const todayEntries = timeEntries.filter((entry) => isToday(entry.startTime));
    const totalSeconds = todayEntries.reduce((acc, entry) => acc + (entry.duration ?? 0), 0);

    // Add active timer if running
    const activeSeconds = isRunning ? elapsedSeconds : 0;

    return {
      totalSeconds: totalSeconds + activeSeconds,
      entriesCount: todayEntries.length + (isRunning ? 1 : 0),
    };
  }, [timeEntries, isRunning, elapsedSeconds]);

  // Calculate week stats
  const weekStats = useMemo(() => {
    const weekEntries = timeEntries.filter((entry) => isThisWeek(entry.startTime));
    const totalSeconds = weekEntries.reduce((acc, entry) => acc + (entry.duration ?? 0), 0);
    return { totalSeconds, entriesCount: weekEntries.length };
  }, [timeEntries]);

  // Calculate category breakdown for today
  const todayBreakdown = useMemo((): CategoryTimeBreakdown[] => {
    const todayEntries = timeEntries.filter((entry) => isToday(entry.startTime));
    const categoryTotals = new Map<string, number>();

    todayEntries.forEach((entry) => {
      const current = categoryTotals.get(entry.categoryId) ?? 0;
      categoryTotals.set(entry.categoryId, current + (entry.duration ?? 0));
    });

    // Add active timer
    if (isRunning && activeEntry) {
      const current = categoryTotals.get(activeEntry.categoryId) ?? 0;
      categoryTotals.set(activeEntry.categoryId, current + elapsedSeconds);
    }

    const totalSeconds = Array.from(categoryTotals.values()).reduce((a, b) => a + b, 0);

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
  }, [timeEntries, categories, isRunning, activeEntry, elapsedSeconds]);

  // Get top category
  const topCategory = todayBreakdown[0];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Acompanhe seu tempo e produtividade
        </p>
      </div>

      {/* Stats Cards - 2x2 grid no mobile */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Today Total */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">Hoje</CardTitle>
            <Clock className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold sm:text-2xl">
              {formatDuration(todayStats.totalSeconds)}
            </div>
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              {todayStats.entriesCount} registros
            </p>
          </CardContent>
        </Card>

        {/* Week Total */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">Esta Semana</CardTitle>
            <TrendingUp className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold sm:text-2xl">
              {formatDuration(weekStats.totalSeconds)}
            </div>
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              {weekStats.entriesCount} registros
            </p>
          </CardContent>
        </Card>

        {/* Top Category */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">Top</CardTitle>
            <Zap className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-1 sm:gap-2">
              {topCategory ? (
                <>
                  <div
                    className="h-2 w-2 flex-shrink-0 rounded-full sm:h-3 sm:w-3"
                    style={{ backgroundColor: topCategory.categoryColor }}
                  />
                  <span className="truncate text-base font-bold sm:text-2xl">
                    {topCategory.categoryName}
                  </span>
                </>
              ) : (
                <span className="text-base font-bold text-muted-foreground sm:text-2xl">-</span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              {topCategory ? formatDuration(topCategory.totalSeconds) : 'Sem dados'}
            </p>
          </CardContent>
        </Card>

        {/* Daily Goal */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">Meta</CardTitle>
            <Target className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold sm:text-2xl">
              {Math.round((todayStats.totalSeconds / (8 * 3600)) * 100)}%
            </div>
            <p className="text-[10px] text-muted-foreground sm:text-xs">de 8 horas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Stack no mobile */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Today Distribution */}
        <TimeChart
          data={todayBreakdown}
          totalSeconds={todayStats.totalSeconds}
          chartType="pie"
          title="Distribuição de Hoje"
          showLegend
          showTotal
        />

        {/* Active Timer Card */}
        {isRunning && activeEntry && (
          <Card className="timer-glow border-primary/50 bg-primary/5">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Timer Ativo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Categoria</p>
                  <p className="text-base font-medium sm:text-lg">
                    {categories.find((c) => c.id === activeEntry.categoryId)?.name ??
                      'Desconhecida'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Tempo Decorrido</p>
                  <p className="timer-display-mobile text-primary sm:text-4xl">
                    {formatTime(elapsedSeconds)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">Iniciado em</p>
                  <p className="text-xs sm:text-sm">
                    {new Date(activeEntry.startTime).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Entries */}
        {!isRunning && (
          <Card>
            <CardHeader>
              <CardTitle>Últimos Registros</CardTitle>
            </CardHeader>
            <CardContent>
              {timeEntries.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Clock className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>Nenhum registro ainda</p>
                  <p className="text-sm">Clique em uma categoria para começar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {timeEntries
                    .slice(-5)
                    .reverse()
                    .map((entry) => {
                      const category = categories.find((c) => c.id === entry.categoryId);
                      return (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: category?.color ?? '#6b7280' }}
                            />
                            <div>
                              <p className="font-medium">{category?.name ?? 'Desconhecida'}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(entry.startTime).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <span className="font-mono text-sm">
                            {formatDuration(entry.duration ?? 0)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
