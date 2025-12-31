'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Utensils,
  ChefHat,
  Cookie,
  Flame,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import { useRecipeStore } from '@/stores/recipeStore';
import type { Recipe } from '@/types/entries/meal';

type MealAction = 'cooking' | 'eating' | null;

interface MealEntryPanelProps {
  categoryColor: string;
  selectedRecipeId: string | null;
  selectedAction: MealAction;
  onRecipeSelect: (recipeId: string | null) => void;
  onActionSelect: (action: MealAction) => void;
  onStartCooking: (recipe: Recipe) => void;
  onEat: (recipe: Recipe, portions: number) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  className?: string;
}

/**
 * Painel para categoria Alimentação
 * Fluxo: Lista receitas → Seleciona → "Fazer ou Comer?"
 */
export function MealEntryPanel({
  categoryColor,
  selectedRecipeId,
  selectedAction,
  onRecipeSelect,
  onActionSelect,
  onStartCooking,
  onEat,
  isExpanded,
  onToggleExpand,
  className,
}: MealEntryPanelProps) {
  const { recipes, addRecipe, deleteRecipe, getRecipeById } = useRecipeStore();

  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [newRecipeName, setNewRecipeName] = useState('');
  const [newRecipeDesc, setNewRecipeDesc] = useState('');
  const [newRecipeCalories, setNewRecipeCalories] = useState('');
  const [newRecipePortions, setNewRecipePortions] = useState('4');
  const [eatingPortions, setEatingPortions] = useState(1);

  const selectedRecipe = selectedRecipeId ? getRecipeById(selectedRecipeId) : null;

  const handleAddRecipe = () => {
    if (!newRecipeName.trim() || !newRecipeCalories) return;

    const recipe = addRecipe({
      name: newRecipeName.trim(),
      description: newRecipeDesc.trim(),
      totalCalories: parseInt(newRecipeCalories),
      portions: parseInt(newRecipePortions) || 1,
    });

    onRecipeSelect(recipe.id);
    resetForm();
  };

  const resetForm = () => {
    setNewRecipeName('');
    setNewRecipeDesc('');
    setNewRecipeCalories('');
    setNewRecipePortions('4');
    setIsAddingRecipe(false);
  };

  const handleBack = () => {
    if (selectedAction) {
      onActionSelect(null);
    } else if (selectedRecipeId) {
      onRecipeSelect(null);
    }
  };

  const handleEatConfirm = () => {
    if (selectedRecipe && eatingPortions > 0) {
      onEat(selectedRecipe, eatingPortions);
      setEatingPortions(1);
    }
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
          <Utensils className="h-4 w-4" style={{ color: categoryColor }} />
          <span className="text-sm font-medium">Alimentação</span>
          {selectedRecipe && (
            <span
              className="rounded-full px-1.5 py-0.5 text-xs"
              style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
            >
              {selectedRecipe.name}
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
          {/* Botão voltar */}
          {(selectedRecipeId || selectedAction) && (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              Voltar
            </button>
          )}

          {/* Tela 1: Lista de receitas */}
          {!selectedRecipeId && !isAddingRecipe && (
            <div className="mt-2 space-y-1">
              {recipes.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Nenhuma receita cadastrada. Adicione sua primeira receita!
                </p>
              ) : (
                recipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onRecipeSelect(recipe.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onRecipeSelect(recipe.id);
                      }
                    }}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5',
                      'bg-muted/50 transition-colors hover:bg-muted',
                      'group text-left'
                    )}
                  >
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${categoryColor}20` }}
                    >
                      <Cookie className="h-5 w-5" style={{ color: categoryColor }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{recipe.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {recipe.caloriesPerPortion} kcal/porção · {recipe.portions} porções
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRecipe(recipe.id);
                      }}
                      className="rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}

              <button
                type="button"
                onClick={() => setIsAddingRecipe(true)}
                className={cn(
                  'mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2.5',
                  'text-sm text-muted-foreground',
                  'border border-dashed border-muted-foreground/30',
                  'hover:border-primary hover:text-primary',
                  'transition-colors'
                )}
              >
                <Plus className="h-4 w-4" />
                Nova receita
              </button>
            </div>
          )}

          {/* Tela 2: Formulário de nova receita */}
          {isAddingRecipe && (
            <div className="mt-2 space-y-3">
              <input
                type="text"
                value={newRecipeName}
                onChange={(e) => setNewRecipeName(e.target.value)}
                placeholder="Nome da receita..."
                className={cn(
                  'w-full rounded-md px-3 py-2 text-sm',
                  'border border-input bg-background',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50'
                )}
                autoFocus
              />
              <textarea
                value={newRecipeDesc}
                onChange={(e) => setNewRecipeDesc(e.target.value)}
                placeholder="Ingredientes, modo de preparo... (opcional)"
                rows={3}
                className={cn(
                  'w-full resize-none rounded-md px-3 py-2 text-sm',
                  'border border-input bg-background',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50'
                )}
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Calorias totais
                  </label>
                  <div className="relative">
                    <Flame className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="number"
                      value={newRecipeCalories}
                      onChange={(e) => setNewRecipeCalories(e.target.value)}
                      placeholder="kcal"
                      className={cn(
                        'w-full rounded-md py-2 pl-8 pr-3 text-sm',
                        'border border-input bg-background',
                        'focus:outline-none focus:ring-2 focus:ring-primary/50'
                      )}
                      min={0}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Porções</label>
                  <input
                    type="number"
                    value={newRecipePortions}
                    onChange={(e) => setNewRecipePortions(e.target.value)}
                    className={cn(
                      'w-full rounded-md px-3 py-2 text-sm',
                      'border border-input bg-background',
                      'focus:outline-none focus:ring-2 focus:ring-primary/50'
                    )}
                    min={1}
                  />
                </div>
              </div>
              {newRecipeCalories && newRecipePortions && (
                <p className="text-center text-xs text-muted-foreground">
                  ≈{' '}
                  <span className="font-medium text-foreground">
                    {Math.round(parseInt(newRecipeCalories) / parseInt(newRecipePortions))}
                  </span>{' '}
                  kcal por porção
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddRecipe}
                  disabled={!newRecipeName.trim() || !newRecipeCalories}
                  className={cn(
                    'flex-1 rounded-md px-3 py-2 text-sm font-medium',
                    'bg-primary text-primary-foreground',
                    'hover:bg-primary/90 disabled:opacity-50',
                    'transition-colors'
                  )}
                >
                  Salvar receita
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
          )}

          {/* Tela 3: Escolha - Fazer ou Comer */}
          {selectedRecipe && !selectedAction && (
            <div className="mt-2">
              <div className="mb-4 text-center">
                <p className="text-sm font-medium">{selectedRecipe.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedRecipe.caloriesPerPortion} kcal/porção · Rende {selectedRecipe.portions}{' '}
                  porções
                </p>
              </div>

              <p className="mb-3 text-center text-sm">O que você vai fazer?</p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onStartCooking(selectedRecipe)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl p-4',
                    'border-2 border-dashed',
                    'hover:border-primary hover:bg-primary/5',
                    'transition-all'
                  )}
                  style={{ borderColor: `${categoryColor}50` }}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${categoryColor}20` }}
                  >
                    <ChefHat className="h-6 w-6" style={{ color: categoryColor }} />
                  </div>
                  <span className="text-sm font-medium">FAZER</span>
                  <span className="text-xs text-muted-foreground">(timer)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onActionSelect('eating')}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl p-4',
                    'border-2 border-dashed',
                    'hover:border-primary hover:bg-primary/5',
                    'transition-all'
                  )}
                  style={{ borderColor: `${categoryColor}50` }}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${categoryColor}20` }}
                  >
                    <Cookie className="h-6 w-6" style={{ color: categoryColor }} />
                  </div>
                  <span className="text-sm font-medium">COMER</span>
                  <span className="text-xs text-muted-foreground">(rápido)</span>
                </button>
              </div>
            </div>
          )}

          {/* Tela 4: Confirmar porções (Comer) */}
          {selectedRecipe && selectedAction === 'eating' && (
            <div className="mt-2">
              <div className="mb-4 text-center">
                <p className="text-sm font-medium">{selectedRecipe.name}</p>
                <p className="text-xs text-muted-foreground">Quantas porções você vai comer?</p>
              </div>

              <div className="mb-4 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setEatingPortions(Math.max(0.5, eatingPortions - 0.5))}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg font-bold hover:bg-muted/80"
                >
                  -
                </button>
                <div className="text-center">
                  <p className="text-3xl font-bold">{eatingPortions}</p>
                  <p className="text-xs text-muted-foreground">
                    {eatingPortions === 1 ? 'porção' : 'porções'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEatingPortions(eatingPortions + 0.5)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg font-bold hover:bg-muted/80"
                >
                  +
                </button>
              </div>

              <div
                className="mb-4 rounded-lg p-3 text-center"
                style={{ backgroundColor: `${categoryColor}10` }}
              >
                <p className="text-xs text-muted-foreground">Calorias</p>
                <p className="text-2xl font-bold" style={{ color: categoryColor }}>
                  {Math.round(selectedRecipe.caloriesPerPortion * eatingPortions)} kcal
                </p>
              </div>

              <button
                type="button"
                onClick={handleEatConfirm}
                className={cn(
                  'w-full rounded-xl px-4 py-3 text-sm font-medium',
                  'bg-primary text-primary-foreground',
                  'transition-colors hover:bg-primary/90'
                )}
              >
                Registrar refeição
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
