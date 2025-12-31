/**
 * Tipo: Financeiro
 * Usado por: Trabalho
 *
 * Registro de horas trabalhadas com suporte a múltiplos trabalhos/projetos.
 */

export interface WorkTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface WorkEarnings {
  amount: number; // Valor ganho
  description?: string; // Descrição opcional
}

export interface WorkEntry {
  id: string;
  categoryId: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  duration: number; // em segundos
  jobId: string; // Referência ao trabalho
  tasks?: WorkTask[];
  earnings?: WorkEarnings;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Configuração de trabalhos (armazenado separadamente no jobStore)
 */
export interface Job {
  id: string;
  name: string; // "Freelance", "Empresa X", "Projeto Y"
  hourlyRate?: number; // Valor por hora (opcional)
  color: string; // Cor para diferenciar nos gráficos
  isActive: boolean; // Se ainda está ativo
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobInput {
  name: string;
  hourlyRate?: number;
  color: string;
}

export interface UpdateJobInput {
  name?: string;
  hourlyRate?: number;
  color?: string;
  isActive?: boolean;
}
