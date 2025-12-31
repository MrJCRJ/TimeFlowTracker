'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChecklistInput } from './ChecklistInput';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { ChecklistItem } from '@/types/entries/simple';

interface SimpleEntryPanelProps {
  categoryName: string;
  categoryColor: string;
  items: ChecklistItem[];
  onItemsChange: (items: ChecklistItem[]) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  className?: string;
}

/**
 * Painel para categorias do tipo Simples (Sono, Lazer, Casa)
 * Mostra checklist opcional para anotar atividades durante o timer
 */
export function SimpleEntryPanel({
  categoryName,
  categoryColor,
  items,
  onItemsChange,
  isExpanded,
  onToggleExpand,
  className,
}: SimpleEntryPanelProps) {
  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;

  // Placeholder baseado na categoria
  const getPlaceholder = (name: string) => {
    const placeholders: Record<string, string> = {
      Sono: 'Ex: Li antes de dormir, Tomei chá...',
      Lazer: 'Ex: Joguei X, Assisti Y...',
      Casa: 'Ex: Limpei cozinha, Lavei roupa...',
    };
    return placeholders[name] || 'Adicionar atividade...';
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
          <span className="text-sm font-medium">O que você fez?</span>
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
            Opcional: anote o que está fazendo durante {categoryName.toLowerCase()}
          </p>
          <ChecklistInput
            items={items}
            onItemsChange={onItemsChange}
            placeholder={getPlaceholder(categoryName)}
            compact
          />
        </div>
      )}
    </div>
  );
}
