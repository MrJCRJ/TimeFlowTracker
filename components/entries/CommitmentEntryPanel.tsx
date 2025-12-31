'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Calendar,
  Check,
  Clock,
  AlertCircle,
  Play,
  ChevronRight,
  Repeat,
} from 'lucide-react';
import { useCommitmentStore } from '@/stores/commitmentStore';
import type { Commitment, CommitmentType, Priority, Recurrence } from '@/types/entries/commitment';
import { COMMITMENT_TYPE_LABELS, PRIORITY_LABELS } from '@/types/entries/commitment';

interface CommitmentEntryPanelProps {
  categoryColor: string;
  selectedCommitmentId?: string | null;
  onCommitmentSelect?: (commitmentId: string | null) => void;
  onStartTimer: (commitment: Commitment) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  className?: string;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.getTime() === today.getTime()) return 'Hoje';
  if (date.getTime() === tomorrow.getTime()) return 'Amanhã';

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

const isOverdue = (dateStr: string) => {
  const today = new Date().toISOString().split('T')[0];
  return dateStr < today;
};

/**
 * Painel para categoria Compromissos
 * Lista compromissos pendentes e permite iniciar timer
 */
export function CommitmentEntryPanel({
  categoryColor,
  onStartTimer,
  isExpanded,
  onToggleExpand,
  className,
}: CommitmentEntryPanelProps) {
  const {
    commitments,
    addCommitment,
    deleteCommitment,
    toggleComplete,
    toggleSubtask,
    addSubtask,
    getOverdueCommitments,
    getUpcomingCommitments,
  } = useCommitmentStore();

  const [isAddingCommitment, setIsAddingCommitment] = useState(false);
  const [expandedCommitment, setExpandedCommitment] = useState<string | null>(null);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<CommitmentType>('task');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [hasRecurrence, setHasRecurrence] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<Recurrence['type']>('monthly');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  const overdueCommitments = getOverdueCommitments();
  const upcomingCommitments = getUpcomingCommitments(7);
  const pendingCount = commitments.filter((c) => !c.completed).length;

  const handleAddCommitment = () => {
    if (!newTitle.trim()) return;

    const recurrence: Recurrence | undefined = hasRecurrence
      ? {
          type: recurrenceType,
          interval: recurrenceInterval,
          endDate: recurrenceEndDate || undefined,
        }
      : undefined;

    addCommitment({
      type: newType,
      title: newTitle.trim(),
      dueDate: newDate,
      dueTime: newTime || undefined,
      priority: newPriority,
      recurrence,
    });

    resetForm();
  };

  const resetForm = () => {
    setNewTitle('');
    setNewType('task');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewTime('');
    setNewPriority('medium');
    setHasRecurrence(false);
    setRecurrenceType('monthly');
    setRecurrenceInterval(1);
    setRecurrenceEndDate('');
    setIsAddingCommitment(false);
  };

  const handleAddSubtask = (commitmentId: string) => {
    if (!newSubtaskText.trim()) return;
    addSubtask(commitmentId, newSubtaskText.trim());
    setNewSubtaskText('');
  };

  const renderCommitment = (commitment: Commitment) => {
    const isExpanded = expandedCommitment === commitment.id;
    const overdue = !commitment.completed && isOverdue(commitment.dueDate);

    return (
      <div
        key={commitment.id}
        className={cn(
          'overflow-hidden rounded-lg border',
          commitment.completed ? 'opacity-50' : '',
          overdue && !commitment.completed && 'border-destructive/50'
        )}
      >
        {/* Header do compromisso */}
        <div
          className={cn(
            'flex cursor-pointer items-center gap-2 px-3 py-2',
            'transition-colors hover:bg-muted/50'
          )}
          onClick={() => setExpandedCommitment(isExpanded ? null : commitment.id)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleComplete(commitment.id);
            }}
            className={cn(
              'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full',
              'border-2 transition-colors',
              commitment.completed
                ? 'border-primary bg-primary'
                : 'border-muted-foreground/30 hover:border-primary'
            )}
          >
            {commitment.completed && <Check className="h-3 w-3 text-primary-foreground" />}
          </button>

          <div className="min-w-0 flex-1">
            <p
              className={cn('truncate text-sm font-medium', commitment.completed && 'line-through')}
            >
              {commitment.title}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn(overdue && 'font-medium text-destructive')}>
                {formatDate(commitment.dueDate)}
              </span>
              {commitment.dueTime && <span>às {commitment.dueTime}</span>}
              {commitment.recurrence && (
                <span className="flex items-center gap-0.5 text-primary">
                  <Repeat className="h-3 w-3" />
                </span>
              )}
              <span
                className={cn(
                  'rounded px-1 py-0.5 text-[10px]',
                  commitment.priority === 'high' && 'bg-destructive/20 text-destructive',
                  commitment.priority === 'medium' && 'bg-amber-500/20 text-amber-600',
                  commitment.priority === 'low' && 'bg-muted text-muted-foreground'
                )}
              >
                {PRIORITY_LABELS[commitment.priority]}
              </span>
            </div>
          </div>

          {!commitment.completed && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStartTimer(commitment);
              }}
              className={cn(
                'rounded-full p-1.5',
                'bg-primary/10 text-primary hover:bg-primary/20',
                'transition-colors'
              )}
              title="Iniciar timer"
            >
              <Play className="h-4 w-4" />
            </button>
          )}

          <ChevronRight
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              isExpanded && 'rotate-90'
            )}
          />
        </div>

        {/* Conteúdo expandido */}
        {isExpanded && (
          <div className="space-y-2 border-t border-border/50 px-3 pb-3">
            {/* Subtarefas */}
            {commitment.subtasks && commitment.subtasks.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-muted-foreground">Subtarefas</p>
                {commitment.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2 pl-2">
                    <button
                      type="button"
                      onClick={() => toggleSubtask(commitment.id, subtask.id)}
                      className={cn(
                        'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded',
                        'border transition-colors',
                        subtask.completed
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/30 hover:border-primary'
                      )}
                    >
                      {subtask.completed && (
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      )}
                    </button>
                    <span
                      className={cn(
                        'flex-1 text-sm',
                        subtask.completed && 'text-muted-foreground line-through'
                      )}
                    >
                      {subtask.text}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Adicionar subtarefa */}
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                placeholder="Nova subtarefa..."
                className={cn(
                  'flex-1 rounded px-2 py-1 text-sm',
                  'border border-input bg-background',
                  'focus:outline-none focus:ring-1 focus:ring-primary'
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSubtask(commitment.id);
                }}
              />
              <button
                type="button"
                onClick={() => handleAddSubtask(commitment.id)}
                disabled={!newSubtaskText.trim()}
                className={cn(
                  'rounded px-2 py-1 text-sm',
                  'bg-primary text-primary-foreground',
                  'transition-colors disabled:opacity-50'
                )}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Ações */}
            <div className="mt-2 flex gap-2 border-t border-border/50 pt-2">
              <button
                type="button"
                onClick={() => deleteCommitment(commitment.id)}
                className="text-xs text-destructive hover:underline"
              >
                Excluir
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

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
          <Calendar className="h-4 w-4" style={{ color: categoryColor }} />
          <span className="text-sm font-medium">Compromissos</span>
          {pendingCount > 0 && (
            <span
              className="rounded-full px-1.5 py-0.5 text-xs"
              style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
            >
              {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
            </span>
          )}
          {overdueCommitments.length > 0 && (
            <span className="rounded-full bg-destructive/20 px-1.5 py-0.5 text-xs text-destructive">
              {overdueCommitments.length} atrasado{overdueCommitments.length > 1 ? 's' : ''}
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
        <div className="border-t border-border/50 px-3 pb-3">
          {/* Atrasados */}
          {overdueCommitments.length > 0 && (
            <div className="mt-3">
              <div className="mb-2 flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                Atrasados
              </div>
              <div className="space-y-2">{overdueCommitments.map(renderCommitment)}</div>
            </div>
          )}

          {/* Próximos 7 dias */}
          {upcomingCommitments.length > 0 && (
            <div className="mt-3">
              <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Próximos 7 dias
              </div>
              <div className="space-y-2">{upcomingCommitments.map(renderCommitment)}</div>
            </div>
          )}

          {/* Estado vazio */}
          {overdueCommitments.length === 0 && upcomingCommitments.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Nenhum compromisso pendente. 🎉
            </p>
          )}

          {/* Formulário de novo compromisso */}
          {isAddingCommitment ? (
            <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/30 p-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Título do compromisso..."
                className={cn(
                  'w-full rounded-md px-3 py-2 text-sm',
                  'border border-input bg-background',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50'
                )}
                autoFocus
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as CommitmentType)}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm',
                    'border border-input bg-background',
                    'focus:outline-none focus:ring-2 focus:ring-primary/50'
                  )}
                >
                  {Object.entries(COMMITMENT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as Priority)}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm',
                    'border border-input bg-background',
                    'focus:outline-none focus:ring-2 focus:ring-primary/50'
                  )}
                >
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm',
                    'border border-input bg-background',
                    'focus:outline-none focus:ring-2 focus:ring-primary/50'
                  )}
                />
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  placeholder="Horário"
                  className={cn(
                    'rounded-md px-3 py-2 text-sm',
                    'border border-input bg-background',
                    'focus:outline-none focus:ring-2 focus:ring-primary/50'
                  )}
                />
              </div>

              {/* Recorrência */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={hasRecurrence}
                    onChange={(e) => setHasRecurrence(e.target.checked)}
                    className="rounded border-input"
                  />
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                  Repetir
                </label>

                {hasRecurrence && (
                  <div className="ml-6 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">A cada</span>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                        className={cn(
                          'w-16 rounded-md px-2 py-1 text-center text-sm',
                          'border border-input bg-background',
                          'focus:outline-none focus:ring-2 focus:ring-primary/50'
                        )}
                      />
                      <select
                        value={recurrenceType}
                        onChange={(e) => setRecurrenceType(e.target.value as Recurrence['type'])}
                        className={cn(
                          'rounded-md px-2 py-1 text-sm',
                          'border border-input bg-background',
                          'focus:outline-none focus:ring-2 focus:ring-primary/50'
                        )}
                      >
                        <option value="daily">dia(s)</option>
                        <option value="weekly">semana(s)</option>
                        <option value="monthly">mês(es)</option>
                        <option value="yearly">ano(s)</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Até</span>
                      <input
                        type="date"
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        placeholder="Sem data fim"
                        className={cn(
                          'flex-1 rounded-md px-2 py-1 text-sm',
                          'border border-input bg-background',
                          'focus:outline-none focus:ring-2 focus:ring-primary/50'
                        )}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Deixe vazio para repetir indefinidamente
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddCommitment}
                  disabled={!newTitle.trim()}
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
                  onClick={resetForm}
                  className={cn('rounded-md px-3 py-2 text-sm', 'transition-colors hover:bg-muted')}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingCommitment(true)}
              className={cn(
                'mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5',
                'text-sm text-muted-foreground',
                'border border-dashed border-muted-foreground/30',
                'hover:border-primary hover:text-primary',
                'transition-colors'
              )}
            >
              <Plus className="h-4 w-4" />
              Novo compromisso
            </button>
          )}
        </div>
      )}
    </div>
  );
}
