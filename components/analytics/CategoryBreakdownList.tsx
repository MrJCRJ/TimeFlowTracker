'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDuration } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { CategoryTimeBreakdown } from '@/types';

interface CategoryBreakdownListProps {
  breakdown: CategoryTimeBreakdown[];
  className?: string;
}

/**
 * Lista detalhada de categorias com barras de progresso
 * Mostra ranking, tempo e porcentagem de cada categoria
 */
export function CategoryBreakdownList({ breakdown, className }: CategoryBreakdownListProps) {
  if (breakdown.length === 0) {
    return null;
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Detalhamento por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4" role="list" aria-label="Lista de categorias por tempo">
          {breakdown.map((item, index) => (
            <CategoryBreakdownItem key={item.categoryId} item={item} rank={index + 1} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface CategoryBreakdownItemProps {
  item: CategoryTimeBreakdown;
  rank: number;
}

function CategoryBreakdownItem({ item, rank }: CategoryBreakdownItemProps) {
  return (
    <div
      role="listitem"
      aria-label={`${item.categoryName}: ${formatDuration(item.totalSeconds)}, ${item.percentage}%`}
    >
      {/* Header: Rank, Color, Name, Time, Percentage */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <span
            className="w-5 flex-shrink-0 text-base font-medium text-muted-foreground sm:w-6 sm:text-lg"
            aria-hidden="true"
          >
            #{rank}
          </span>
          <div
            className="h-3 w-3 flex-shrink-0 rounded-full"
            style={{ backgroundColor: item.categoryColor }}
            aria-hidden="true"
          />
          <span className="truncate font-medium">{item.categoryName}</span>
        </div>
        <div className="flex-shrink-0 text-right">
          <span className="text-sm font-bold sm:text-base">
            {formatDuration(item.totalSeconds)}
          </span>
          <span className="ml-1 text-xs text-muted-foreground sm:ml-2 sm:text-sm">
            ({item.percentage}%)
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="ml-7 h-2 overflow-hidden rounded-full bg-muted sm:ml-9"
        role="progressbar"
        aria-valuenow={item.percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${item.categoryName}: ${item.percentage}%`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${item.percentage}%`,
            backgroundColor: item.categoryColor,
          }}
        />
      </div>
    </div>
  );
}
