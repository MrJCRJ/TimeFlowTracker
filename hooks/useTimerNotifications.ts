import { useEffect, useRef } from 'react';
import { useTimerStore } from '@/stores/timerStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { usePushNotifications } from './usePushNotifications';

export function useTimerNotifications() {
  const { isRunning, activeEntry, elapsedSeconds } = useTimerStore();
  const { categories } = useCategoryStore();
  const { addNotification } = useNotificationStore();
  const { showNotification, canShow } = usePushNotifications();

  const lastNotificationTime = useRef<number>(0);
  const hasNotifiedStart = useRef<boolean>(false);

  // Notificação quando timer inicia
  useEffect(() => {
    if (isRunning && activeEntry && !hasNotifiedStart.current) {
      const category = categories.find((c) => c.id === activeEntry.categoryId);
      if (category) {
        const message = `Registrando tempo em "${category.name}"`;

        // Notificação push (se disponível)
        if (canShow) {
          showNotification('Timer Iniciado', {
            body: message,
            tag: 'timer-start',
            requireInteraction: false,
          });
        }

        // Notificação do app
        addNotification({
          type: 'info',
          title: 'Timer Iniciado',
          message,
        });
        hasNotifiedStart.current = true;
      }
    } else if (!isRunning) {
      hasNotifiedStart.current = false;
    }
  }, [isRunning, activeEntry, categories, addNotification, canShow, showNotification]);

  // Notificações de lembretes (a cada 30 minutos)
  useEffect(() => {
    if (!isRunning || !activeEntry) return;

    const currentTime = Date.now();
    const thirtyMinutes = 30 * 60 * 1000; // 30 minutos em ms

    if (currentTime - lastNotificationTime.current >= thirtyMinutes) {
      const category = categories.find((c) => c.id === activeEntry.categoryId);
      const hours = Math.floor(elapsedSeconds / 3600);
      const minutes = Math.floor((elapsedSeconds % 3600) / 60);

      let timeMessage = '';
      if (hours > 0) {
        timeMessage = `${hours}h ${minutes}min`;
      } else {
        timeMessage = `${minutes}min`;
      }

      const title = `Timer Ativo - ${timeMessage}`;
      const message = `Continuando a registrar tempo em "${category?.name || 'categoria'}"`;

      // Notificação push (se disponível)
      if (canShow) {
        showNotification(title, {
          body: message,
          tag: 'timer-reminder',
          requireInteraction: false,
        });
      }

      // Notificação do app
      addNotification({
        type: 'info',
        title,
        message,
      });

      lastNotificationTime.current = currentTime;
    }
  }, [
    isRunning,
    activeEntry,
    elapsedSeconds,
    categories,
    addNotification,
    canShow,
    showNotification,
  ]);

  // Reset do timer de notificações quando para
  useEffect(() => {
    if (!isRunning) {
      lastNotificationTime.current = 0;
    }
  }, [isRunning]);
}
