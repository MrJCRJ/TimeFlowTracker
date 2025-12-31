/**
 * Tipo: Datado
 * Usado por: Compromissos
 *
 * Tarefas e compromissos com data, suporte a subtarefas e recorrência.
 * Integrado com o timer para trackear tempo gasto em compromissos.
 */

export type CommitmentType =
  | 'bill' // Contas a pagar
  | 'financial' // Depositar, transferir
  | 'shopping' // Compras
  | 'birthday' // Aniversários
  | 'event' // Eventos
  | 'appointment' // Compromissos
  | 'task'; // Tarefa geral

export const COMMITMENT_TYPE_LABELS: Record<CommitmentType, string> = {
  bill: 'Conta a pagar',
  financial: 'Financeiro',
  shopping: 'Compras',
  birthday: 'Aniversário',
  event: 'Evento',
  appointment: 'Compromisso',
  task: 'Tarefa',
};

export const COMMITMENT_TYPE_ICONS: Record<CommitmentType, string> = {
  bill: 'receipt',
  financial: 'banknote',
  shopping: 'shopping-cart',
  birthday: 'cake',
  event: 'calendar-days',
  appointment: 'clock',
  task: 'check-square',
};

export type Priority = 'low' | 'medium' | 'high';

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
}

export interface Recurrence {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // A cada X dias/semanas/meses
  endDate?: string; // Data fim (opcional)
}

/**
 * Item de compromisso (tarefa datada)
 */
export interface Commitment {
  id: string;
  categoryId: string;
  type: CommitmentType;
  title: string; // "Pagar conta de luz", "Aniversário do João"
  description?: string;
  dueDate: string; // Data do compromisso (ISO 8601)
  dueTime?: string; // Horário (HH:mm, opcional)
  completed: boolean;
  completedAt?: string;
  subtasks?: Subtask[];
  recurrence?: Recurrence;
  reminder: boolean; // Lembrete ativado
  priority: Priority;
  createdAt: string;
  updatedAt: string;
}

/**
 * Entrada de tempo gasto em um compromisso (quando usa o timer)
 */
export interface CommitmentEntry {
  id: string;
  categoryId: string;
  commitmentId: string; // Referência ao compromisso
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  duration: number; // em segundos
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommitmentInput {
  type: CommitmentType;
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  subtasks?: Omit<Subtask, 'id' | 'completed' | 'completedAt'>[];
  recurrence?: Recurrence;
  reminder?: boolean;
  priority?: Priority;
}

export interface UpdateCommitmentInput {
  type?: CommitmentType;
  title?: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  completed?: boolean;
  subtasks?: Subtask[];
  recurrence?: Recurrence;
  reminder?: boolean;
  priority?: Priority;
}
