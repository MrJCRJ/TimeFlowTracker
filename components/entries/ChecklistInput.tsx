'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Plus, X, Check } from 'lucide-react';
import type { ChecklistItem } from '@/types/entries/simple';
import { AutocompleteInput } from '@/components/ui/AutocompleteInput';
import { useAutocompleteStore } from '@/stores/autocompleteStore';

interface ChecklistInputProps {
  items: ChecklistItem[];
  onItemsChange: (items: ChecklistItem[]) => void;
  placeholder?: string;
  maxItems?: number;
  className?: string;
  compact?: boolean;
}

export function ChecklistInput({
  items,
  onItemsChange,
  placeholder = 'Adicionar item...',
  maxItems = 20,
  className,
  compact = false,
}: ChecklistInputProps) {
  const [newItemText, setNewItemText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Autocomplete store
  const { getTaskSuggestions, addTaskName } = useAutocompleteStore();

  const generateId = () => `item_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const handleAddItem = useCallback(() => {
    const text = newItemText.trim();
    if (!text || items.length >= maxItems) return;

    const newItem: ChecklistItem = {
      id: generateId(),
      text,
      completed: false,
    };

    onItemsChange([...items, newItem]);

    // Salvar no histórico para autocomplete
    addTaskName(text);

    setNewItemText('');
    setIsAdding(false);
  }, [newItemText, items, maxItems, onItemsChange, addTaskName]);

  const handleToggleItem = useCallback(
    (itemId: string) => {
      onItemsChange(
        items.map((item) => (item.id === itemId ? { ...item, completed: !item.completed } : item))
      );
    },
    [items, onItemsChange]
  );

  const handleRemoveItem = useCallback(
    (itemId: string) => {
      onItemsChange(items.filter((item) => item.id !== itemId));
    },
    [items, onItemsChange]
  );

  const pendingItems = items.filter((item) => !item.completed);
  const completedItems = items.filter((item) => item.completed);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Lista de itens pendentes */}
      {pendingItems.length > 0 && (
        <ul className="space-y-1">
          {pendingItems.map((item) => (
            <li
              key={item.id}
              className={cn(
                'group flex items-center gap-2 rounded-md px-2 py-1.5',
                'bg-muted/50 transition-colors hover:bg-muted',
                compact && 'py-1 text-sm'
              )}
            >
              <button
                type="button"
                onClick={() => handleToggleItem(item.id)}
                className={cn(
                  'h-4 w-4 flex-shrink-0 rounded border border-muted-foreground/30',
                  'transition-colors hover:border-primary hover:bg-primary/10',
                  'flex items-center justify-center'
                )}
                aria-label={`Marcar "${item.text}" como concluído`}
              >
                {item.completed && <Check className="h-3 w-3 text-primary" />}
              </button>
              <span className="flex-1 text-foreground">{item.text}</span>
              <button
                type="button"
                onClick={() => handleRemoveItem(item.id)}
                className={cn(
                  'h-5 w-5 flex-shrink-0 rounded opacity-0 group-hover:opacity-100',
                  'transition-all hover:bg-destructive/20',
                  'flex items-center justify-center text-muted-foreground hover:text-destructive'
                )}
                aria-label={`Remover "${item.text}"`}
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Lista de itens concluídos */}
      {completedItems.length > 0 && (
        <div className="space-y-1">
          {!compact && (
            <p className="px-2 text-xs text-muted-foreground">
              Concluídos ({completedItems.length})
            </p>
          )}
          <ul className="space-y-1">
            {completedItems.map((item) => (
              <li
                key={item.id}
                className={cn(
                  'group flex items-center gap-2 rounded-md px-2 py-1.5',
                  'bg-muted/30 transition-colors hover:bg-muted/50',
                  compact && 'py-1 text-sm'
                )}
              >
                <button
                  type="button"
                  onClick={() => handleToggleItem(item.id)}
                  className={cn(
                    'h-4 w-4 flex-shrink-0 rounded border border-primary bg-primary/20',
                    'transition-colors hover:bg-primary/30',
                    'flex items-center justify-center'
                  )}
                  aria-label={`Desmarcar "${item.text}"`}
                >
                  <Check className="h-3 w-3 text-primary" />
                </button>
                <span className="flex-1 text-muted-foreground line-through">{item.text}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className={cn(
                    'h-5 w-5 flex-shrink-0 rounded opacity-0 group-hover:opacity-100',
                    'transition-all hover:bg-destructive/20',
                    'flex items-center justify-center text-muted-foreground hover:text-destructive'
                  )}
                  aria-label={`Remover "${item.text}"`}
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Input para adicionar novo item */}
      {isAdding ? (
        <div className="flex items-center gap-2">
          <AutocompleteInput
            value={newItemText}
            onChange={setNewItemText}
            onSubmit={handleAddItem}
            suggestions={getTaskSuggestions(newItemText)}
            placeholder={placeholder}
            className="flex-1"
            inputClassName={cn('py-1.5', compact && 'py-1')}
          />
          <button
            type="button"
            onClick={handleAddItem}
            disabled={!newItemText.trim()}
            className={cn(
              'rounded-md px-2 py-1.5 text-sm font-medium',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50',
              'transition-colors'
            )}
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setNewItemText('');
            }}
            className={cn(
              'rounded-md px-2 py-1.5 text-sm',
              'text-muted-foreground transition-colors hover:bg-muted'
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        items.length < maxItems && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-md px-3 py-1.5',
              'text-sm text-muted-foreground',
              'border border-dashed border-muted-foreground/30',
              'hover:border-primary hover:bg-primary/5 hover:text-primary',
              'transition-colors',
              compact && 'py-1'
            )}
          >
            <Plus className="h-4 w-4" />
            <span>{items.length === 0 ? placeholder : 'Adicionar mais'}</span>
          </button>
        )
      )}

      {/* Contador de itens */}
      {items.length > 0 && !compact && (
        <p className="px-2 text-right text-xs text-muted-foreground">
          {completedItems.length}/{items.length} concluídos
        </p>
      )}
    </div>
  );
}
