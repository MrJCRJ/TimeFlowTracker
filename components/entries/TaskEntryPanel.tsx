'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChecklistInput } from './ChecklistInput';
import { ChevronUp, ChevronDown, ListTodo } from 'lucide-react';
import type { ChecklistItem } from '@/types/entries/simple';

interface TaskEntryPanelProps {
  categoryName: string;
  categoryColor: string;
  tasks: ChecklistItem[];
  onTasksChange: (tasks: ChecklistItem[]) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  className?: string;
}

/**
 * Painel para categorias do tipo Tarefas (Estudo, Outros)
 * Mostra lista de tarefas a serem realizadas durante o timer
 */
export function TaskEntryPanel({
  categoryName,
  categoryColor,
  tasks,
  onTasksChange,
  isExpanded,
  onToggleExpand,
  className,
}: TaskEntryPanelProps) {
  const completedCount = tasks.filter((task) => task.completed).length;
  const totalCount = tasks.length;

  // Placeholder baseado na categoria
  const getPlaceholder = (name: string) => {
    const placeholders: Record<string, string> = {
      Estudo: 'Ex: Ler capítulo 3, Fazer exercícios...',
      Outros: 'Ex: Tarefa específica...',
    };
    return placeholders[name] || 'Adicionar tarefa...';
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
          <ListTodo className="h-4 w-4" style={{ color: categoryColor }} />
          <span className="text-sm font-medium">Tarefas</span>
          {totalCount > 0 && (
            <span
              className="rounded-full px-1.5 py-0.5 text-xs"
              style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
            >
              {completedCount}/{totalCount}
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
          <p className="py-2 text-xs text-muted-foreground">
            O que você vai fazer durante {categoryName.toLowerCase()}?
          </p>
          <ChecklistInput
            items={tasks}
            onItemsChange={onTasksChange}
            placeholder={getPlaceholder(categoryName)}
            compact
          />
        </div>
      )}
    </div>
  );
}
