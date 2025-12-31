'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, Flame, Target, TrendingUp } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import type { TimeEntry } from '@/types';

interface WorkoutAnalyticsProps {
  filteredEntries: TimeEntry[];
  periodLabel: string;
  className?: string;
}

interface ExerciseStats {
  name: string;
  sessions: number;
  totalSets: number;
  totalReps: number;
}

/**
 * Componente de analytics para a categoria Treino
 * Mostra exercícios realizados, tempo de treino, etc.
 */
export function WorkoutAnalytics({
  filteredEntries,
  periodLabel,
  className,
}: WorkoutAnalyticsProps) {
  // Filtrar apenas entradas de treino
  const workoutEntries = useMemo(() => {
    return filteredEntries.filter((entry) => entry.categoryId === 'workout');
  }, [filteredEntries]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    let totalSeconds = 0;
    const totalSessions = workoutEntries.length;
    const exerciseMap = new Map<string, ExerciseStats>();

    workoutEntries.forEach((entry) => {
      totalSeconds += entry.duration || 0;

      // Tentar extrair exercícios dos metadados
      const exercises = entry.metadata?.exercises as
        | Array<{ name: string; sets: number; reps: number }>
        | undefined;

      if (exercises) {
        exercises.forEach((exercise) => {
          const existing = exerciseMap.get(exercise.name) || {
            name: exercise.name,
            sessions: 0,
            totalSets: 0,
            totalReps: 0,
          };
          existing.sessions += 1;
          existing.totalSets += exercise.sets || 0;
          existing.totalReps += (exercise.sets || 0) * (exercise.reps || 0);
          exerciseMap.set(exercise.name, existing);
        });
      }
    });

    const exerciseStats = Array.from(exerciseMap.values()).sort(
      (a, b) => b.totalSets - a.totalSets
    );

    return {
      totalSeconds,
      totalSessions,
      avgSessionDuration: totalSessions > 0 ? totalSeconds / totalSessions : 0,
      exerciseStats,
      totalExercises: exerciseStats.length,
    };
  }, [workoutEntries]);

  if (workoutEntries.length === 0) {
    return null;
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Dumbbell className="h-5 w-5 text-green-500" />
          Treino - {periodLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cards de resumo */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <Target className="mx-auto mb-1 h-5 w-5 text-green-500" />
            <p className="text-lg font-bold">{stats.totalSessions}</p>
            <p className="text-xs text-muted-foreground">Treinos</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <Flame className="mx-auto mb-1 h-5 w-5 text-orange-500" />
            <p className="text-lg font-bold">{formatDuration(stats.totalSeconds)}</p>
            <p className="text-xs text-muted-foreground">Tempo Total</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <TrendingUp className="mx-auto mb-1 h-5 w-5 text-blue-500" />
            <p className="text-lg font-bold">
              {formatDuration(Math.round(stats.avgSessionDuration))}
            </p>
            <p className="text-xs text-muted-foreground">Média/Treino</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <Dumbbell className="mx-auto mb-1 h-5 w-5 text-purple-500" />
            <p className="text-lg font-bold">{stats.totalExercises}</p>
            <p className="text-xs text-muted-foreground">Exercícios</p>
          </div>
        </div>

        {/* Lista de exercícios mais realizados */}
        {stats.exerciseStats.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Exercícios Mais Realizados
            </h4>
            <div className="space-y-2">
              {stats.exerciseStats.slice(0, 5).map((exercise, index) => (
                <div
                  key={exercise.name}
                  className="flex items-center justify-between rounded-lg bg-muted/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600 dark:bg-green-900/30">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{exercise.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {exercise.sessions} sessão{exercise.sessions !== 1 ? 'ões' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{exercise.totalSets} séries</p>
                    <p className="text-xs text-muted-foreground">{exercise.totalReps} reps</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensagem se não há dados detalhados */}
        {stats.exerciseStats.length === 0 && stats.totalSessions > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Registre exercícios durante o treino para ver estatísticas detalhadas
          </p>
        )}
      </CardContent>
    </Card>
  );
}
