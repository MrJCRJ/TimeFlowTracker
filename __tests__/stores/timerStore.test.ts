/**
 * Testes para o Timer Store com persistência
 */

// Mock do localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock do zustand persist
jest.mock('zustand/middleware', () => ({
  persist: (fn: Function) => fn,
  createJSONStorage: () => () => localStorage,
}));

import { useTimerStore } from '@/stores/timerStore';

describe('TimerStore', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Reset store state
    useTimerStore.setState({
      isRunning: false,
      activeEntry: null,
      elapsedSeconds: 0,
      timeEntries: [],
      isLoading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('startTimer', () => {
    it('deve iniciar um timer com categoria e usuário', () => {
      const { startTimer } = useTimerStore.getState();

      const entry = startTimer('cat-1', 'user-1');

      const state = useTimerStore.getState();
      expect(state.isRunning).toBe(true);
      expect(state.activeEntry).not.toBeNull();
      expect(state.activeEntry?.categoryId).toBe('cat-1');
      expect(state.activeEntry?.userId).toBe('user-1');
      expect(entry.id).toBeDefined();
    });

    it('deve lançar erro se timer já está rodando', () => {
      const { startTimer } = useTimerStore.getState();

      startTimer('cat-1', 'user-1');

      expect(() => startTimer('cat-2', 'user-1')).toThrow('Timer já está rodando');
    });

    it('deve aceitar notas opcionais', () => {
      const { startTimer } = useTimerStore.getState();

      const entry = startTimer('cat-1', 'user-1', 'Minhas notas');

      expect(entry.notes).toBe('Minhas notas');
    });
  });

  describe('stopTimer', () => {
    it('deve parar timer ativo e criar entrada completa', () => {
      const { startTimer, stopTimer } = useTimerStore.getState();

      startTimer('cat-1', 'user-1');

      // Simular passagem de tempo
      jest.advanceTimersByTime(5000);

      const completedEntry = stopTimer();

      const state = useTimerStore.getState();
      expect(state.isRunning).toBe(false);
      expect(state.activeEntry).toBeNull();
      expect(completedEntry).not.toBeNull();
      expect(completedEntry?.endTime).toBeDefined();
      expect(completedEntry?.duration).toBeGreaterThanOrEqual(0);
    });

    it('deve retornar null se não há timer ativo', () => {
      const { stopTimer } = useTimerStore.getState();

      const result = stopTimer();

      expect(result).toBeNull();
    });

    it('deve adicionar entrada ao histórico', () => {
      const { startTimer, stopTimer } = useTimerStore.getState();

      startTimer('cat-1', 'user-1');
      stopTimer();

      const state = useTimerStore.getState();
      expect(state.timeEntries).toHaveLength(1);
    });
  });

  describe('updateElapsed', () => {
    it('deve atualizar tempo decorrido quando timer ativo', () => {
      const { startTimer } = useTimerStore.getState();

      startTimer('cat-1', 'user-1');

      // Forçar atualização manual
      useTimerStore.getState().updateElapsed();

      const state = useTimerStore.getState();
      expect(state.elapsedSeconds).toBeGreaterThanOrEqual(0);
    });

    it('não deve atualizar se timer não está ativo', () => {
      useTimerStore.setState({ elapsedSeconds: 100 });

      useTimerStore.getState().updateElapsed();

      const state = useTimerStore.getState();
      expect(state.elapsedSeconds).toBe(100);
    });
  });

  describe('restoreActiveTimer', () => {
    const mockActiveEntry = {
      id: 'entry-1',
      categoryId: 'cat-1',
      userId: 'user-1',
      startTime: new Date(Date.now() - 60000).toISOString(), // 1 minuto atrás
      endTime: null,
      duration: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('deve restaurar timer ativo da nuvem', () => {
      const { restoreActiveTimer } = useTimerStore.getState();

      restoreActiveTimer(mockActiveEntry);

      const state = useTimerStore.getState();
      expect(state.isRunning).toBe(true);
      expect(state.activeEntry).toEqual(mockActiveEntry);
      expect(state.elapsedSeconds).toBeGreaterThanOrEqual(60); // Pelo menos 60 segundos
    });

    it('não deve restaurar se já houver timer ativo local', () => {
      // Iniciar timer local primeiro
      const { startTimer, restoreActiveTimer } = useTimerStore.getState();
      startTimer('cat-local', 'user-1');

      const stateBefore = useTimerStore.getState();
      const localEntry = stateBefore.activeEntry;

      // Tentar restaurar timer da nuvem
      restoreActiveTimer(mockActiveEntry);

      const stateAfter = useTimerStore.getState();
      expect(stateAfter.activeEntry?.id).toBe(localEntry?.id);
      expect(stateAfter.activeEntry?.categoryId).toBe('cat-local');
    });
  });

  describe('CRUD de entradas', () => {
    const mockEntry = {
      id: 'entry-1',
      categoryId: 'cat-1',
      userId: 'user-1',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      duration: 3600,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('deve adicionar entrada de tempo', () => {
      const { addTimeEntry } = useTimerStore.getState();

      addTimeEntry(mockEntry);

      const state = useTimerStore.getState();
      expect(state.timeEntries).toHaveLength(1);
      expect(state.timeEntries[0].id).toBe('entry-1');
    });

    it('deve atualizar entrada existente', () => {
      useTimerStore.setState({ timeEntries: [mockEntry] });

      const { updateTimeEntry } = useTimerStore.getState();
      updateTimeEntry('entry-1', { notes: 'Nova nota' });

      const state = useTimerStore.getState();
      expect(state.timeEntries[0].notes).toBe('Nova nota');
    });

    it('deve deletar entrada', () => {
      useTimerStore.setState({ timeEntries: [mockEntry] });

      const { deleteTimeEntry } = useTimerStore.getState();
      deleteTimeEntry('entry-1');

      const state = useTimerStore.getState();
      expect(state.timeEntries).toHaveLength(0);
    });

    it('deve definir múltiplas entradas', () => {
      const entries = [mockEntry, { ...mockEntry, id: 'entry-2' }];

      const { setTimeEntries } = useTimerStore.getState();
      setTimeEntries(entries);

      const state = useTimerStore.getState();
      expect(state.timeEntries).toHaveLength(2);
    });
  });

  describe('Getters', () => {
    it('deve retornar estado do timer', () => {
      const { startTimer, getTimerState } = useTimerStore.getState();

      startTimer('cat-1', 'user-1');

      const timerState = getTimerState();
      expect(timerState.isRunning).toBe(true);
      expect(timerState.activeEntry).not.toBeNull();
    });

    it('deve filtrar entradas de hoje', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      useTimerStore.setState({
        timeEntries: [
          {
            id: 'today',
            categoryId: 'cat-1',
            userId: 'user-1',
            startTime: today.toISOString(),
            endTime: today.toISOString(),
            duration: 100,
            notes: null,
            createdAt: today.toISOString(),
            updatedAt: today.toISOString(),
          },
          {
            id: 'yesterday',
            categoryId: 'cat-1',
            userId: 'user-1',
            startTime: yesterday.toISOString(),
            endTime: yesterday.toISOString(),
            duration: 100,
            notes: null,
            createdAt: yesterday.toISOString(),
            updatedAt: yesterday.toISOString(),
          },
        ],
      });

      const { getTodayEntries } = useTimerStore.getState();
      const todayEntries = getTodayEntries();

      expect(todayEntries).toHaveLength(1);
      expect(todayEntries[0].id).toBe('today');
    });

    it('deve filtrar entradas por categoria', () => {
      useTimerStore.setState({
        timeEntries: [
          {
            id: '1',
            categoryId: 'cat-1',
            userId: 'user-1',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            duration: 100,
            notes: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            categoryId: 'cat-2',
            userId: 'user-1',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            duration: 100,
            notes: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      });

      const { getEntriesByCategory } = useTimerStore.getState();
      const cat1Entries = getEntriesByCategory('cat-1');

      expect(cat1Entries).toHaveLength(1);
      expect(cat1Entries[0].categoryId).toBe('cat-1');
    });
  });

  describe('Reset', () => {
    it('deve resetar estado para valores iniciais', () => {
      const { startTimer, reset } = useTimerStore.getState();

      startTimer('cat-1', 'user-1');
      useTimerStore.setState({ timeEntries: [{ id: 'test' } as any] });

      reset();

      const state = useTimerStore.getState();
      expect(state.isRunning).toBe(false);
      expect(state.activeEntry).toBeNull();
      expect(state.timeEntries).toHaveLength(0);
    });
  });
});
