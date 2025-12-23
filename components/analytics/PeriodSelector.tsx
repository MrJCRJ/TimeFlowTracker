'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TimePeriod = 'today' | 'week' | 'month' | 'custom';

interface PeriodSelectorProps {
  period: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  customStartDate: string;
  customEndDate: string;
  onCustomStartDateChange: (date: string) => void;
  onCustomEndDateChange: (date: string) => void;
  className?: string;
}

/**
 * Componente para seleção de período de tempo
 * Inclui opções predefinidas e período personalizado com datas
 */
export function PeriodSelector({
  period,
  onPeriodChange,
  customStartDate,
  customEndDate,
  onCustomStartDateChange,
  onCustomEndDateChange,
  className,
}: PeriodSelectorProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Period Buttons */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Selecionar período de tempo">
        <Button
          variant={period === 'today' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPeriodChange('today')}
          className="touch-target min-w-[70px]"
        >
          Hoje
        </Button>
        <Button
          variant={period === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPeriodChange('week')}
          className="touch-target min-w-[80px]"
        >
          Semana
        </Button>
        <Button
          variant={period === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPeriodChange('month')}
          className="touch-target min-w-[60px]"
        >
          Mês
        </Button>
        <Button
          variant={period === 'custom' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPeriodChange('custom')}
          className="touch-target"
        >
          <Calendar className="mr-1 h-4 w-4" />
          <span className="hidden sm:inline">Personalizado</span>
          <span className="sm:hidden">Custom</span>
        </Button>
      </div>

      {/* Custom Date Range */}
      {period === 'custom' && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="flex-1 sm:min-w-[160px]">
                <label htmlFor="analytics-start-date" className="mb-1 block text-sm font-medium">
                  Data Inicial
                </label>
                <input
                  id="analytics-start-date"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => onCustomStartDateChange(e.target.value)}
                  className="touch-target w-full rounded-md border bg-background px-3 py-2"
                />
              </div>
              <div className="flex-1 sm:min-w-[160px]">
                <label htmlFor="analytics-end-date" className="mb-1 block text-sm font-medium">
                  Data Final
                </label>
                <input
                  id="analytics-end-date"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => onCustomEndDateChange(e.target.value)}
                  className="touch-target w-full rounded-md border bg-background px-3 py-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
