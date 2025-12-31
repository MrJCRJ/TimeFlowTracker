import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MuscleGroup } from '@/types/entries/workout';

const generateId = () => `template_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();

/**
 * Exercício salvo como template
 */
export interface ExerciseTemplate {
  id: string;
  name: string; // "Supino Reto", "Agachamento"
  muscleGroup: MuscleGroup;
  defaultSets: number; // Número padrão de séries
  defaultReps: number; // Número padrão de repetições
  defaultWeight?: number; // Peso padrão (kg)
  createdAt: string;
  updatedAt: string;
}

/**
 * Rotina de treino (conjunto de exercícios)
 */
export interface WorkoutRoutine {
  id: string;
  name: string; // "Treino A - Peito/Tríceps", "Leg Day"
  description?: string;
  exerciseIds: string[]; // IDs dos exercícios que fazem parte desta rotina
  createdAt: string;
  updatedAt: string;
}

export interface CreateExerciseTemplateInput {
  name: string;
  muscleGroup: MuscleGroup;
  defaultSets?: number;
  defaultReps?: number;
  defaultWeight?: number;
}

export interface UpdateExerciseTemplateInput {
  name?: string;
  muscleGroup?: MuscleGroup;
  defaultSets?: number;
  defaultReps?: number;
  defaultWeight?: number;
}

export interface CreateRoutineInput {
  name: string;
  description?: string;
  exerciseIds?: string[];
}

export interface UpdateRoutineInput {
  name?: string;
  description?: string;
  exerciseIds?: string[];
}

interface ExerciseTemplateStoreState {
  exercises: ExerciseTemplate[];
  routines: WorkoutRoutine[];
}

interface ExerciseTemplateStoreActions {
  // CRUD de Exercícios
  addExercise: (input: CreateExerciseTemplateInput) => ExerciseTemplate;
  updateExercise: (id: string, updates: UpdateExerciseTemplateInput) => void;
  deleteExercise: (id: string) => void;

  // CRUD de Rotinas
  addRoutine: (input: CreateRoutineInput) => WorkoutRoutine;
  updateRoutine: (id: string, updates: UpdateRoutineInput) => void;
  deleteRoutine: (id: string) => void;
  addExerciseToRoutine: (routineId: string, exerciseId: string) => void;
  removeExerciseFromRoutine: (routineId: string, exerciseId: string) => void;

  // Getters
  getExerciseById: (id: string) => ExerciseTemplate | undefined;
  getExercisesByMuscleGroup: (muscleGroup: MuscleGroup) => ExerciseTemplate[];
  getRoutineById: (id: string) => WorkoutRoutine | undefined;
  getRoutineExercises: (routineId: string) => ExerciseTemplate[];

  // Reset
  reset: () => void;
}

type ExerciseTemplateStore = ExerciseTemplateStoreState & ExerciseTemplateStoreActions;

const initialState: ExerciseTemplateStoreState = {
  exercises: [],
  routines: [],
};

export const useExerciseTemplateStore = create<ExerciseTemplateStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // === Exercícios ===

      addExercise: (input: CreateExerciseTemplateInput) => {
        const newExercise: ExerciseTemplate = {
          id: generateId(),
          name: input.name,
          muscleGroup: input.muscleGroup,
          defaultSets: input.defaultSets ?? 3,
          defaultReps: input.defaultReps ?? 12,
          defaultWeight: input.defaultWeight,
          createdAt: now(),
          updatedAt: now(),
        };

        set((state) => ({
          exercises: [...state.exercises, newExercise],
        }));

        return newExercise;
      },

      updateExercise: (id: string, updates: UpdateExerciseTemplateInput) => {
        set((state) => ({
          exercises: state.exercises.map((ex) =>
            ex.id === id
              ? {
                  ...ex,
                  ...updates,
                  updatedAt: now(),
                }
              : ex
          ),
        }));
      },

      deleteExercise: (id: string) => {
        set((state) => ({
          exercises: state.exercises.filter((ex) => ex.id !== id),
          // Também remover das rotinas
          routines: state.routines.map((routine) => ({
            ...routine,
            exerciseIds: routine.exerciseIds.filter((exId) => exId !== id),
          })),
        }));
      },

      // === Rotinas ===

      addRoutine: (input: CreateRoutineInput) => {
        const newRoutine: WorkoutRoutine = {
          id: generateId(),
          name: input.name,
          description: input.description,
          exerciseIds: input.exerciseIds ?? [],
          createdAt: now(),
          updatedAt: now(),
        };

        set((state) => ({
          routines: [...state.routines, newRoutine],
        }));

        return newRoutine;
      },

      updateRoutine: (id: string, updates: UpdateRoutineInput) => {
        set((state) => ({
          routines: state.routines.map((routine) =>
            routine.id === id
              ? {
                  ...routine,
                  ...updates,
                  updatedAt: now(),
                }
              : routine
          ),
        }));
      },

      deleteRoutine: (id: string) => {
        set((state) => ({
          routines: state.routines.filter((routine) => routine.id !== id),
        }));
      },

      addExerciseToRoutine: (routineId: string, exerciseId: string) => {
        set((state) => ({
          routines: state.routines.map((routine) =>
            routine.id === routineId
              ? {
                  ...routine,
                  exerciseIds: [...routine.exerciseIds, exerciseId],
                  updatedAt: now(),
                }
              : routine
          ),
        }));
      },

      removeExerciseFromRoutine: (routineId: string, exerciseId: string) => {
        set((state) => ({
          routines: state.routines.map((routine) =>
            routine.id === routineId
              ? {
                  ...routine,
                  exerciseIds: routine.exerciseIds.filter((id) => id !== exerciseId),
                  updatedAt: now(),
                }
              : routine
          ),
        }));
      },

      // === Getters ===

      getExerciseById: (id: string) => {
        return get().exercises.find((ex) => ex.id === id);
      },

      getExercisesByMuscleGroup: (muscleGroup: MuscleGroup) => {
        return get().exercises.filter((ex) => ex.muscleGroup === muscleGroup);
      },

      getRoutineById: (id: string) => {
        return get().routines.find((routine) => routine.id === id);
      },

      getRoutineExercises: (routineId: string) => {
        const routine = get().getRoutineById(routineId);
        if (!routine) return [];

        return routine.exerciseIds
          .map((id) => get().getExerciseById(id))
          .filter((ex): ex is ExerciseTemplate => ex !== undefined);
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'timeflow_exercise_templates',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
