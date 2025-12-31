/**
 * Tipo: Simples
 * Usado por: Sono, Lazer, Casa
 *
 * Timer básico com checklist opcional para anotar atividades.
 */

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface SimpleEntry {
  id: string;
  categoryId: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  duration: number; // em segundos
  checklist?: ChecklistItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
