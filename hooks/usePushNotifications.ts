import { useState, useEffect, useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PushNotificationStore {
  enabled: boolean;
  permission: NotificationPermission;
  setEnabled: (enabled: boolean) => void;
  setPermission: (permission: NotificationPermission) => void;
}

export const usePushNotificationStore = create<PushNotificationStore>()(
  persist(
    (set) => ({
      enabled: false,
      permission: 'default',
      setEnabled: (enabled: boolean) => set({ enabled }),
      setPermission: (permission: NotificationPermission) => set({ permission }),
    }),
    {
      name: 'push-notification-storage',
    }
  )
);

export function usePushNotifications() {
  const { enabled, permission, setEnabled, setPermission } = usePushNotificationStore();
  const [isSupported, setIsSupported] = useState(false);

  // Verificar suporte a notificações
  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, [setPermission]);

  // Solicitar permissão
  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error);
      return false;
    }
  }, [isSupported, setPermission]);

  // Mostrar notificação
  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted' || !enabled) return null;

    try {
      const notification = new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        ...options,
      });

      // Auto-fechar após 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error('Erro ao mostrar notificação:', error);
      return null;
    }
  }, [isSupported, permission, enabled]);

  // Ativar/desativar notificações
  const toggleNotifications = useCallback(async () => {
    if (!enabled) {
      // Ativando - solicitar permissão se necessário
      if (permission === 'default') {
        const granted = await requestPermission();
        if (granted) {
          setEnabled(true);
        }
      } else if (permission === 'granted') {
        setEnabled(true);
      }
    } else {
      // Desativando
      setEnabled(false);
    }
  }, [enabled, permission, requestPermission, setEnabled]);

  return {
    isSupported,
    enabled,
    permission,
    canShow: isSupported && permission === 'granted' && enabled,
    requestPermission,
    showNotification,
    toggleNotifications,
  };
}