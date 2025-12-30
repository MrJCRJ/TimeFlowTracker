/**
 * Tipos para Tarefas (Tasks)
 * Tarefas são itens de trabalho dentro de uma categoria
 */

export interface Task {
  id: string;
  name: string;
  categoryId: string;
  userId: string;
  description?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  name: string;
  categoryId: string;
  description?: string;
}

export interface UpdateTaskInput {
  name?: string;
  description?: string;
  isCompleted?: boolean;
}
