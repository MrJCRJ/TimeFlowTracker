'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCommitmentStore } from '@/stores/commitmentStore';
import { Calendar, CheckCircle2, AlertCircle, Clock, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CommitmentType } from '@/types/entries/commitment';
import { COMMITMENT_TYPE_LABELS } from '@/types/entries/commitment';

interface CommitmentAnalyticsProps {
  periodLabel: string;
  className?: string;
}

interface TypeStats {
  type: CommitmentType;
  label: string;
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}

/**
 * Componente de analytics para a categoria Compromissos
 * Mostra compromissos por tipo, taxa de conclusão, atrasados, etc.
 */
export function CommitmentAnalytics({ periodLabel, className }: CommitmentAnalyticsProps) {
  const { commitments, getOverdueCommitments, getCompletedCommitments, getPendingCommitments } =
    useCommitmentStore();

  // Estatísticas por tipo
  const typeStats = useMemo((): TypeStats[] => {
    const statsMap = new Map<CommitmentType, TypeStats>();
    const types: CommitmentType[] = ['task', 'bill', 'appointment', 'financial', 'event'];

    types.forEach((type) => {
      statsMap.set(type, {
        type,
        label: COMMITMENT_TYPE_LABELS[type],
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
      });
    });

    const today = new Date().toISOString().split('T')[0];

    commitments.forEach((commitment) => {
      const stats = statsMap.get(commitment.type);
      if (stats) {
        stats.total += 1;
        if (commitment.completed) {
          stats.completed += 1;
        } else {
          stats.pending += 1;
          if (commitment.dueDate < today) {
            stats.overdue += 1;
          }
        }
      }
    });

    return Array.from(statsMap.values()).filter((stats) => stats.total > 0);
  }, [commitments]);

  // Totais gerais
  const totals = useMemo(() => {
    const overdue = getOverdueCommitments();
    const completed = getCompletedCommitments();
    const pending = getPendingCommitments();
    const recurring = commitments.filter((c) => c.recurrence).length;

    return {
      total: commitments.length,
      completed: completed.length,
      pending: pending.length,
      overdue: overdue.length,
      recurring,
      completionRate:
        commitments.length > 0 ? Math.round((completed.length / commitments.length) * 100) : 0,
    };
  }, [commitments, getOverdueCommitments, getCompletedCommitments, getPendingCommitments]);

  if (commitments.length === 0) {
    return null;
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-rose-500" />
          Compromissos - {periodLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cards de resumo */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-green-500" />
            <p className="text-lg font-bold">{totals.completed}</p>
            <p className="text-xs text-muted-foreground">Concluídos</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <Clock className="mx-auto mb-1 h-5 w-5 text-blue-500" />
            <p className="text-lg font-bold">{totals.pending}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <AlertCircle className="mx-auto mb-1 h-5 w-5 text-red-500" />
            <p className="text-lg font-bold">{totals.overdue}</p>
            <p className="text-xs text-muted-foreground">Atrasados</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <Repeat className="mx-auto mb-1 h-5 w-5 text-purple-500" />
            <p className="text-lg font-bold">{totals.recurring}</p>
            <p className="text-xs text-muted-foreground">Recorrentes</p>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Taxa de Conclusão</span>
            <span className="font-medium">{totals.completionRate}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
              style={{ width: `${totals.completionRate}%` }}
            />
          </div>
        </div>

        {/* Por tipo */}
        {typeStats.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Por Tipo</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {typeStats.map((stats) => (
                <div
                  key={stats.type}
                  className="flex items-center justify-between rounded-lg bg-muted/30 p-3"
                >
                  <div>
                    <p className="font-medium">{stats.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.completed}/{stats.total} concluídos
                    </p>
                  </div>
                  <div className="text-right">
                    {stats.overdue > 0 && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30">
                        {stats.overdue} atrasado{stats.overdue !== 1 ? 's' : ''}
                      </span>
                    )}
                    {stats.overdue === 0 && stats.pending > 0 && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/30">
                        {stats.pending} pendente{stats.pending !== 1 ? 's' : ''}
                      </span>
                    )}
                    {stats.pending === 0 && stats.completed > 0 && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-600 dark:bg-green-900/30">
                        ✓ Completo
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
