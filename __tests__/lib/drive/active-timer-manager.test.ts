import { ActiveTimerManager } from '@/lib/drive/active-timer-manager';
import { DriveFileManager } from '@/lib/drive/file-manager';
import { DriveFolderManager } from '@/lib/drive/folder-manager';
import type { DeviceInfo, ActiveTimerFile } from '@/types';

// Mock do drive_v3
const mockDrive = {} as any;

// Mock do folder manager
const mockFolderManager = {
  getOrCreateFolder: jest.fn().mockResolvedValue('folder-id'),
} as unknown as DriveFolderManager;

// Mock do file manager
const createMockFileManager = () => ({
  writeFile: jest.fn().mockResolvedValue('file-id'),
  readFile: jest.fn(),
  deleteFile: jest.fn().mockResolvedValue(true),
  listFiles: jest.fn().mockResolvedValue([]),
  findFile: jest.fn(),
});

describe('ActiveTimerManager', () => {
  let manager: ActiveTimerManager;
  let mockFileManager: ReturnType<typeof createMockFileManager>;

  const mockDeviceInfo: DeviceInfo = {
    deviceId: 'device-123',
    deviceName: 'Test Device',
    platform: 'Linux',
    userAgent: 'Test Agent',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFileManager = createMockFileManager();
    manager = new ActiveTimerManager(
      mockDrive,
      mockFolderManager,
      mockFileManager as unknown as DriveFileManager
    );
  });

  describe('registerTimerStart', () => {
    it('deve criar um registro de timer ativo', async () => {
      mockFileManager.readFile.mockResolvedValue(null);

      const timer = await manager.registerTimerStart(
        'category-1',
        'user-1',
        mockDeviceInfo,
        'Notas do teste'
      );

      expect(timer).toMatchObject({
        categoryId: 'category-1',
        userId: 'user-1',
        deviceId: 'device-123',
        deviceName: 'Test Device',
        notes: 'Notas do teste',
      });
      expect(timer.id).toBeDefined();
      expect(timer.startTime).toBeDefined();
      expect(mockFileManager.writeFile).toHaveBeenCalledWith(
        'active_timer_category-1.json',
        expect.objectContaining({
          timer: expect.objectContaining({
            categoryId: 'category-1',
          }),
        })
      );
    });

    it('deve lançar erro se já existir timer ativo para a categoria', async () => {
      const existingTimer: ActiveTimerFile = {
        timer: {
          id: 'timer-1',
          categoryId: 'category-1',
          userId: 'user-1',
          startTime: new Date().toISOString(),
          deviceId: 'other-device',
          deviceName: 'Other Device',
          notes: null,
          createdAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      };
      mockFileManager.readFile.mockResolvedValue(existingTimer);

      await expect(
        manager.registerTimerStart('category-1', 'user-1', mockDeviceInfo)
      ).rejects.toThrow('Já existe um timer ativo para esta categoria');
    });
  });

  describe('getActiveTimer', () => {
    it('deve retornar timer ativo se existir', async () => {
      const existingTimer: ActiveTimerFile = {
        timer: {
          id: 'timer-1',
          categoryId: 'category-1',
          userId: 'user-1',
          startTime: new Date().toISOString(),
          deviceId: 'device-123',
          deviceName: 'Test Device',
          notes: null,
          createdAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      };
      mockFileManager.readFile.mockResolvedValue(existingTimer);

      const timer = await manager.getActiveTimer('category-1');

      expect(timer).toEqual(existingTimer.timer);
    });

    it('deve retornar null se não houver timer ativo', async () => {
      mockFileManager.readFile.mockResolvedValue(null);

      const timer = await manager.getActiveTimer('category-1');

      expect(timer).toBeNull();
    });
  });

  describe('stopTimer', () => {
    it('deve parar o timer e retornar TimeEntry completo', async () => {
      const startTime = new Date(Date.now() - 60000).toISOString(); // 1 minuto atrás
      const existingTimer: ActiveTimerFile = {
        timer: {
          id: 'timer-1',
          categoryId: 'category-1',
          userId: 'user-1',
          startTime,
          deviceId: 'device-123',
          deviceName: 'Test Device',
          notes: 'Nota inicial',
          createdAt: startTime,
        },
        updatedAt: startTime,
      };
      mockFileManager.readFile.mockResolvedValue(existingTimer);

      const entry = await manager.stopTimer('category-1', mockDeviceInfo, 'Nota final');

      expect(entry).toMatchObject({
        id: 'timer-1',
        categoryId: 'category-1',
        userId: 'user-1',
        startTime,
        notes: 'Nota final',
      });
      expect(entry?.endTime).toBeDefined();
      expect(entry?.duration).toBeGreaterThanOrEqual(59); // ~60 segundos
      expect(mockFileManager.deleteFile).toHaveBeenCalledWith('active_timer_category-1.json');
    });

    it('deve retornar null se não houver timer ativo', async () => {
      mockFileManager.readFile.mockResolvedValue(null);

      const entry = await manager.stopTimer('category-1', mockDeviceInfo);

      expect(entry).toBeNull();
      expect(mockFileManager.deleteFile).not.toHaveBeenCalled();
    });

    it('deve manter nota original se nenhuma nova nota for fornecida', async () => {
      const existingTimer: ActiveTimerFile = {
        timer: {
          id: 'timer-1',
          categoryId: 'category-1',
          userId: 'user-1',
          startTime: new Date().toISOString(),
          deviceId: 'device-123',
          deviceName: 'Test Device',
          notes: 'Nota original',
          createdAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      };
      mockFileManager.readFile.mockResolvedValue(existingTimer);

      const entry = await manager.stopTimer('category-1', mockDeviceInfo);

      expect(entry?.notes).toBe('Nota original');
    });
  });

  describe('listActiveTimers', () => {
    it('deve listar todos os timers ativos', async () => {
      const timer1: ActiveTimerFile = {
        timer: {
          id: 'timer-1',
          categoryId: 'category-1',
          userId: 'user-1',
          startTime: new Date().toISOString(),
          deviceId: 'device-123',
          deviceName: 'Test Device',
          notes: null,
          createdAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      };
      const timer2: ActiveTimerFile = {
        timer: {
          id: 'timer-2',
          categoryId: 'category-2',
          userId: 'user-1',
          startTime: new Date().toISOString(),
          deviceId: 'device-456',
          deviceName: 'Other Device',
          notes: null,
          createdAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      };

      mockFileManager.listFiles.mockResolvedValue([
        { name: 'active_timer_category-1.json' },
        { name: 'active_timer_category-2.json' },
        { name: 'categories.json' }, // Deve ser ignorado
      ]);
      mockFileManager.readFile.mockResolvedValueOnce(timer1).mockResolvedValueOnce(timer2);

      const timers = await manager.listActiveTimers();

      expect(timers).toHaveLength(2);
      expect(timers[0].categoryId).toBe('category-1');
      expect(timers[1].categoryId).toBe('category-2');
    });

    it('deve retornar lista vazia se não houver timers', async () => {
      mockFileManager.listFiles.mockResolvedValue([]);

      const timers = await manager.listActiveTimers();

      expect(timers).toHaveLength(0);
    });
  });

  describe('cancelTimer', () => {
    it('deve cancelar timer sem criar TimeEntry', async () => {
      mockFileManager.deleteFile.mockResolvedValue(true);

      const result = await manager.cancelTimer('category-1');

      expect(result).toBe(true);
      expect(mockFileManager.deleteFile).toHaveBeenCalledWith('active_timer_category-1.json');
    });

    it('deve retornar false se não houver timer para cancelar', async () => {
      mockFileManager.deleteFile.mockResolvedValue(false);

      const result = await manager.cancelTimer('category-1');

      expect(result).toBe(false);
    });
  });

  describe('clearAllActiveTimers', () => {
    it('deve limpar todos os timers ativos', async () => {
      mockFileManager.listFiles.mockResolvedValue([
        { name: 'active_timer_category-1.json' },
        { name: 'active_timer_category-2.json' },
      ]);
      mockFileManager.readFile.mockResolvedValue({
        timer: {
          id: 'timer-1',
          categoryId: 'category-1',
          userId: 'user-1',
          startTime: new Date().toISOString(),
          deviceId: 'device-123',
          deviceName: 'Test',
          notes: null,
          createdAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      });

      const deletedCount = await manager.clearAllActiveTimers();

      expect(deletedCount).toBe(2);
      expect(mockFileManager.deleteFile).toHaveBeenCalledTimes(2);
    });
  });
});
