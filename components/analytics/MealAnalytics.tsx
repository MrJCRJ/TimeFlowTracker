'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRecipeStore } from '@/stores/recipeStore';
import { Utensils, Flame, ChefHat, Cookie } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MealAnalyticsProps {
  periodLabel: string;
  className?: string;
}

interface RecipeStats {
  recipeId: string;
  recipeName: string;
  caloriesPerPortion: number;
  timesCooked: number;
  timesEaten: number;
  totalPortions: number;
  totalCalories: number;
}

/**
 * Componente de analytics para a categoria Alimentação
 * Mostra receitas mais consumidas, calorias totais, etc.
 */
export function MealAnalytics({ periodLabel, className }: MealAnalyticsProps) {
  const { recipes } = useRecipeStore();

  // Calcular estatísticas de receitas
  const recipeStats = useMemo((): RecipeStats[] => {
    return recipes
      .map((recipe) => ({
        recipeId: recipe.id,
        recipeName: recipe.name,
        caloriesPerPortion: recipe.caloriesPerPortion,
        timesCooked: recipe.timesCooked,
        timesEaten: recipe.timesEaten,
        totalPortions: recipe.timesEaten, // Cada "eaten" conta como 1 porção
        totalCalories: recipe.caloriesPerPortion * recipe.timesEaten,
      }))
      .filter((stats) => stats.timesCooked > 0 || stats.timesEaten > 0)
      .sort((a, b) => b.totalCalories - a.totalCalories);
  }, [recipes]);

  // Totais
  const totals = useMemo(() => {
    return recipeStats.reduce(
      (acc, stats) => ({
        totalCalories: acc.totalCalories + stats.totalCalories,
        totalCooked: acc.totalCooked + stats.timesCooked,
        totalEaten: acc.totalEaten + stats.timesEaten,
        totalRecipes: acc.totalRecipes + 1,
      }),
      { totalCalories: 0, totalCooked: 0, totalEaten: 0, totalRecipes: 0 }
    );
  }, [recipeStats]);

  // Média de calorias por refeição
  const avgCaloriesPerMeal =
    totals.totalEaten > 0 ? Math.round(totals.totalCalories / totals.totalEaten) : 0;

  if (recipes.length === 0) {
    return null;
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Utensils className="h-5 w-5 text-pink-500" />
          Alimentação - {periodLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cards de resumo */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <Flame className="mx-auto mb-1 h-5 w-5 text-orange-500" />
            <p className="text-lg font-bold">{totals.totalCalories.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Calorias Totais</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <Cookie className="mx-auto mb-1 h-5 w-5 text-amber-500" />
            <p className="text-lg font-bold">{totals.totalEaten}</p>
            <p className="text-xs text-muted-foreground">Porções</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <ChefHat className="mx-auto mb-1 h-5 w-5 text-teal-500" />
            <p className="text-lg font-bold">{totals.totalCooked}</p>
            <p className="text-xs text-muted-foreground">Vezes Cozinhado</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <Flame className="mx-auto mb-1 h-5 w-5 text-red-500" />
            <p className="text-lg font-bold">{avgCaloriesPerMeal}</p>
            <p className="text-xs text-muted-foreground">kcal/Porção</p>
          </div>
        </div>

        {/* Lista de receitas */}
        {recipeStats.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Receitas</h4>
            <div className="space-y-2">
              {recipeStats.slice(0, 5).map((stats) => (
                <div
                  key={stats.recipeId}
                  className="flex items-center justify-between rounded-lg bg-muted/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/30">
                      <Cookie className="h-4 w-4 text-pink-500" />
                    </div>
                    <div>
                      <p className="font-medium">{stats.recipeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.caloriesPerPortion} kcal/porção
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">
                      {stats.totalCalories.toLocaleString()} kcal
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats.timesEaten}x comido · {stats.timesCooked}x feito
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensagem se não há dados */}
        {recipeStats.length === 0 && recipes.length > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Nenhuma receita registrada ainda neste período
          </p>
        )}
      </CardContent>
    </Card>
  );
}
