/**
 * Tipo: Financeiro
 * Usado por: Trabalho
 *
 * Registro de horas trabalhadas com suporte a múltiplos trabalhos/projetos.
 * O valor/hora é CALCULADO automaticamente: totalEarnings / totalHoursWorked
 */

export interface WorkTask {
  id: string;
  text: string;
  completed: boolean;
}

/**
 * Registro de ganho único associado a um trabalho
 */
export interface Earning {
  id: string;
  amount: number; // Valor ganho em R$
  date: string; // ISO 8601
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
  earningId?: string; // Referência a um earning, se aplicável
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Configuração de trabalhos (armazenado separadamente no jobStore)
 * O valor/hora NÃO é mais definido manualmente - é CALCULADO
 */
export interface Job {
  id: string;
  name: string; // "Freelance", "Empresa X", "Projeto Y"
  color: string; // Cor para diferenciar nos gráficos
  isActive: boolean; // Se ainda está ativo
  earnings: Earning[]; // Lista de ganhos associados a este trabalho
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobInput {
  name: string;
  color: string;
}

export interface UpdateJobInput {
  name?: string;
  color?: string;
  isActive?: boolean;
}

export interface AddEarningInput {
  amount: number;
  date: string;
  description?: string;
}
