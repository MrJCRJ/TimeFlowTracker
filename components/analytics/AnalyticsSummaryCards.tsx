'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDuration } from '@/lib/utils';
import { Clock, TrendingUp, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsSummaryCardsProps {
  totalSeconds: number;
  averagePerDay: number;
  daysWithRecords: number;
  categoriesUsed: number;
  totalCategories: number;
  totalEntries: number;
  periodLabel: string;
  className?: string;
}

/**
 * Cards de resumo de estatísticas de tempo
 * Mostra tempo total, média diária e categorias usadas
 */
export function AnalyticsSummaryCards({
  totalSeconds,
  averagePerDay,
  daysWithRecords,
  categoriesUsed,
  totalCategories,
  totalEntries,
  periodLabel,
  className,
}: AnalyticsSummaryCardsProps) {
  const cards = [
    {
      title: 'Tempo Total',
      icon: Clock,
      value: formatDuration(totalSeconds),
      description: periodLabel,
    },
    {
      title: 'Média Diária',
      icon: TrendingUp,
      value: formatDuration(Math.round(averagePerDay)),
      description: `${daysWithRecords} dias com registros`,
    },
    {
      title: 'Categorias Usadas',
      icon: FolderOpen,
      value: (
        <div className="flex items-baseline gap-1">
          <span>{categoriesUsed}</span>
          <span className="text-base font-normal text-muted-foreground">
            de {totalCategories}
          </span>
        </div>
      ),
      description: `${totalEntries} registros totais`,
    },
  ];

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {cards.map(({ title, icon: Icon, value, description }) => (
        <Card key={title} className="touch-target">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Icon 
                className="h-5 w-5 flex-shrink-0 text-muted-foreground" 
                aria-hidden="true"
              />
              <span className="text-xl font-bold sm:text-2xl">
                {typeof value === 'string' ? value : value}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
