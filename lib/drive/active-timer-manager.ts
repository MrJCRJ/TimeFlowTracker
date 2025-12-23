import { drive_v3 } from 'googleapis';
import { DriveFolderManager } from './folder-manager';
import { DriveFileManager } from './file-manager';
import { generateId, now, diffInSeconds } from '../utils';
import type { ActiveTimerRecord, ActiveTimerFile, DeviceInfo, TimeEntry } from '@/types';

/**
 * Gerenciador de Timers Ativos no Google Drive
 *
 * Este módulo implementa um sistema de sincronização de timers entre dispositivos
 * usando arquivos de registro no Google Drive.
 *
 * Fluxo:
 * 1. Ao INICIAR timer: Cria arquivo active_timer_{categoryId}.json com deviceId e timestamp
 * 2. Ao PARAR timer: Lê arquivo, calcula duração, cria TimeEntry, apaga arquivo
 *
 * Isso permite que:
 * - Dispositivo A inicie um timer
 * - Dispositivo B pare o timer (mesmo sem sincronização prévia)
 * - Múltiplos timers de categorias diferentes rodem simultaneamente
 */
export class ActiveTimerManager {
  private fileManager: DriveFileManager;

  constructor(
    _drive: drive_v3.Drive,
    _folderManager: DriveFolderManager,
    fileManager: DriveFileManager
  ) {
    this.fileManager = fileManager;
  }

  /**
   * Gera nome do arquivo de timer ativo para uma categoria
   */
  private getTimerFileName(categoryId: string): string {
    return `active_timer_${categoryId}.json`;
  }

  /**
   * Registra início de um timer no Drive
   */
  async registerTimerStart(
    categoryId: string,
    userId: string,
    deviceInfo: DeviceInfo,
    notes?: string
  ): Promise<ActiveTimerRecord> {
    const timerFileName = this.getTimerFileName(categoryId);

    // Verifica se já existe um timer ativo para esta categoria
    const existingTimer = await this.getActiveTimer(categoryId);
    if (existingTimer) {
      throw new Error(
        `Já existe um timer ativo para esta categoria. ` +
          `Iniciado por: ${existingTimer.deviceName} em ${new Date(existingTimer.startTime).toLocaleString()}`
      );
    }

    const record: ActiveTimerRecord = {
      id: generateId(),
      categoryId,
      userId,
      startTime: now(),
      deviceId: deviceInfo.deviceId,
      deviceName: deviceInfo.deviceName,
      notes: notes ?? null,
      createdAt: now(),
    };

    const fileData: ActiveTimerFile = {
      timer: record,
      updatedAt: now(),
    };

    await this.fileManager.writeFile(timerFileName, fileData);
    console.log(
      `[ActiveTimerManager] Timer registrado para categoria ${categoryId} por ${deviceInfo.deviceName}`
    );

    return record;
  }

  /**
   * Obtém timer ativo de uma categoria
   */
  async getActiveTimer(categoryId: string): Promise<ActiveTimerRecord | null> {
    const timerFileName = this.getTimerFileName(categoryId);

    try {
      const data = await this.fileManager.readFile<ActiveTimerFile>(timerFileName);
      return data?.timer ?? null;
    } catch (error) {
      console.error(`[ActiveTimerManager] Erro ao ler timer ativo:`, error);
      return null;
    }
  }

  /**
   * Lista todos os timers ativos no Drive
   */
  async listActiveTimers(): Promise<ActiveTimerRecord[]> {
    try {
      const files = await this.fileManager.listFiles();
      const activeTimerFiles = files.filter(
        (f) => f.name?.startsWith('active_timer_') && f.name?.endsWith('.json')
      );

      const timers: ActiveTimerRecord[] = [];

      for (const file of activeTimerFiles) {
        if (file.name) {
          try {
            const data = await this.fileManager.readFile<ActiveTimerFile>(file.name);
            if (data?.timer) {
              timers.push(data.timer);
            }
          } catch {
            console.error(`[ActiveTimerManager] Erro ao ler arquivo ${file.name}`);
          }
        }
      }

      return timers;
    } catch (error) {
      console.error('[ActiveTimerManager] Erro ao listar timers ativos:', error);
      return [];
    }
  }

  /**
   * Finaliza um timer e retorna o TimeEntry completo
   */
  async stopTimer(
    categoryId: string,
    deviceInfo: DeviceInfo,
    notes?: string
  ): Promise<TimeEntry | null> {
    const timerFileName = this.getTimerFileName(categoryId);

    // Busca o timer ativo
    const activeTimer = await this.getActiveTimer(categoryId);

    if (!activeTimer) {
      console.warn(
        `[ActiveTimerManager] Nenhum timer ativo encontrado para categoria ${categoryId}`
      );
      return null;
    }

    const endTime = now();
    const duration = diffInSeconds(activeTimer.startTime, endTime);

    // Cria o TimeEntry completo
    const timeEntry: TimeEntry = {
      id: activeTimer.id,
      categoryId: activeTimer.categoryId,
      userId: activeTimer.userId,
      startTime: activeTimer.startTime,
      endTime,
      duration,
      notes: notes ?? activeTimer.notes,
      createdAt: activeTimer.createdAt,
      updatedAt: endTime,
    };

    // Remove o arquivo de registro do Drive
    try {
      await this.fileManager.deleteFile(timerFileName);
      console.log(
        `[ActiveTimerManager] Timer finalizado. ` +
          `Categoria: ${categoryId}, ` +
          `Iniciado por: ${activeTimer.deviceName}, ` +
          `Finalizado por: ${deviceInfo.deviceName}, ` +
          `Duração: ${duration}s`
      );
    } catch (error) {
      console.error('[ActiveTimerManager] Erro ao deletar arquivo de timer:', error);
      // Continua mesmo se falhar ao deletar, pois o TimeEntry já foi criado
    }

    return timeEntry;
  }

  /**
   * Cancela um timer sem registrar entrada
   */
  async cancelTimer(categoryId: string): Promise<boolean> {
    const timerFileName = this.getTimerFileName(categoryId);

    try {
      const deleted = await this.fileManager.deleteFile(timerFileName);
      if (deleted) {
        console.log(`[ActiveTimerManager] Timer cancelado para categoria ${categoryId}`);
      }
      return deleted;
    } catch (error) {
      console.error('[ActiveTimerManager] Erro ao cancelar timer:', error);
      return false;
    }
  }

  /**
   * Verifica se há timer ativo para o usuário em qualquer categoria
   */
  async hasAnyActiveTimer(userId: string): Promise<boolean> {
    const timers = await this.listActiveTimers();
    return timers.some((t) => t.userId === userId);
  }

  /**
   * Limpa todos os timers ativos do usuário (útil para reset)
   */
  async clearAllActiveTimers(): Promise<number> {
    const timers = await this.listActiveTimers();
    let deletedCount = 0;

    for (const timer of timers) {
      try {
        await this.cancelTimer(timer.categoryId);
        deletedCount++;
      } catch (error) {
        console.error(`[ActiveTimerManager] Erro ao limpar timer ${timer.id}:`, error);
      }
    }

    return deletedCount;
  }
}
