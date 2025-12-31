/**
 * Tipo: Tarefas
 * Usado por: Estudo, Outros
 *
 * Registro de tempo com lista de tarefas/atividades realizadas.
 */

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskEntry {
  id: string;
  categoryId: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  duration: number; // em segundos
  tasks: TaskItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
