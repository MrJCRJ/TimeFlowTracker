'use client';

import React, { useEffect, useMemo } from 'react';
import { useCategoryStore } from '@/stores/categoryStore';
import { useTimerStore } from '@/stores/timerStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimeChart } from '@/components/analytics/TimeChart';
import { formatDuration, formatTime, isToday, isThisWeek } from '@/lib/utils';
import { Clock, Target, TrendingUp, Zap } from 'lucide-react';
import type { CategoryTimeBreakdown } from '@/types';

export default function DashboardPage() {
  const { categories, initializeDefaults } = useCategoryStore();
  const { timeEntries, isRunning, elapsedSeconds, activeEntry } = useTimerStore();

  // Initialize default categories on first load
  useEffect(() => {
    // This would normally use the user ID from session
    initializeDefaults('user-1');
  }, [initializeDefaults]);

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Acompanhe seu tempo e produtividade</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Today Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(todayStats.totalSeconds)}</div>
            <p className="text-xs text-muted-foreground">{todayStats.entriesCount} registros</p>
          </CardContent>
        </Card>

        {/* Week Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(weekStats.totalSeconds)}</div>
            <p className="text-xs text-muted-foreground">{weekStats.entriesCount} registros</p>
          </CardContent>
        </Card>

        {/* Top Category */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categoria Top</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {topCategory ? (
                <>
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: topCategory.categoryColor }}
                  />
                  <span className="truncate text-2xl font-bold">{topCategory.categoryName}</span>
                </>
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">-</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {topCategory ? formatDuration(topCategory.totalSeconds) : 'Nenhum registro'}
            </p>
          </CardContent>
        </Card>

        {/* Daily Goal */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta Diária</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((todayStats.totalSeconds / (8 * 3600)) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">de 8 horas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
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
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Timer Ativo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <p className="text-lg font-medium">
                    {categories.find((c) => c.id === activeEntry.categoryId)?.name ??
                      'Desconhecida'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Decorrido</p>
                  <p className="font-mono text-4xl font-bold text-primary">
                    {formatTime(elapsedSeconds)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Iniciado em</p>
                  <p className="text-sm">
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
