/**
 * Testes para o Notification Store
 */

// Mock do zustand persist
jest.mock('zustand/middleware', () => ({
  persist: (fn: Function) => fn,
  createJSONStorage: () => () => localStorage,
}));

import { useNotificationStore } from '@/stores/notificationStore';

describe('NotificationStore', () => {
  beforeEach(() => {
    // Reset store state
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
    });
    jest.clearAllMocks();
  });

  describe('addNotification', () => {
    it('deve adicionar notificação de info', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({
        type: 'info',
        title: 'Informação',
        message: 'Mensagem de teste',
      });

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].type).toBe('info');
      expect(state.notifications[0].title).toBe('Informação');
    });

    it('deve adicionar notificação de sucesso', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({
        type: 'success',
        title: 'Sucesso',
        message: 'Operação realizada com sucesso',
      });

      const state = useNotificationStore.getState();
      expect(state.notifications[0].type).toBe('success');
    });

    it('deve adicionar notificação de erro', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Algo deu errado',
      });

      const state = useNotificationStore.getState();
      expect(state.notifications[0].type).toBe('error');
    });

    it('deve adicionar notificação de aviso', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({
        type: 'warning',
        title: 'Aviso',
        message: 'Cuidado!',
      });

      const state = useNotificationStore.getState();
      expect(state.notifications[0].type).toBe('warning');
    });

    it('deve gerar ID e timestamp automaticamente', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test',
      });

      const state = useNotificationStore.getState();
      expect(state.notifications[0].id).toBeDefined();
      expect(state.notifications[0].timestamp).toBeDefined();
    });

    it('deve incrementar contador de não lidas', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({ type: 'info', title: 'Test 1', message: 'Test' });
      addNotification({ type: 'info', title: 'Test 2', message: 'Test' });

      const state = useNotificationStore.getState();
      expect(state.unreadCount).toBe(2);
    });

    it('deve marcar como não lida por padrão', () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({ type: 'info', title: 'Test', message: 'Test' });

      const state = useNotificationStore.getState();
      expect(state.notifications[0].read).toBe(false);
    });
  });

  describe('markAsRead', () => {
    it('deve marcar notificação como lida', () => {
      const { addNotification, markAsRead } = useNotificationStore.getState();

      addNotification({ type: 'info', title: 'Test', message: 'Test' });

      const notificationId = useNotificationStore.getState().notifications[0].id;
      markAsRead(notificationId);

      const state = useNotificationStore.getState();
      expect(state.notifications[0].read).toBe(true);
    });

    it('deve decrementar contador de não lidas', () => {
      const { addNotification, markAsRead } = useNotificationStore.getState();

      addNotification({ type: 'info', title: 'Test 1', message: 'Test' });
      addNotification({ type: 'info', title: 'Test 2', message: 'Test' });

      expect(useNotificationStore.getState().unreadCount).toBe(2);

      const notificationId = useNotificationStore.getState().notifications[0].id;
      markAsRead(notificationId);

      expect(useNotificationStore.getState().unreadCount).toBe(1);
    });

    it('não deve decrementar se já está lida', () => {
      const { addNotification, markAsRead } = useNotificationStore.getState();

      addNotification({ type: 'info', title: 'Test', message: 'Test' });

      const notificationId = useNotificationStore.getState().notifications[0].id;
      markAsRead(notificationId);
      markAsRead(notificationId); // Marcar novamente

      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
  });

  describe('markAllAsRead', () => {
    it('deve marcar todas as notificações como lidas', () => {
      const { addNotification, markAllAsRead } = useNotificationStore.getState();

      addNotification({ type: 'info', title: 'Test 1', message: 'Test' });
      addNotification({ type: 'info', title: 'Test 2', message: 'Test' });
      addNotification({ type: 'info', title: 'Test 3', message: 'Test' });

      markAllAsRead();

      const state = useNotificationStore.getState();
      expect(state.notifications.every((n) => n.read)).toBe(true);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('removeNotification', () => {
    it('deve remover notificação por ID', () => {
      const { addNotification, removeNotification } = useNotificationStore.getState();

      addNotification({ type: 'info', title: 'Test', message: 'Test' });

      const notificationId = useNotificationStore.getState().notifications[0].id;
      removeNotification(notificationId);

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(0);
    });

    it('deve decrementar contador se notificação não lida', () => {
      const { addNotification, removeNotification } = useNotificationStore.getState();

      addNotification({ type: 'info', title: 'Test', message: 'Test' });

      const notificationId = useNotificationStore.getState().notifications[0].id;
      removeNotification(notificationId);

      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
  });

  describe('clearAll', () => {
    it('deve remover todas as notificações', () => {
      const { addNotification, clearAll } = useNotificationStore.getState();

      addNotification({ type: 'info', title: 'Test 1', message: 'Test' });
      addNotification({ type: 'info', title: 'Test 2', message: 'Test' });

      clearAll();

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(0);
      expect(state.unreadCount).toBe(0);
    });
  });
});
