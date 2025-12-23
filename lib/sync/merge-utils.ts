/**
 * Utilitários para merge inteligente de dados durante sincronização
 */

import type { Category, TimeEntry } from '@/types';

/**
 * Resultado do merge de dados
 */
export interface MergeResult<T> {
  merged: T[];
  conflicts: Array<{
    local: T;
    remote: T;
    resolution: 'local' | 'remote' | 'combined';
  }>;
  stats: {
    localOnly: number;
    remoteOnly: number;
    merged: number;
    conflicts: number;
  };
}

/**
 * Faz merge inteligente de categorias entre dados locais e remotos
 */
export function mergeCategories(
  localCategories: Category[],
  remoteCategories: Category[]
): MergeResult<Category> {
  const merged: Category[] = [];
  const conflicts: Array<{
    local: Category;
    remote: Category;
    resolution: 'local' | 'remote' | 'combined';
  }> = [];

  const localMap = new Map(localCategories.map((cat) => [cat.id, cat]));
  const remoteMap = new Map(remoteCategories.map((cat) => [cat.id, cat]));

  const allIds = new Set([...Array.from(localMap.keys()), ...Array.from(remoteMap.keys())]);

  let localOnly = 0;
  let remoteOnly = 0;
  let mergedCount = 0;

  for (const id of Array.from(allIds)) {
    const local = localMap.get(id);
    const remote = remoteMap.get(id);

    if (local && remote) {
      // Ambos existem - verificar qual é mais recente
      const localTime = new Date(local.updatedAt).getTime();
      const remoteTime = new Date(remote.updatedAt).getTime();

      if (localTime > remoteTime) {
        // Local é mais recente
        merged.push(local);
        mergedCount++;
      } else if (remoteTime > localTime) {
        // Remote é mais recente
        merged.push(remote);
        mergedCount++;
      } else {
        // Mesmo timestamp - verificar se são diferentes
        if (JSON.stringify(local) !== JSON.stringify(remote)) {
          // Conflito - manter local por padrão, mas logar
          merged.push(local);
          conflicts.push({
            local,
            remote,
            resolution: 'local',
          });
        } else {
          // Idênticos
          merged.push(local);
          mergedCount++;
        }
      }
    } else if (local) {
      // Só existe local
      merged.push(local);
      localOnly++;
    } else if (remote) {
      // Só existe remoto
      merged.push(remote);
      remoteOnly++;
    }
  }

  return {
    merged,
    conflicts,
    stats: {
      localOnly,
      remoteOnly,
      merged: mergedCount,
      conflicts: conflicts.length,
    },
  };
}

/**
 * Faz merge inteligente de time entries entre dados locais e remotos
 */
export function mergeTimeEntries(
  localEntries: TimeEntry[],
  remoteEntries: TimeEntry[]
): MergeResult<TimeEntry> {
  const merged: TimeEntry[] = [];
  const conflicts: Array<{
    local: TimeEntry;
    remote: TimeEntry;
    resolution: 'local' | 'remote' | 'combined';
  }> = [];

  const localMap = new Map(localEntries.map((entry) => [entry.id, entry]));
  const remoteMap = new Map(remoteEntries.map((entry) => [entry.id, entry]));

  const allIds = new Set([...Array.from(localMap.keys()), ...Array.from(remoteMap.keys())]);

  let localOnly = 0;
  let remoteOnly = 0;
  let mergedCount = 0;

  for (const id of Array.from(allIds)) {
    const local = localMap.get(id);
    const remote = remoteMap.get(id);

    if (local && remote) {
      // Ambos existem - verificar qual é mais recente
      const localTime = new Date(local.updatedAt || local.createdAt).getTime();
      const remoteTime = new Date(remote.updatedAt || remote.createdAt).getTime();

      if (localTime > remoteTime) {
        // Local é mais recente
        merged.push(local);
        mergedCount++;
      } else if (remoteTime > localTime) {
        // Remote é mais recente
        merged.push(remote);
        mergedCount++;
      } else {
        // Mesmo timestamp - verificar se são diferentes
        if (JSON.stringify(local) !== JSON.stringify(remote)) {
          // Conflito - manter local por padrão
          merged.push(local);
          conflicts.push({
            local,
            remote,
            resolution: 'local',
          });
        } else {
          // Idênticos
          merged.push(local);
          mergedCount++;
        }
      }
    } else if (local) {
      // Só existe local
      merged.push(local);
      localOnly++;
    } else if (remote) {
      // Só existe remoto
      merged.push(remote);
      remoteOnly++;
    }
  }

  return {
    merged,
    conflicts,
    stats: {
      localOnly,
      remoteOnly,
      merged: mergedCount,
      conflicts: conflicts.length,
    },
  };
}

/**
 * Cria um hash simples dos dados para comparação
 */
export function createDataHash(data: { categories: Category[]; timeEntries: TimeEntry[] }): string {
  const sortedCategories = [...data.categories].sort((a, b) => a.id.localeCompare(b.id));
  const sortedEntries = [...data.timeEntries].sort((a, b) => a.id.localeCompare(b.id));

  return btoa(
    JSON.stringify({
      categories: sortedCategories.map((c) => ({ id: c.id, updatedAt: c.updatedAt })),
      timeEntries: sortedEntries.map((e) => ({ id: e.id, updatedAt: e.updatedAt || e.createdAt })),
    })
  );
}
