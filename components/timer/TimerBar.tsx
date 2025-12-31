'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn, formatTime } from '@/lib/utils';
import { useTimerStore } from '@/stores/timerStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useTaskStore } from '@/stores/taskStore';
import { useJobStore } from '@/stores/jobStore';
import { useRecipeStore } from '@/stores/recipeStore';
import { useCommitmentStore } from '@/stores/commitmentStore';
import { TIMER_UPDATE_INTERVAL } from '@/lib/constants';
import type { Category, TimeEntry } from '@/types';
import type { ChecklistItem } from '@/types/entries/simple';
import type { WorkoutExercise } from '@/types/entries/workout';
import type { Recipe } from '@/types/entries/meal';
import type { Commitment } from '@/types/entries/commitment';
import { SimpleEntryPanel } from '@/components/entries/SimpleEntryPanel';
import { WorkoutEntryPanel } from '@/components/entries/WorkoutEntryPanel';
import { WorkEntryPanel } from '@/components/entries/WorkEntryPanel';
import { MealEntryPanel } from '@/components/entries/MealEntryPanel';
import { CommitmentEntryPanel } from '@/components/entries/CommitmentEntryPanel';
import {
  Play,
  Square,
  Briefcase,
  Book,
  BookOpen,
  GraduationCap,
  Search,
  Dumbbell,
  Gamepad2,
  Moon,
  Utensils,
  Car,
  Folder,
  Code,
  Music,
  Video,
  Tv,
  MessageCircle,
  Mail,
  Users,
  Heart,
  ShoppingCart,
  Home,
  Presentation,
  FileText,
  Sparkles,
  Calendar,
  X,
  Plus,
  Check,
  ChevronUp,
  ChevronDown,
  LucideIcon,
} from 'lucide-react';

// Mapa de ícones
const iconMap: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  book: Book,
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  search: Search,
  dumbbell: Dumbbell,
  'gamepad-2': Gamepad2,
  moon: Moon,
  utensils: Utensils,
  car: Car,
  folder: Folder,
  code: Code,
  music: Music,
  video: Video,
  tv: Tv,
  'message-circle': MessageCircle,
  mail: Mail,
  users: Users,
  heart: Heart,
  'shopping-cart': ShoppingCart,
  home: Home,
  presentation: Presentation,
  'file-text': FileText,
  sparkles: Sparkles,
  calendar: Calendar,
};

interface TimerStoreState {
  isRunning: boolean;
  activeEntry: TimeEntry | null;
  elapsedSeconds: number;
  startTimer: (categoryId: string, userId: string, taskId?: string) => void;
  stopTimer: () => void;
  updateElapsed: () => void;
}

interface TimerBarProps {
  userId: string;
  className?: string;
  store?: TimerStoreState;
  categories?: Category[];
  isLoading?: boolean;
}

export function TimerBar({
  userId,
  className,
  store,
  categories: propCategories,
  isLoading = false,
}: TimerBarProps) {
  const timerStoreFromHook = useTimerStore();
  const { categories: storeCategories } = useCategoryStore();
  const { getTasksByCategory, addTask, updateTask } = useTaskStore();
  const { selectedJobId, selectJob } = useJobStore();
  const { selectedRecipeId, selectRecipe, incrementTimesEaten } = useRecipeStore();
  const { selectedCommitmentId, selectCommitment } = useCommitmentStore();

  const timerStore = store || timerStoreFromHook;
  const categories = propCategories || storeCategories;

  const { isRunning, activeEntry, elapsedSeconds, startTimer, stopTimer, updateElapsed } =
    timerStore;

  // Estados
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [showEntryPanel, setShowEntryPanel] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [mealAction, setMealAction] = useState<'cooking' | 'eating' | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Categoria ativa
  const activeCategory = activeEntry
    ? categories.find((cat) => cat.id === activeEntry.categoryId)
    : null;

  // Tarefas da categoria ativa
  const activeTasks = activeCategory ? getTasksByCategory(activeCategory.id) : [];

  const pendingTasks = activeTasks.filter((t) => !t.isCompleted);
  const completedTasks = activeTasks.filter((t) => t.isCompleted);

  // Atualiza elapsed a cada segundo
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(updateElapsed, TIMER_UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [isRunning, updateElapsed]);

  // Fecha picker ao clicar fora
  useEffect(() => {
    if (!showCategoryPicker) return;

    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowCategoryPicker(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategoryPicker]);

  // Focus no input
  useEffect(() => {
    if (isAddingTask && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingTask]);

  // Handlers
  const handleStartTimer = useCallback(
    (categoryId: string) => {
      startTimer(categoryId, userId);
      setShowCategoryPicker(false);
    },
    [startTimer, userId]
  );

  const handleStopTimer = useCallback(() => {
    // TODO: Salvar dados da entrada junto quando implementar persistência
    stopTimer();
    setShowTaskPanel(false);
    setShowEntryPanel(false);
    setChecklistItems([]); // Reset checklist
    setWorkoutExercises([]); // Reset exercícios
    setMealAction(null); // Reset meal action
    selectJob(null); // Reset trabalho selecionado
    selectRecipe(null); // Reset receita selecionada
    selectCommitment(null); // Reset compromisso selecionado
  }, [stopTimer, selectJob, selectRecipe, selectCommitment]);

  const handleToggleTask = useCallback(
    (taskId: string, isCompleted: boolean) => {
      updateTask(taskId, { isCompleted: !isCompleted });
    },
    [updateTask]
  );

  const handleAddTask = useCallback(() => {
    if (!activeCategory || !newTaskName.trim()) return;

    addTask({ name: newTaskName.trim(), categoryId: activeCategory.id }, userId);

    setNewTaskName('');
    setIsAddingTask(false);
  }, [activeCategory, newTaskName, addTask, userId]);

  // Handler para iniciar timer de receita (FAZER)
  const handleStartCooking = useCallback(
    (recipe: Recipe) => {
      selectRecipe(recipe.id);
      setMealAction('cooking');
      startTimer('food', userId);
      setShowCategoryPicker(false);
      setShowEntryPanel(true);
    },
    [selectRecipe, startTimer, userId]
  );

  // Handler para registrar consumo de receita (COMER)
  const handleEatRecipe = useCallback(
    (recipe: Recipe, portions: number) => {
      incrementTimesEaten(recipe.id, portions);
      // Registrar como entrada rápida (sem timer)
      // TODO: Implementar registro de EatingEntry no store
      setMealAction(null);
      selectRecipe(null);
      setShowEntryPanel(false);
    },
    [incrementTimesEaten, selectRecipe]
  );

  // Handler para iniciar timer de compromisso
  const handleStartCommitmentTimer = useCallback(
    (commitment: Commitment) => {
      selectCommitment(commitment.id);
      startTimer('commitments', userId);
      setShowCategoryPicker(false);
      setShowEntryPanel(true);
    },
    [selectCommitment, startTimer, userId]
  );

  // Helper para obter label de subtítulo baseado no tipo
  const getSubtitleForCategory = useCallback(() => {
    if (!activeCategory) return '';

    switch (activeCategory.type) {
      case 'simple':
        return checklistItems.length > 0
          ? `${checklistItems.filter((i) => i.completed).length}/${checklistItems.length} itens`
          : 'Adicionar atividades';
      case 'workout':
        const totalSets = workoutExercises.reduce((acc, ex) => acc + ex.sets.length, 0);
        const completedSets = workoutExercises.reduce(
          (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
          0
        );
        return totalSets > 0 ? `${completedSets}/${totalSets} séries` : 'Adicionar exercícios';
      case 'work':
        const job = selectedJobId ? useJobStore.getState().getJobById(selectedJobId) : null;
        return job ? job.name : 'Selecionar trabalho';
      case 'meal':
        const recipe = selectedRecipeId
          ? useRecipeStore.getState().getRecipeById(selectedRecipeId)
          : null;
        return recipe ? `Preparando: ${recipe.name}` : 'Selecionar receita';
      case 'commitment':
        const commitment = selectedCommitmentId
          ? useCommitmentStore.getState().getCommitmentById(selectedCommitmentId)
          : null;
        return commitment ? commitment.title : 'Selecionar compromisso';
      case 'task':
      default:
        return pendingTasks.length > 0
          ? `${pendingTasks.length} tarefa${pendingTasks.length > 1 ? 's' : ''} pendente${pendingTasks.length > 1 ? 's' : ''}`
          : 'Sem tarefas';
    }
  }, [
    activeCategory,
    checklistItems,
    workoutExercises,
    selectedJobId,
    selectedRecipeId,
    selectedCommitmentId,
    pendingTasks,
  ]);

  // Renderiza ícone
  const renderIcon = (iconName: string, color: string, size = 'h-4 w-4') => {
    const Icon = iconMap[iconName] || Folder;
    return <Icon className={size} style={{ color }} />;
  };

  // Loading
  if (isLoading) {
    return (
      <div
        data-testid="timer-bar"
        className={cn('timer-bar flex items-center justify-center p-4', className)}
      >
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Sem categorias
  if (categories.length === 0) {
    return (
      <div
        data-testid="timer-bar"
        className={cn('timer-bar flex items-center justify-center p-4', className)}
      >
        <p className="text-sm text-muted-foreground">Nenhuma categoria disponível</p>
      </div>
    );
  }

  return (
    <>
      {/* Painel de Entrada Simples (Sono, Lazer, Casa) */}
      {isRunning && activeCategory && activeCategory.type === 'simple' && showEntryPanel && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setShowEntryPanel(false)}
          />
          <div className="fixed bottom-16 left-2 right-2 z-50 max-h-[60vh] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:bottom-20 sm:left-auto sm:right-4 sm:w-80">
            {/* Header */}
            <div
              className="flex items-center justify-between border-b border-border px-4 py-3"
              style={{ backgroundColor: `${activeCategory.color}15` }}
            >
              <div className="flex items-center gap-2">
                {renderIcon(activeCategory.icon, activeCategory.color)}
                <span className="font-medium">{activeCategory.name}</span>
              </div>
              <button
                onClick={() => setShowEntryPanel(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Conteúdo do painel simples */}
            <div className="p-3">
              <SimpleEntryPanel
                categoryName={activeCategory.name}
                categoryColor={activeCategory.color}
                items={checklistItems}
                onItemsChange={setChecklistItems}
                isExpanded={true}
                onToggleExpand={() => {}}
                className="border-0 bg-transparent"
              />
            </div>
          </div>
        </>
      )}

      {/* Painel de Treino (workout) */}
      {isRunning && activeCategory && activeCategory.type === 'workout' && showEntryPanel && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setShowEntryPanel(false)}
          />
          <div className="fixed bottom-16 left-2 right-2 z-50 max-h-[70vh] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:bottom-20 sm:left-auto sm:right-4 sm:w-96">
            <div
              className="flex items-center justify-between border-b border-border px-4 py-3"
              style={{ backgroundColor: `${activeCategory.color}15` }}
            >
              <div className="flex items-center gap-2">
                {renderIcon(activeCategory.icon, activeCategory.color)}
                <span className="font-medium">{activeCategory.name}</span>
              </div>
              <button
                onClick={() => setShowEntryPanel(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-3">
              <WorkoutEntryPanel
                categoryColor={activeCategory.color}
                exercises={workoutExercises}
                onExercisesChange={setWorkoutExercises}
                isExpanded={true}
                onToggleExpand={() => {}}
                className="border-0 bg-transparent"
              />
            </div>
          </div>
        </>
      )}

      {/* Painel de Trabalho (work) */}
      {isRunning && activeCategory && activeCategory.type === 'work' && showEntryPanel && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setShowEntryPanel(false)}
          />
          <div className="fixed bottom-16 left-2 right-2 z-50 max-h-[60vh] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:bottom-20 sm:left-auto sm:right-4 sm:w-80">
            <div
              className="flex items-center justify-between border-b border-border px-4 py-3"
              style={{ backgroundColor: `${activeCategory.color}15` }}
            >
              <div className="flex items-center gap-2">
                {renderIcon(activeCategory.icon, activeCategory.color)}
                <span className="font-medium">{activeCategory.name}</span>
              </div>
              <button
                onClick={() => setShowEntryPanel(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-3">
              <WorkEntryPanel
                categoryColor={activeCategory.color}
                selectedJobId={selectedJobId}
                onJobSelect={selectJob}
                isExpanded={true}
                onToggleExpand={() => {}}
                className="border-0 bg-transparent"
              />
            </div>
          </div>
        </>
      )}

      {/* Painel de Alimentação (meal) */}
      {isRunning && activeCategory && activeCategory.type === 'meal' && showEntryPanel && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setShowEntryPanel(false)}
          />
          <div className="fixed bottom-16 left-2 right-2 z-50 max-h-[70vh] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:bottom-20 sm:left-auto sm:right-4 sm:w-80">
            <div
              className="flex items-center justify-between border-b border-border px-4 py-3"
              style={{ backgroundColor: `${activeCategory.color}15` }}
            >
              <div className="flex items-center gap-2">
                {renderIcon(activeCategory.icon, activeCategory.color)}
                <span className="font-medium">{activeCategory.name}</span>
              </div>
              <button
                onClick={() => setShowEntryPanel(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-3">
              <MealEntryPanel
                categoryColor={activeCategory.color}
                selectedRecipeId={selectedRecipeId}
                selectedAction={mealAction}
                onRecipeSelect={selectRecipe}
                onActionSelect={setMealAction}
                onStartCooking={handleStartCooking}
                onEat={handleEatRecipe}
                isExpanded={true}
                onToggleExpand={() => {}}
                className="border-0 bg-transparent"
              />
            </div>
          </div>
        </>
      )}

      {/* Painel de Compromissos (commitment) */}
      {isRunning && activeCategory && activeCategory.type === 'commitment' && showEntryPanel && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setShowEntryPanel(false)}
          />
          <div className="fixed bottom-16 left-2 right-2 z-50 max-h-[70vh] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:bottom-20 sm:left-auto sm:right-4 sm:w-96">
            <div
              className="flex items-center justify-between border-b border-border px-4 py-3"
              style={{ backgroundColor: `${activeCategory.color}15` }}
            >
              <div className="flex items-center gap-2">
                {renderIcon(activeCategory.icon, activeCategory.color)}
                <span className="font-medium">{activeCategory.name}</span>
              </div>
              <button
                onClick={() => setShowEntryPanel(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-3">
              <CommitmentEntryPanel
                categoryColor={activeCategory.color}
                onStartTimer={handleStartCommitmentTimer}
                isExpanded={true}
                onToggleExpand={() => {}}
                className="border-0 bg-transparent"
              />
            </div>
          </div>
        </>
      )}

      {/* Painel de Tarefas (quando timer ativo) */}
      {isRunning && activeCategory && showTaskPanel && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowTaskPanel(false)} />
          <div className="fixed bottom-16 left-2 right-2 z-50 max-h-[60vh] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:bottom-20 sm:left-auto sm:right-4 sm:w-80">
            {/* Header */}
            <div
              className="flex items-center justify-between border-b border-border px-4 py-3"
              style={{ backgroundColor: `${activeCategory.color}15` }}
            >
              <div className="flex items-center gap-2">
                {renderIcon(activeCategory.icon, activeCategory.color)}
                <span className="font-medium">{activeCategory.name}</span>
              </div>
              <button
                onClick={() => setShowTaskPanel(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Lista de Tarefas */}
            <div className="max-h-[45vh] overflow-y-auto p-3">
              {/* Tarefas Pendentes */}
              {pendingTasks.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Pendentes ({pendingTasks.length})
                  </p>
                  <div className="space-y-1">
                    {pendingTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => handleToggleTask(task.id, task.isCompleted)}
                        className="flex w-full items-center gap-3 rounded-xl bg-background px-3 py-2.5 text-left transition-all hover:bg-muted active:scale-[0.98]"
                      >
                        <div
                          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2"
                          style={{ borderColor: activeCategory.color }}
                        />
                        <span className="flex-1 text-sm">{task.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tarefas Concluídas */}
              {completedTasks.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Concluídas ({completedTasks.length})
                  </p>
                  <div className="space-y-1">
                    {completedTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => handleToggleTask(task.id, task.isCompleted)}
                        className="flex w-full items-center gap-3 rounded-xl bg-background/50 px-3 py-2.5 text-left opacity-60 transition-all hover:bg-muted active:scale-[0.98]"
                      >
                        <div
                          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md"
                          style={{ backgroundColor: activeCategory.color }}
                        >
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="flex-1 text-sm line-through">{task.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Adicionar Tarefa */}
              {isAddingTask ? (
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTaskName.trim()) handleAddTask();
                      if (e.key === 'Escape') {
                        setIsAddingTask(false);
                        setNewTaskName('');
                      }
                    }}
                    placeholder="Nome da tarefa..."
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                  <button
                    onClick={handleAddTask}
                    disabled={!newTaskName.trim()}
                    className="rounded-xl bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingTask(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar tarefa</span>
                </button>
              )}

              {/* Estado vazio */}
              {activeTasks.length === 0 && !isAddingTask && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhuma tarefa ainda. Adicione tarefas para acompanhar seu progresso!
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Picker de Categorias (quando timer parado) */}
      {showCategoryPicker && !isRunning && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setShowCategoryPicker(false)}
          />
          <div
            ref={pickerRef}
            className="fixed bottom-20 left-3 right-3 z-50 mb-2 max-h-[70vh] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:bottom-24 sm:left-auto sm:right-4 sm:w-80"
          >
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
              <span className="font-medium">Selecionar Categoria</span>
              <button
                onClick={() => setShowCategoryPicker(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid max-h-[55vh] grid-cols-2 gap-2 overflow-y-auto p-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleStartTimer(category.id)}
                  className="flex flex-col items-center gap-2 rounded-xl bg-background p-4 transition-all hover:bg-primary/5 active:scale-[0.98]"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    {renderIcon(category.icon, category.color, 'h-6 w-6')}
                  </div>
                  <span className="text-sm font-medium">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Timer Bar */}
      <div
        data-testid="timer-bar"
        role="region"
        aria-label="Barra de timer"
        className={cn('timer-bar', isRunning && 'timer-bar-active', className)}
      >
        <div className="container mx-auto px-3 py-2 sm:px-4">
          <div className="flex items-center justify-between gap-2">
            {/* Lado esquerdo - Categoria/Iniciar */}
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {isRunning && activeCategory ? (
                /* Timer ativo */
                <button
                  onClick={() => {
                    // Para tipo 'task' usa o painel de tarefas legado
                    if (activeCategory.type === 'task') {
                      setShowTaskPanel(!showTaskPanel);
                      setShowEntryPanel(false);
                    } else {
                      // Para outros tipos usa o painel especializado
                      setShowEntryPanel(!showEntryPanel);
                      setShowTaskPanel(false);
                    }
                  }}
                  className="flex items-center gap-2 rounded-xl px-3 py-1.5 transition-all hover:bg-white/10"
                >
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${activeCategory.color}30` }}
                  >
                    {renderIcon(activeCategory.icon, activeCategory.color, 'h-4 w-4')}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="truncate text-sm font-medium">{activeCategory.name}</p>
                    <p className="text-xs text-muted-foreground">{getSubtitleForCategory()}</p>
                  </div>
                  {showTaskPanel || showEntryPanel ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              ) : (
                /* Timer parado */
                <button
                  onClick={() => setShowCategoryPicker(true)}
                  className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-primary transition-all hover:bg-primary/20 active:scale-[0.98]"
                >
                  <Play className="h-5 w-5" />
                  <span className="font-medium">Iniciar</span>
                </button>
              )}
            </div>

            {/* Timer display */}
            <div
              data-testid="timer-display"
              className={cn(
                'font-mono text-xl font-bold tabular-nums sm:text-2xl',
                isRunning ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {formatTime(elapsedSeconds)}
            </div>

            {/* Botão parar */}
            {isRunning ? (
              <button
                onClick={handleStopTimer}
                className="flex items-center gap-2 rounded-xl bg-danger px-4 py-2 font-medium text-white transition-all hover:bg-danger/90 active:scale-95"
                aria-label="Parar timer"
              >
                <Square className="h-4 w-4" />
                <span className="hidden sm:inline">Parar</span>
              </button>
            ) : (
              <div className="w-[76px] sm:w-[100px]" /> /* Spacer */
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default TimerBar;
