'use client';

import { useTimerNotifications } from '@/hooks/useTimerNotifications';

export function TimerNotifications() {
  useTimerNotifications();
  return null; // Este componente apenas executa o hook
}
