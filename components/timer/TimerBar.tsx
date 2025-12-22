'use client';

import React, { useEffect, useCallback } from 'react';
import { SyncIndicator } from '@/components/ui/SyncIndicator';
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
  isSyncing?: boolean; // Indica se está sincronizando
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
 */
export function TimerBar({
  userId,
  className,
  store,
  categories: propCategories,
  isSyncing = false,
  isLoading = false,
}: TimerBarProps) {
  // Sempre chama o hook, mas pode sobrescrever com props
  const timerStoreFromHook = useTimerStore();
  const { categories: storeCategories, initializeDefaults } = useCategoryStore();

  // Usa o store injetado (testes) ou o hook
  const timerStore = store || timerStoreFromHook;

  // Usa categorias das props (para testes) ou do store
  const categories = propCategories || storeCategories;

  const { isRunning, activeEntry, elapsedSeconds, startTimer, stopTimer, updateElapsed } =
    timerStore;

  // Inicializa categorias padrão se não houver nenhuma
  useEffect(() => {
    if (storeCategories.length === 0 && userId) {
      initializeDefaults(userId);
    }
  }, [storeCategories.length, userId, initializeDefaults]);

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
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Categorias / Status */}
          <div className="flex flex-1 items-center gap-2 overflow-hidden">
            {isRunning && activeCategory ? (
              <div className="flex items-center gap-2 text-sm font-medium">
                {renderIcon(activeCategory.icon, activeCategory.color)}
                <span>Registrando: {activeCategory.name}</span>
              </div>
            ) : (
              <div className="flex w-full flex-col gap-2">
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  Selecione uma categoria para iniciar:
                </span>
                <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleStartTimer(category.id)}
                      disabled={isRunning}
                      className={cn(
                        'flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm',
                        'border border-border bg-background',
                        'transition-all duration-200',
                        'hover:scale-105 hover:border-primary/50 hover:bg-primary/5',
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
              </div>
            )}
          </div>

          {/* Timer Display */}
          <div className="flex flex-shrink-0 items-center gap-3">
            <div
              data-testid="timer-display"
              className={cn(
                'font-mono text-2xl font-bold tabular-nums',
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
                  'hover:scale-105 hover:bg-danger/90',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-danger'
                )}
                aria-label="Parar timer"
              >
                <Square className="h-4 w-4" />
                <span>Parar</span>
              </button>
            ) : (
              <div className="text-sm text-muted-foreground">
                <Play className="h-5 w-5" />
              </div>
            )}

            {/* Indicador de sincronização */}
            <SyncIndicator
              lastSync={null} // TODO: conectar com hook de sync
              isSyncing={isSyncing}
              isOnline={true} // TODO: detectar status online
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimerBar;
