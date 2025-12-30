'use client';

import React, { useEffect, useCallback } from 'react';
import { LoadingState } from '@/components/ui/loading-state';
import { cn, formatTime } from '@/lib/utils';
import { useTimerStore } from '@/stores/timerStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { TIMER_UPDATE_INTERVAL } from '@/lib/constants';
import type { Category, TimeEntry } from '@/types';
import {
  Play,
  Square,
  Briefcase,
  Book,
  Dumbbell,
  Gamepad2,
  Moon,
  Utensils,
  Car,
  Folder,
  LucideIcon,
} from 'lucide-react';

// Mapa de ícones
const iconMap: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  book: Book,
  dumbbell: Dumbbell,
  'gamepad-2': Gamepad2,
  moon: Moon,
  utensils: Utensils,
  car: Car,
  folder: Folder,
};

// Tipo para o store do timer (para injeção em testes)
interface TimerStoreState {
  isRunning: boolean;
  activeEntry: TimeEntry | null;
  elapsedSeconds: number;
  startTimer: (categoryId: string, userId: string) => void;
  stopTimer: () => void;
  updateElapsed: () => void;
}

interface TimerBarProps {
  userId: string;
  className?: string;
  store?: TimerStoreState; // Para testes - sobrescreve o hook
  categories?: Category[]; // Opcional para testes
  isLoading?: boolean; // Indica se está carregando dados iniciais
}

/**
 * TimerBar - Barra fixa inferior para controle do timer
 *
 * Funcionalidades:
 * - Exibe categorias como botões
 * - Inicia timer ao clicar em categoria
 * - Mostra tempo decorrido em tempo real
 * - Permite parar timer ativo
 * - Funciona 100% offline
 */
export function TimerBar({
  userId,
  className,
  store,
  categories: propCategories,
  isLoading = false,
}: TimerBarProps) {
  // Sempre chama o hook, mas pode sobrescrever com props
  const timerStoreFromHook = useTimerStore();
  const { categories: storeCategories } = useCategoryStore();

  // Usa o store injetado (testes) ou o hook
  const timerStore = store || timerStoreFromHook;

  // Usa categorias das props (para testes) ou do store
  const categories = propCategories || storeCategories;

  const { isRunning, activeEntry, elapsedSeconds, startTimer, stopTimer, updateElapsed } =
    timerStore;

  // Atualiza elapsed a cada segundo quando timer ativo
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      updateElapsed();
    }, TIMER_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [isRunning, updateElapsed]);

  // Handler para iniciar timer
  const handleStartTimer = useCallback(
    (categoryId: string) => {
      if (isRunning) return;
      startTimer(categoryId, userId);
    },
    [isRunning, startTimer, userId]
  );

  // Handler para parar timer
  const handleStopTimer = useCallback(() => {
    stopTimer();
  }, [stopTimer]);

  // Obtém categoria ativa
  const activeCategory = activeEntry
    ? categories.find((cat) => cat.id === activeEntry.categoryId)
    : null;

  // Renderiza ícone da categoria
  const renderIcon = (iconName: string, color: string) => {
    const Icon = iconMap[iconName] || Folder;
    return <Icon className="h-4 w-4" style={{ color }} />;
  };

  // Se está carregando dados iniciais
  if (isLoading) {
    return (
      <div
        data-testid="timer-bar"
        role="region"
        aria-label="Barra de timer"
        className={cn('timer-bar flex items-center justify-center p-4', className)}
      >
        <LoadingState type="timer" />
      </div>
    );
  }

  // Se não há categorias
  if (categories.length === 0) {
    return (
      <div
        data-testid="timer-bar"
        role="region"
        aria-label="Barra de timer"
        className={cn('timer-bar flex items-center justify-center p-4', className)}
      >
        <p className="text-muted-foreground">Nenhuma categoria disponível</p>
      </div>
    );
  }

  return (
    <div
      data-testid="timer-bar"
      role="region"
      aria-label="Barra de timer"
      className={cn('timer-bar', isRunning && 'timer-bar-active', className)}
    >
      <div className="container mx-auto px-3 py-2 sm:px-4 sm:py-3">
        {/* Layout horizontal compacto */}
        <div className="flex items-center justify-between gap-3">
          {/* Categorias / Status - lado esquerdo */}
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            {isRunning && activeCategory ? (
              <div className="flex items-center gap-2 text-sm font-medium">
                {renderIcon(activeCategory.icon, activeCategory.color)}
                <span className="truncate">Registrando: {activeCategory.name}</span>
              </div>
            ) : (
              /* Categorias em linha horizontal com scroll */
              <div className="no-scrollbar flex gap-2 overflow-x-auto">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleStartTimer(category.id)}
                    disabled={isRunning}
                    className={cn(
                      'flex flex-shrink-0 items-center gap-1.5 rounded-full',
                      'px-3 py-1.5 text-sm',
                      'border border-border bg-background',
                      'transition-all duration-200',
                      'hover:border-primary/50 hover:bg-primary/5',
                      'active:scale-95 active:bg-primary/10',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                      activeEntry?.categoryId === category.id &&
                        'active border-primary bg-primary/10'
                    )}
                    aria-label={`Iniciar timer para ${category.name}`}
                    title={category.name}
                  >
                    {renderIcon(category.icon, category.color)}
                    <span className="whitespace-nowrap">{category.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Timer Display e Controles - lado direito */}
          <div className="flex flex-shrink-0 items-center gap-3">
            <div
              data-testid="timer-display"
              className={cn(
                'font-mono text-xl font-bold tabular-nums sm:text-2xl',
                isRunning ? 'animate-pulse text-primary' : 'text-muted-foreground'
              )}
            >
              {formatTime(elapsedSeconds)}
            </div>

            {/* Botão Start/Stop */}
            {isRunning ? (
              <button
                onClick={handleStopTimer}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2',
                  'bg-danger font-medium text-white',
                  'transition-all duration-200',
                  'hover:bg-danger/90',
                  'active:scale-95',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-danger'
                )}
                aria-label="Parar timer"
              >
                <Square className="h-4 w-4" />
                <span className="hidden sm:inline">Parar</span>
              </button>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
                <Play className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimerBar;
