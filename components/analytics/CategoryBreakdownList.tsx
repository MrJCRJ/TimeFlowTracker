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
export function CategoryBreakdownList({
  breakdown,
  className,
}: CategoryBreakdownListProps) {
  if (breakdown.length === 0) {
    return null;
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">
          Detalhamento por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="space-y-4"
          role="list"
          aria-label="Lista de categorias por tempo"
        >
          {breakdown.map((item, index) => (
            <CategoryBreakdownItem
              key={item.categoryId}
              item={item}
              rank={index + 1}
            />
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
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <span 
            className="w-5 sm:w-6 text-base sm:text-lg font-medium text-muted-foreground flex-shrink-0"
            aria-hidden="true"
          >
            #{rank}
          </span>
          <div
            className="h-3 w-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: item.categoryColor }}
            aria-hidden="true"
          />
          <span className="font-medium truncate">
            {item.categoryName}
          </span>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-sm sm:text-base font-bold">
            {formatDuration(item.totalSeconds)}
          </span>
          <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-muted-foreground">
            ({item.percentage}%)
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div 
        className="ml-7 sm:ml-9 h-2 overflow-hidden rounded-full bg-muted"
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
