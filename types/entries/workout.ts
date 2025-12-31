/**
 * Tipo: Treino
 * Usado por: Treino
 *
 * Registro de exercícios com séries, repetições e peso.
 */

export type MuscleGroup =
  | 'chest' // Peito
  | 'back' // Costas
  | 'shoulders' // Ombros
  | 'biceps' // Bíceps
  | 'triceps' // Tríceps
  | 'legs' // Pernas
  | 'glutes' // Glúteos
  | 'abs' // Abdômen
  | 'cardio' // Cardio
  | 'full-body'; // Corpo todo

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Peito',
  back: 'Costas',
  shoulders: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  legs: 'Pernas',
  glutes: 'Glúteos',
  abs: 'Abdômen',
  cardio: 'Cardio',
  'full-body': 'Corpo todo',
};

export interface WorkoutSet {
  id: string;
  reps: number; // repetições
  weight?: number; // kg (opcional para exercícios sem peso)
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  name: string; // "Supino Reto", "Agachamento"
  muscleGroup: MuscleGroup;
  sets: WorkoutSet[];
}

export interface WorkoutEntry {
  id: string;
  categoryId: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  duration: number; // em segundos
  exercises: WorkoutExercise[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
