'use client';

import { CloudTimerBar } from '@/components/timer/CloudTimerBar';
import { useCategoryStore } from '@/stores/categoryStore';

interface TimerBarWrapperProps {
  userId: string;
}

/**
 * TimerBarWrapper - Wrapper que usa CloudTimerBar para sincronização via Drive
 *
 * Este componente utiliza o CloudTimerBar que sincroniza os timers entre
 * dispositivos através do Google Drive. Quando um timer é iniciado,
 * ele cria um arquivo de registro no Drive. Quando é parado (de qualquer
 * dispositivo), o registro é lido, a duração é calculada e salva.
 */
export function TimerBarWrapper({ userId }: TimerBarWrapperProps) {
  const { categories, isLoading } = useCategoryStore();

  return <CloudTimerBar userId={userId} isLoading={isLoading && categories.length === 0} />;
}
