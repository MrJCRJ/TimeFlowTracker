import { z } from 'zod';
import { MAX_CATEGORY_NAME_LENGTH, MAX_NOTE_LENGTH } from './constants';

/**
 * Schema de validação para Categoria
 */
export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(MAX_CATEGORY_NAME_LENGTH, `Nome deve ter no máximo ${MAX_CATEGORY_NAME_LENGTH} caracteres`)
    .trim(),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor inválida. Use formato hex (#RRGGBB)'),
  icon: z.string().min(1, 'Ícone é obrigatório'),
});

export type CategoryInput = z.infer<typeof categorySchema>;

/**
 * Schema de validação para Time Entry
 */
export const timeEntrySchema = z.object({
  categoryId: z.string().uuid('ID de categoria inválido'),
  notes: z
    .string()
    .max(MAX_NOTE_LENGTH, `Notas devem ter no máximo ${MAX_NOTE_LENGTH} caracteres`)
    .optional()
    .nullable(),
  startTime: z.string().datetime('Data de início inválida').optional(),
  endTime: z.string().datetime('Data de fim inválida').optional().nullable(),
});

export type TimeEntryInput = z.infer<typeof timeEntrySchema>;

/**
 * Schema de validação para Preferências do Usuário
 */
export const workHoursSchema = z.object({
  start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'),
  end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'),
});

export const userPreferencesSchema = z.object({
  workHours: workHoursSchema.optional(),
  dailyGoals: z.record(z.string(), z.number().min(0)).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  notifications: z.boolean().optional(),
  autoSync: z.boolean().optional(),
  syncInterval: z.number().min(1).max(60).optional(),
});

export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;

/**
 * Schema para iniciar timer
 */
export const startTimerSchema = z.object({
  categoryId: z.string().uuid('ID de categoria inválido'),
  notes: z
    .string()
    .max(MAX_NOTE_LENGTH, `Notas devem ter no máximo ${MAX_NOTE_LENGTH} caracteres`)
    .optional(),
});

export type StartTimerInput = z.infer<typeof startTimerSchema>;

/**
 * Schema para parar timer
 */
export const stopTimerSchema = z.object({
  notes: z
    .string()
    .max(MAX_NOTE_LENGTH, `Notas devem ter no máximo ${MAX_NOTE_LENGTH} caracteres`)
    .optional(),
});

export type StopTimerInput = z.infer<typeof stopTimerSchema>;

/**
 * Função helper para validar dados com schema
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
  return { success: false, errors };
}

/**
 * Sanitiza string para prevenir XSS
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
