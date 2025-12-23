'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { SyncIndicator } from '@/components/ui/SyncIndicator';
import { LoadingState } from '@/components/ui/loading-state';
import { cn, formatTime, diffInSeconds, now } from '@/lib/utils';
import { useTimerStore } from '@/stores/timerStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useActiveTimerDrive } from '@/hooks/useActiveTimerDrive';
import { TIMER_UPDATE_INTERVAL } from '@/lib/constants';
import type { Category, ActiveTimerRecord } from '@/types';
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
  Monitor,
  Smartphone,
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

interface CloudTimerBarProps {
  userId: string;
  className?: string;
  isLoading?: boolean;
}

/**
 * CloudTimerBar - Barra de timer com sincronização via Google Drive
 *
 * Este componente gerencia timers que são sincronizados entre dispositivos
 * através do Google Drive. Quando um timer é iniciado, um arquivo de registro
 * é criado no Drive. Quando é parado (de qualquer dispositivo), o registro
 * é lido, a duração é calculada e o timeEntry é salvo.
 *
 * Funcionalidades:
 * - Inicia/para timers sincronizados via Drive
 * - Mostra timers iniciados em outros dispositivos
 * - Calcula tempo decorrido em tempo real
 * - Sincroniza timeEntries automaticamente
 */
export function CloudTimerBar({ userId, className, isLoading = false }: CloudTimerBarProps) {
  const { categories, initializeDefaults } = useCategoryStore();
  const timerStore = useTimerStore();

  // Hook para timers no Drive
  const {
    activeTimers,
    isLoading: isDriveLoading,
    error: driveError,
    deviceInfo,
    startTimer: startDriveTimer,
    stopTimer: stopDriveTimer,
    cancelTimer: cancelDriveTimer,
  } = useActiveTimerDrive({
    pollingInterval: 15000, // Verificar a cada 15 segundos
    enablePolling: true,
    onTimerStopped: (entry) => {
      // Quando timer é parado, adiciona ao store local também
      timerStore.addTimeEntry(entry);
    },
    onRemoteTimerFound: (timer) => {
      // Notificar quando encontrar timer de outro dispositivo
      console.log(`[CloudTimerBar] Timer encontrado de: ${timer.deviceName}`);
    },
  });

  // Estado local para controlar tempo decorrido de cada timer
  const [elapsedTimes, setElapsedTimes] = useState<Record<string, number>>({});

  // Determina se há timer rodando
  const isRunning = timerStore.isRunning || activeTimers.length > 0;

  // Inicializa categorias padrão
  useEffect(() => {
    if (categories.length === 0 && userId) {
      initializeDefaults(userId);
    }
  }, [categories.length, userId, initializeDefaults]);

  // Atualiza tempo decorrido a cada segundo
  useEffect(() => {
    if (activeTimers.length === 0) {
      setElapsedTimes({});
      return;
    }

    const interval = setInterval(() => {
      const newElapsed: Record<string, number> = {};
      activeTimers.forEach((timer) => {
        newElapsed[timer.categoryId] = diffInSeconds(timer.startTime, now());
      });
      setElapsedTimes(newElapsed);
    }, TIMER_UPDATE_INTERVAL);

    // Calcular imediatamente
    const initialElapsed: Record<string, number> = {};
    activeTimers.forEach((timer) => {
      initialElapsed[timer.categoryId] = diffInSeconds(timer.startTime, now());
    });
    setElapsedTimes(initialElapsed);

    return () => clearInterval(interval);
  }, [activeTimers]);

  // Handler para iniciar timer
  const handleStartTimer = useCallback(
    async (categoryId: string) => {
      if (isRunning) return;

      // Inicia no Drive
      const timer = await startDriveTimer(categoryId);

      if (timer) {
        console.log(`[CloudTimerBar] Timer iniciado para ${categoryId}`);
      }
    },
    [isRunning, startDriveTimer]
  );

  // Handler para parar timer
  const handleStopTimer = useCallback(
    async (categoryId: string) => {
      // Para o timer no Drive
      const entry = await stopDriveTimer(categoryId);

      if (entry) {
        console.log(`[CloudTimerBar] Timer parado. Duração: ${entry.duration}s`);
      }
    },
    [stopDriveTimer]
  );

  // Handler para cancelar timer
  const handleCancelTimer = useCallback(
    async (categoryId: string) => {
      await cancelDriveTimer(categoryId);
      console.log(`[CloudTimerBar] Timer cancelado para ${categoryId}`);
    },
    [cancelDriveTimer]
  );

  // Obtém categoria por ID
  const getCategoryById = (categoryId: string): Category | undefined => {
    return categories.find((cat) => cat.id === categoryId);
  };

  // Verifica se timer foi iniciado por este dispositivo
  const isOwnTimer = (timer: ActiveTimerRecord): boolean => {
    return timer.deviceId === deviceInfo.deviceId;
  };

  // Renderiza ícone da categoria
  const renderIcon = (iconName: string, color: string, isMobile = false) => {
    const Icon = iconMap[iconName] || Folder;
    return (
      <Icon className={cn('h-4 w-4', isMobile && 'h-5 w-5 sm:h-4 sm:w-4')} style={{ color }} />
    );
  };

  // Renderiza ícone de dispositivo
  const renderDeviceIcon = (platform: string) => {
    if (['Android', 'iOS', 'Windows Phone'].includes(platform)) {
      return <Smartphone className="h-3 w-3" />;
    }
    return <Monitor className="h-3 w-3" />;
  };

  // Loading state
  if (isLoading || isDriveLoading) {
    return (
      <div
        data-testid="cloud-timer-bar"
        role="region"
        aria-label="Barra de timer"
        className={cn('timer-bar flex items-center justify-center p-4', className)}
      >
        <LoadingState type="timer" />
      </div>
    );
  }

  // Sem categorias
  if (categories.length === 0) {
    return (
      <div
        data-testid="cloud-timer-bar"
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
      data-testid="cloud-timer-bar"
      role="region"
      aria-label="Barra de timer"
      className={cn('timer-bar', isRunning && 'timer-bar-active', className)}
    >
      <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-3">
        {/* Erro do Drive */}
        {driveError && (
          <div className="mb-2 rounded bg-danger/10 px-3 py-1 text-sm text-danger">
            {driveError}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          {/* Timers Ativos */}
          {activeTimers.length > 0 ? (
            <div className="flex flex-1 flex-col gap-2">
              {activeTimers.map((timer) => {
                const category = getCategoryById(timer.categoryId);
                const elapsed = elapsedTimes[timer.categoryId] || 0;
                const isOwn = isOwnTimer(timer);

                return (
                  <div
                    key={timer.id}
                    className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-2"
                  >
                    <div className="flex items-center gap-2">
                      {category && renderIcon(category.icon, category.color)}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {category?.name || 'Categoria desconhecida'}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          {renderDeviceIcon(timer.deviceId)}
                          {isOwn ? 'Este dispositivo' : timer.deviceName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg font-bold tabular-nums text-primary">
                        {formatTime(elapsed)}
                      </span>

                      <button
                        onClick={() => handleStopTimer(timer.categoryId)}
                        className={cn(
                          'flex items-center gap-1 rounded-lg px-3 py-1.5',
                          'bg-danger font-medium text-white',
                          'transition-all duration-200',
                          'hover:scale-105 hover:bg-danger/90'
                        )}
                        aria-label="Parar timer"
                      >
                        <Square className="h-4 w-4" />
                        <span className="hidden sm:inline">Parar</span>
                      </button>

                      {!isOwn && (
                        <button
                          onClick={() => handleCancelTimer(timer.categoryId)}
                          className={cn(
                            'rounded-lg px-2 py-1.5 text-xs',
                            'border border-border text-muted-foreground',
                            'hover:bg-background/50'
                          )}
                          aria-label="Cancelar timer"
                          title="Cancelar (não registra tempo)"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Seleção de categoria */
            <div className="flex flex-1 flex-col gap-2">
              <span className="whitespace-nowrap text-xs text-muted-foreground sm:text-sm">
                Selecione uma categoria para iniciar:
              </span>
              <div className="no-scrollbar grid auto-cols-max grid-flow-col gap-3 overflow-x-auto pb-2 sm:flex sm:gap-2 sm:pb-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleStartTimer(category.id)}
                    disabled={isRunning}
                    className={cn(
                      'flex flex-shrink-0 items-center gap-2 rounded-full',
                      'px-4 py-3 text-base',
                      'sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm',
                      'min-w-[100px] justify-center sm:min-w-0 sm:justify-start',
                      'border border-border bg-background',
                      'transition-all duration-200',
                      'hover:scale-105 hover:border-primary/50 hover:bg-primary/5',
                      'active:scale-95 active:bg-primary/10',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      'disabled:cursor-not-allowed disabled:opacity-50'
                    )}
                    aria-label={`Iniciar timer para ${category.name}`}
                    title={category.name}
                  >
                    {renderIcon(category.icon, category.color, true)}
                    <span className="whitespace-nowrap">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Controles e Status */}
          <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-border/30 pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
            {!isRunning && (
              <div className="text-sm text-muted-foreground">
                <Play className="h-5 w-5" />
              </div>
            )}

            {/* Indicador de sincronização */}
            <SyncIndicator lastSync={null} isSyncing={isDriveLoading} isOnline={true} />

            {/* Info do dispositivo atual */}
            <div
              className="flex items-center gap-1 text-xs text-muted-foreground"
              title={deviceInfo.deviceName}
            >
              {renderDeviceIcon(deviceInfo.platform)}
              <span className="hidden sm:inline">{deviceInfo.platform}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CloudTimerBar;
