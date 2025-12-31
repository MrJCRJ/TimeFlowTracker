'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useJobStore } from '@/stores/jobStore';
import { Briefcase, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import type { TimeEntry } from '@/types';

interface WorkAnalyticsProps {
  filteredEntries: TimeEntry[];
  periodLabel: string;
  className?: string;
}

interface JobStats {
  jobId: string;
  jobName: string;
  jobColor: string;
  hourlyRate: number;
  totalSeconds: number;
  totalEarnings: number;
  sessions: number;
}

/**
 * Componente de analytics para a categoria Trabalho
 * Mostra ganhos por job, tempo trabalhado e métricas financeiras
 */
export function WorkAnalytics({ filteredEntries, periodLabel, className }: WorkAnalyticsProps) {
  const { getJobById } = useJobStore();

  // Filtrar apenas entradas de trabalho
  const workEntries = useMemo(() => {
    return filteredEntries.filter((entry) => entry.categoryId === 'work');
  }, [filteredEntries]);

  // Calcular estatísticas por job
  const jobStats = useMemo((): JobStats[] => {
    const statsMap = new Map<string, JobStats>();

    workEntries.forEach((entry) => {
      // Tentar extrair jobId das notas ou metadados
      const jobId = entry.metadata?.jobId || 'unknown';
      const job = getJobById(jobId);

      if (!statsMap.has(jobId)) {
        statsMap.set(jobId, {
          jobId,
          jobName: job?.name || 'Trabalho Geral',
          jobColor: job?.color || '#3b82f6',
          hourlyRate: job?.hourlyRate || 0,
          totalSeconds: 0,
          totalEarnings: 0,
          sessions: 0,
        });
      }

      const stats = statsMap.get(jobId)!;
      stats.totalSeconds += entry.duration || 0;
      stats.sessions += 1;
      stats.totalEarnings = (stats.totalSeconds / 3600) * stats.hourlyRate;
    });

    return Array.from(statsMap.values()).sort((a, b) => b.totalEarnings - a.totalEarnings);
  }, [workEntries, getJobById]);

  // Totais
  const totals = useMemo(() => {
    return jobStats.reduce(
      (acc, stats) => ({
        totalSeconds: acc.totalSeconds + stats.totalSeconds,
        totalEarnings: acc.totalEarnings + stats.totalEarnings,
        totalSessions: acc.totalSessions + stats.sessions,
      }),
      { totalSeconds: 0, totalEarnings: 0, totalSessions: 0 }
    );
  }, [jobStats]);

  // Média por sessão
  const avgEarningsPerSession =
    totals.totalSessions > 0 ? totals.totalEarnings / totals.totalSessions : 0;

  if (workEntries.length === 0) {
    return null;
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Briefcase className="h-5 w-5 text-blue-500" />
          Trabalho - {periodLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cards de resumo */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <DollarSign className="mx-auto mb-1 h-5 w-5 text-green-500" />
            <p className="text-lg font-bold">R$ {totals.totalEarnings.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Ganho</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <Clock className="mx-auto mb-1 h-5 w-5 text-blue-500" />
            <p className="text-lg font-bold">{formatDuration(totals.totalSeconds)}</p>
            <p className="text-xs text-muted-foreground">Tempo Total</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <Briefcase className="mx-auto mb-1 h-5 w-5 text-purple-500" />
            <p className="text-lg font-bold">{totals.totalSessions}</p>
            <p className="text-xs text-muted-foreground">Sessões</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <TrendingUp className="mx-auto mb-1 h-5 w-5 text-amber-500" />
            <p className="text-lg font-bold">R$ {avgEarningsPerSession.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Média/Sessão</p>
          </div>
        </div>

        {/* Lista de jobs */}
        {jobStats.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Por Trabalho</h4>
            <div className="space-y-2">
              {jobStats.map((stats) => (
                <div
                  key={stats.jobId}
                  className="flex items-center justify-between rounded-lg bg-muted/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: stats.jobColor }}
                    />
                    <div>
                      <p className="font-medium">{stats.jobName}</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.sessions} sessão{stats.sessions !== 1 ? 'ões' : ''} · R${' '}
                        {stats.hourlyRate}/h
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">R$ {stats.totalEarnings.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDuration(stats.totalSeconds)}
                    </p>
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
