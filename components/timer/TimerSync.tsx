'use client';

import { useEffect, useRef } from 'react';
import { useTimerStore } from '@/stores/timerStore';
import { useAutoSync } from '@/hooks/useAutoSync';

export function TimerSync() {
  const { isRunning, updateElapsed } = useTimerStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Hook de auto-sync
  useAutoSync({ autoSync: true, syncIntervalMinutes: 5, showNotifications: false });

  // Atualizar tempo decorrido a cada segundo quando timer está rodando
  useEffect(() => {
    if (isRunning) {
      // Atualizar imediatamente
      updateElapsed();

      // Continuar atualizando a cada segundo
      intervalRef.current = setInterval(() => {
        updateElapsed();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, updateElapsed]);

  return null;
}
