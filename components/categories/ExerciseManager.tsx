'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Edit2,
  X,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  List,
  Check,
} from 'lucide-react';
import { useExerciseTemplateStore, type ExerciseTemplate } from '@/stores/exerciseTemplateStore';
import { MUSCLE_GROUP_LABELS, type MuscleGroup } from '@/types/entries/workout';

interface ExerciseManagerProps {
  categoryColor?: string;
  className?: string;
}

type TabType = 'exercises' | 'routines';

const MUSCLE_GROUPS = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[];

/**
 * Componente para gerenciar exercícios e rotinas de treino
 * Usado na página de Categorias para a categoria Treino
 */
export function ExerciseManager({ className }: ExerciseManagerProps) {
  const {
    exercises,
    routines,
    addExercise,
    updateExercise,
    deleteExercise,
    addRoutine,
    deleteRoutine,
    addExerciseToRoutine,
    removeExerciseFromRoutine,
    getRoutineExercises,
  } = useExerciseTemplateStore();

  const [activeTab, setActiveTab] = useState<TabType>('exercises');
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [isAddingRoutine, setIsAddingRoutine] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);
  const [selectingExercisesForRoutine, setSelectingExercisesForRoutine] = useState<string | null>(
    null
  );

  // Form states para novo exercício
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState<MuscleGroup>('chest');
  const [newExerciseSets, setNewExerciseSets] = useState('3');
  const [newExerciseReps, setNewExerciseReps] = useState('12');
  const [newExerciseWeight, setNewExerciseWeight] = useState('');

  // Form states para nova rotina
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDescription, setNewRoutineDescription] = useState('');

  const resetExerciseForm = () => {
    setNewExerciseName('');
    setNewExerciseMuscle('chest');
    setNewExerciseSets('3');
    setNewExerciseReps('12');
    setNewExerciseWeight('');
    setIsAddingExercise(false);
    setEditingExerciseId(null);
  };

  const resetRoutineForm = () => {
    setNewRoutineName('');
    setNewRoutineDescription('');
    setIsAddingRoutine(false);
  };

  const handleAddExercise = () => {
    if (!newExerciseName.trim()) return;

    addExercise({
      name: newExerciseName.trim(),
      muscleGroup: newExerciseMuscle,
      defaultSets: parseInt(newExerciseSets) || 3,
      defaultReps: parseInt(newExerciseReps) || 12,
      defaultWeight: newExerciseWeight ? parseFloat(newExerciseWeight) : undefined,
    });

    resetExerciseForm();
  };

  const handleUpdateExercise = (id: string) => {
    if (!newExerciseName.trim()) return;

    updateExercise(id, {
      name: newExerciseName.trim(),
      muscleGroup: newExerciseMuscle,
      defaultSets: parseInt(newExerciseSets) || 3,
      defaultReps: parseInt(newExerciseReps) || 12,
      defaultWeight: newExerciseWeight ? parseFloat(newExerciseWeight) : undefined,
    });

    resetExerciseForm();
  };

  const handleStartEditExercise = (exercise: ExerciseTemplate) => {
    setNewExerciseName(exercise.name);
    setNewExerciseMuscle(exercise.muscleGroup);
    setNewExerciseSets(exercise.defaultSets.toString());
    setNewExerciseReps(exercise.defaultReps.toString());
    setNewExerciseWeight(exercise.defaultWeight?.toString() ?? '');
    setEditingExerciseId(exercise.id);
  };

  const handleAddRoutine = () => {
    if (!newRoutineName.trim()) return;

    const routine = addRoutine({
      name: newRoutineName.trim(),
      description: newRoutineDescription.trim() || undefined,
    });

    resetRoutineForm();
    setExpandedRoutineId(routine.id);
    setSelectingExercisesForRoutine(routine.id);
  };

  const handleToggleExerciseInRoutine = (routineId: string, exerciseId: string) => {
    const routine = routines.find((r) => r.id === routineId);
    if (!routine) return;

    if (routine.exerciseIds.includes(exerciseId)) {
      removeExerciseFromRoutine(routineId, exerciseId);
    } else {
      addExerciseToRoutine(routineId, exerciseId);
    }
  };

  // Agrupar exercícios por grupo muscular
  const exercisesByMuscleGroup = MUSCLE_GROUPS.reduce(
    (acc, group) => {
      acc[group] = exercises.filter((ex) => ex.muscleGroup === group);
      return acc;
    },
    {} as Record<MuscleGroup, ExerciseTemplate[]>
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('exercises')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            activeTab === 'exercises'
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Dumbbell className="h-4 w-4" />
          Exercícios ({exercises.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('routines')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            activeTab === 'routines'
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <List className="h-4 w-4" />
          Rotinas ({routines.length})
        </button>
      </div>

      {/* Tab: Exercícios */}
      {activeTab === 'exercises' && (
        <div className="space-y-4">
          {/* Formulário de adicionar/editar exercício */}
          {(isAddingExercise || editingExerciseId) && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-medium">
                  {editingExerciseId ? 'Editar Exercício' : 'Novo Exercício'}
                </h4>
                <button
                  type="button"
                  onClick={resetExerciseForm}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  placeholder="Nome do exercício..."
                  className={cn(
                    'w-full rounded-md px-3 py-2 text-sm',
                    'border border-input bg-background',
                    'focus:outline-none focus:ring-2 focus:ring-primary/50'
                  )}
                  autoFocus
                />

                <select
                  value={newExerciseMuscle}
                  onChange={(e) => setNewExerciseMuscle(e.target.value as MuscleGroup)}
                  className={cn(
                    'w-full rounded-md px-3 py-2 text-sm',
                    'border border-input bg-background',
                    'focus:outline-none focus:ring-2 focus:ring-primary/50'
                  )}
                >
                  {MUSCLE_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {MUSCLE_GROUP_LABELS[group]}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Séries</label>
                    <input
                      type="number"
                      value={newExerciseSets}
                      onChange={(e) => setNewExerciseSets(e.target.value)}
                      className={cn(
                        'w-full rounded-md px-3 py-2 text-sm',
                        'border border-input bg-background',
                        'focus:outline-none focus:ring-2 focus:ring-primary/50'
                      )}
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Reps</label>
                    <input
                      type="number"
                      value={newExerciseReps}
                      onChange={(e) => setNewExerciseReps(e.target.value)}
                      className={cn(
                        'w-full rounded-md px-3 py-2 text-sm',
                        'border border-input bg-background',
                        'focus:outline-none focus:ring-2 focus:ring-primary/50'
                      )}
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Peso (kg)</label>
                    <input
                      type="number"
                      value={newExerciseWeight}
                      onChange={(e) => setNewExerciseWeight(e.target.value)}
                      placeholder="Opcional"
                      className={cn(
                        'w-full rounded-md px-3 py-2 text-sm',
                        'border border-input bg-background',
                        'focus:outline-none focus:ring-2 focus:ring-primary/50'
                      )}
                      min={0}
                      step={0.5}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    editingExerciseId
                      ? handleUpdateExercise(editingExerciseId)
                      : handleAddExercise()
                  }
                  disabled={!newExerciseName.trim()}
                  className={cn(
                    'w-full rounded-md px-4 py-2 text-sm font-medium',
                    'bg-primary text-primary-foreground',
                    'hover:bg-primary/90 disabled:opacity-50',
                    'transition-colors'
                  )}
                >
                  {editingExerciseId ? 'Salvar Alterações' : 'Adicionar Exercício'}
                </button>
              </div>
            </div>
          )}

          {/* Lista de exercícios por grupo muscular */}
          {exercises.length === 0 ? (
            <div className="py-8 text-center">
              <Dumbbell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Nenhum exercício cadastrado ainda.
                <br />
                Adicione exercícios para usar como templates nos seus treinos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {MUSCLE_GROUPS.filter((group) => exercisesByMuscleGroup[group].length > 0).map(
                (group) => (
                  <div key={group}>
                    <h5 className="mb-2 text-xs font-medium text-muted-foreground">
                      {MUSCLE_GROUP_LABELS[group]}
                    </h5>
                    <div className="space-y-1">
                      {exercisesByMuscleGroup[group].map((exercise) => (
                        <div
                          key={exercise.id}
                          className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
                        >
                          <div>
                            <p className="font-medium">{exercise.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {exercise.defaultSets}x{exercise.defaultReps}
                              {exercise.defaultWeight && ` · ${exercise.defaultWeight}kg`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditExercise(exercise)}
                              className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteExercise(exercise.id)}
                              className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Botão de adicionar */}
          {!isAddingExercise && !editingExerciseId && (
            <button
              type="button"
              onClick={() => setIsAddingExercise(true)}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-lg py-2',
                'text-sm text-muted-foreground',
                'border border-dashed border-muted-foreground/30',
                'hover:border-primary hover:text-primary',
                'transition-colors'
              )}
            >
              <Plus className="h-4 w-4" />
              Adicionar exercício
            </button>
          )}
        </div>
      )}

      {/* Tab: Rotinas */}
      {activeTab === 'routines' && (
        <div className="space-y-4">
          {/* Formulário de adicionar rotina */}
          {isAddingRoutine && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-medium">Nova Rotina</h4>
                <button
                  type="button"
                  onClick={resetRoutineForm}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={newRoutineName}
                  onChange={(e) => setNewRoutineName(e.target.value)}
                  placeholder="Nome da rotina (ex: Treino A - Peito)"
                  className={cn(
                    'w-full rounded-md px-3 py-2 text-sm',
                    'border border-input bg-background',
                    'focus:outline-none focus:ring-2 focus:ring-primary/50'
                  )}
                  autoFocus
                />

                <input
                  type="text"
                  value={newRoutineDescription}
                  onChange={(e) => setNewRoutineDescription(e.target.value)}
                  placeholder="Descrição (opcional)"
                  className={cn(
                    'w-full rounded-md px-3 py-2 text-sm',
                    'border border-input bg-background',
                    'focus:outline-none focus:ring-2 focus:ring-primary/50'
                  )}
                />

                <button
                  type="button"
                  onClick={handleAddRoutine}
                  disabled={!newRoutineName.trim()}
                  className={cn(
                    'w-full rounded-md px-4 py-2 text-sm font-medium',
                    'bg-primary text-primary-foreground',
                    'hover:bg-primary/90 disabled:opacity-50',
                    'transition-colors'
                  )}
                >
                  Criar Rotina
                </button>
              </div>
            </div>
          )}

          {/* Lista de rotinas */}
          {routines.length === 0 ? (
            <div className="py-8 text-center">
              <List className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Nenhuma rotina cadastrada ainda.
                <br />
                Crie rotinas para organizar seus exercícios em treinos.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {routines.map((routine) => {
                const routineExercises = getRoutineExercises(routine.id);
                const isExpanded = expandedRoutineId === routine.id;
                const isSelectingExercises = selectingExercisesForRoutine === routine.id;

                return (
                  <div key={routine.id} className="overflow-hidden rounded-lg border border-border">
                    {/* Header da rotina */}
                    <button
                      type="button"
                      onClick={() => setExpandedRoutineId(isExpanded ? null : routine.id)}
                      className="flex w-full items-center justify-between bg-muted/30 px-4 py-3 text-left"
                    >
                      <div>
                        <p className="font-medium">{routine.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {routineExercises.length} exercício
                          {routineExercises.length !== 1 && 's'}
                          {routine.description && ` · ${routine.description}`}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    {/* Conteúdo expandido */}
                    {isExpanded && (
                      <div className="border-t border-border bg-background p-3">
                        {/* Lista de exercícios da rotina ou seleção */}
                        {isSelectingExercises ? (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              Selecione os exercícios:
                            </p>
                            <div className="max-h-48 space-y-1 overflow-y-auto">
                              {exercises.map((exercise) => {
                                const isInRoutine = routine.exerciseIds.includes(exercise.id);
                                return (
                                  <button
                                    key={exercise.id}
                                    type="button"
                                    onClick={() =>
                                      handleToggleExerciseInRoutine(routine.id, exercise.id)
                                    }
                                    className={cn(
                                      'flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm',
                                      'transition-colors',
                                      isInRoutine
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-muted/30 hover:bg-muted/50'
                                    )}
                                  >
                                    <span>{exercise.name}</span>
                                    {isInRoutine && <Check className="h-4 w-4" />}
                                  </button>
                                );
                              })}
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectingExercisesForRoutine(null)}
                              className="w-full rounded bg-muted py-2 text-sm transition-colors hover:bg-muted/80"
                            >
                              Concluído
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {routineExercises.length === 0 ? (
                              <p className="py-2 text-center text-xs text-muted-foreground">
                                Nenhum exercício adicionado
                              </p>
                            ) : (
                              <div className="space-y-1">
                                {routineExercises.map((exercise) => (
                                  <div
                                    key={exercise.id}
                                    className="flex items-center justify-between rounded bg-muted/30 px-3 py-2 text-sm"
                                  >
                                    <span>{exercise.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {exercise.defaultSets}x{exercise.defaultReps}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Ações */}
                            <div className="flex gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => setSelectingExercisesForRoutine(routine.id)}
                                className="flex-1 rounded bg-muted py-2 text-sm transition-colors hover:bg-muted/80"
                              >
                                Editar exercícios
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteRoutine(routine.id)}
                                className="rounded bg-destructive/10 px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Botão de adicionar rotina */}
          {!isAddingRoutine && (
            <button
              type="button"
              onClick={() => setIsAddingRoutine(true)}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-lg py-2',
                'text-sm text-muted-foreground',
                'border border-dashed border-muted-foreground/30',
                'hover:border-primary hover:text-primary',
                'transition-colors'
              )}
            >
              <Plus className="h-4 w-4" />
              Criar rotina
            </button>
          )}
        </div>
      )}
    </div>
  );
}
