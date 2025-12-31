'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Plus,
  X,
  Check,
  ChevronUp,
  ChevronDown,
  Dumbbell,
  Trash2,
  GripVertical,
} from 'lucide-react';
import type { WorkoutExercise, WorkoutSet, MuscleGroup } from '@/types/entries/workout';
import { MUSCLE_GROUP_LABELS } from '@/types/entries/workout';
import { AutocompleteInput } from '@/components/ui/AutocompleteInput';
import { useAutocompleteStore } from '@/stores/autocompleteStore';

interface WorkoutEntryPanelProps {
  categoryColor: string;
  exercises: WorkoutExercise[];
  onExercisesChange: (exercises: WorkoutExercise[]) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  className?: string;
}

const generateId = () => `ex_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

/**
 * Painel para categoria Treino
 * Permite adicionar exercícios com séries, reps e peso
 */
export function WorkoutEntryPanel({
  categoryColor,
  exercises,
  onExercisesChange,
  isExpanded,
  onToggleExpand,
  className,
}: WorkoutEntryPanelProps) {
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newMuscleGroup, setNewMuscleGroup] = useState<MuscleGroup>('chest');
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  // Autocomplete store
  const { getExerciseSuggestions, addExerciseName } = useAutocompleteStore();

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );

  // Adicionar novo exercício
  const handleAddExercise = useCallback(() => {
    if (!newExerciseName.trim()) return;

    const exerciseName = newExerciseName.trim();

    const newExercise: WorkoutExercise = {
      id: generateId(),
      name: exerciseName,
      muscleGroup: newMuscleGroup,
      sets: [{ id: generateId(), reps: 12, weight: undefined, completed: false }],
    };

    onExercisesChange([...exercises, newExercise]);

    // Salvar no histórico para autocomplete
    addExerciseName(exerciseName);

    setNewExerciseName('');
    setNewMuscleGroup('chest');
    setIsAddingExercise(false);
    setExpandedExercise(newExercise.id);
  }, [newExerciseName, newMuscleGroup, exercises, onExercisesChange, addExerciseName]);

  // Remover exercício
  const handleRemoveExercise = useCallback(
    (exerciseId: string) => {
      onExercisesChange(exercises.filter((ex) => ex.id !== exerciseId));
    },
    [exercises, onExercisesChange]
  );

  // Adicionar série a um exercício
  const handleAddSet = useCallback(
    (exerciseId: string) => {
      onExercisesChange(
        exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          const lastSet = ex.sets[ex.sets.length - 1];
          return {
            ...ex,
            sets: [
              ...ex.sets,
              {
                id: generateId(),
                reps: lastSet?.reps || 12,
                weight: lastSet?.weight,
                completed: false,
              },
            ],
          };
        })
      );
    },
    [exercises, onExercisesChange]
  );

  // Remover série
  const handleRemoveSet = useCallback(
    (exerciseId: string, setId: string) => {
      onExercisesChange(
        exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.filter((s) => s.id !== setId),
          };
        })
      );
    },
    [exercises, onExercisesChange]
  );

  // Atualizar série
  const handleUpdateSet = useCallback(
    (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
      onExercisesChange(
        exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s)),
          };
        })
      );
    },
    [exercises, onExercisesChange]
  );

  // Toggle completar série
  const handleToggleSet = useCallback(
    (exerciseId: string, setId: string) => {
      onExercisesChange(
        exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => (s.id === setId ? { ...s, completed: !s.completed } : s)),
          };
        })
      );
    },
    [exercises, onExercisesChange]
  );

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border transition-all duration-200',
        'bg-card/50 backdrop-blur-sm',
        className
      )}
      style={{ borderColor: `${categoryColor}30` }}
    >
      {/* Header colapsável */}
      <button
        type="button"
        onClick={onToggleExpand}
        className={cn(
          'flex w-full items-center justify-between px-3 py-2',
          'transition-colors hover:bg-muted/50',
          'text-left'
        )}
      >
        <div className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4" style={{ color: categoryColor }} />
          <span className="text-sm font-medium">Exercícios</span>
          {totalSets > 0 && (
            <span
              className="rounded-full px-1.5 py-0.5 text-xs"
              style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
            >
              {completedSets}/{totalSets} séries
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Conteúdo expandível */}
      {isExpanded && (
        <div className="space-y-3 border-t border-border/50 px-3 pb-3">
          {/* Lista de exercícios */}
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="mt-3 overflow-hidden rounded-lg border border-border/50"
            >
              {/* Header do exercício */}
              <div
                className="flex cursor-pointer items-center justify-between bg-muted/30 px-3 py-2"
                onClick={() =>
                  setExpandedExercise(expandedExercise === exercise.id ? null : exercise.id)
                }
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                  <div>
                    <p className="text-sm font-medium">{exercise.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {MUSCLE_GROUP_LABELS[exercise.muscleGroup]} ·{' '}
                      {exercise.sets.filter((s) => s.completed).length}/{exercise.sets.length}{' '}
                      séries
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveExercise(exercise.id);
                    }}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {expandedExercise === exercise.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Séries do exercício */}
              {expandedExercise === exercise.id && (
                <div className="space-y-2 p-2">
                  {/* Header das colunas */}
                  <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 px-2 text-xs text-muted-foreground">
                    <span className="w-5" />
                    <span>Reps</span>
                    <span>Peso (kg)</span>
                    <span className="w-8" />
                  </div>

                  {/* Lista de séries */}
                  {exercise.sets.map((set, _index) => (
                    <div
                      key={set.id}
                      className={cn(
                        'grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2',
                        'rounded-md px-2 py-1.5',
                        set.completed ? 'bg-primary/10' : 'bg-muted/50'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleSet(exercise.id, set.id)}
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded',
                          'border transition-colors',
                          set.completed
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/30 hover:border-primary'
                        )}
                      >
                        {set.completed && <Check className="h-3 w-3" />}
                      </button>
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) =>
                          handleUpdateSet(exercise.id, set.id, {
                            reps: parseInt(e.target.value) || 0,
                          })
                        }
                        className={cn(
                          'w-full rounded px-2 py-1 text-center text-sm',
                          'border border-input bg-background',
                          'focus:outline-none focus:ring-1 focus:ring-primary'
                        )}
                        min={1}
                        max={100}
                      />
                      <input
                        type="number"
                        value={set.weight || ''}
                        onChange={(e) =>
                          handleUpdateSet(exercise.id, set.id, {
                            weight: e.target.value ? parseFloat(e.target.value) : undefined,
                          })
                        }
                        placeholder="-"
                        className={cn(
                          'w-full rounded px-2 py-1 text-center text-sm',
                          'border border-input bg-background',
                          'focus:outline-none focus:ring-1 focus:ring-primary'
                        )}
                        min={0}
                        step={0.5}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSet(exercise.id, set.id)}
                        disabled={exercise.sets.length <= 1}
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded',
                          'text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
                          'disabled:cursor-not-allowed disabled:opacity-30',
                          'transition-colors'
                        )}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {/* Adicionar série */}
                  <button
                    type="button"
                    onClick={() => handleAddSet(exercise.id)}
                    className={cn(
                      'flex w-full items-center justify-center gap-1 rounded py-1.5',
                      'text-xs text-muted-foreground',
                      'border border-dashed border-muted-foreground/30',
                      'hover:border-primary hover:text-primary',
                      'transition-colors'
                    )}
                  >
                    <Plus className="h-3 w-3" />
                    Série
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Adicionar exercício */}
          {isAddingExercise ? (
            <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/30 p-3">
              <AutocompleteInput
                value={newExerciseName}
                onChange={setNewExerciseName}
                onSubmit={handleAddExercise}
                suggestions={getExerciseSuggestions(newExerciseName)}
                placeholder="Nome do exercício..."
                inputClassName="py-2"
              />
              <select
                value={newMuscleGroup}
                onChange={(e) => setNewMuscleGroup(e.target.value as MuscleGroup)}
                className={cn(
                  'w-full rounded-md px-3 py-2 text-sm',
                  'border border-input bg-background',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50'
                )}
              >
                {Object.entries(MUSCLE_GROUP_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddExercise}
                  disabled={!newExerciseName.trim()}
                  className={cn(
                    'flex-1 rounded-md px-3 py-2 text-sm font-medium',
                    'bg-primary text-primary-foreground',
                    'hover:bg-primary/90 disabled:opacity-50',
                    'transition-colors'
                  )}
                >
                  Adicionar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingExercise(false);
                    setNewExerciseName('');
                  }}
                  className={cn('rounded-md px-3 py-2 text-sm', 'transition-colors hover:bg-muted')}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingExercise(true)}
              className={cn(
                'mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5',
                'text-sm text-muted-foreground',
                'border border-dashed border-muted-foreground/30',
                'hover:border-primary hover:bg-primary/5 hover:text-primary',
                'transition-colors'
              )}
            >
              <Plus className="h-4 w-4" />
              Adicionar exercício
            </button>
          )}
        </div>
      )}
    </div>
  );
}
