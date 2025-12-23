import type { Category, TimeEntry } from '@/types';

/**
 * Gera hash simples dos dados para comparação rápida
 */
export function generateDataHash(data: {
  categories: Category[];
  timeEntries: TimeEntry[];
  activeTimerId?: string | null;
}): string {
  const str = JSON.stringify({
    c: data.categories.map((c) => `${c.id}:${c.name}:${c.color}`).sort(),
    t: data.timeEntries.map((t) => `${t.id}:${t.startTime}:${t.endTime || ''}`).sort(),
    a: data.activeTimerId || '',
  });

  // Hash simples usando soma de caracteres
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Converte para 32bit integer
  }
  return hash.toString(36);
}
