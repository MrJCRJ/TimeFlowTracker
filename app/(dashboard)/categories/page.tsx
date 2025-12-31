'use client';

import React, { useState } from 'react';
import { useCategoryStore } from '@/stores/categoryStore';
import { TaskList } from '@/components/categories';
import { ExerciseManager } from '@/components/categories/ExerciseManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTimerStore } from '@/stores/timerStore';
import { formatDuration, isThisWeek, isToday } from '@/lib/utils';
import { Clock, ChevronDown, ChevronUp, Info } from 'lucide-react';
import {
  Briefcase,
  Book,
  Dumbbell,
  Gamepad2,
  Moon,
  Utensils,
  Home,
  Calendar,
  Folder,
} from 'lucide-react';
import type { Category, CategoryType } from '@/types';

// Mapa de ícones
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  briefcase: Briefcase,
  book: Book,
  dumbbell: Dumbbell,
  'gamepad-2': Gamepad2,
  moon: Moon,
  utensils: Utensils,
  home: Home,
  calendar: Calendar,
  folder: Folder,
};

// Labels para tipos de categoria
const typeLabels: Record<CategoryType, string> = {
  simple: 'Timer + Checklist',
  task: 'Timer + Tarefas',
  workout: 'Exercícios',
  work: 'Financeiro',
  meal: 'Receitas',
  commitment: 'Datado',
};

export default function CategoriesPage() {
  const { categories } = useCategoryStore();
  const { timeEntries } = useTimerStore();

  const [expandedTasksId, setExpandedTasksId] = useState<string | null>(null);

  // Calculate time spent per category this week
  const categoryStats = React.useMemo(() => {
    const stats = new Map<string, { today: number; week: number; total: number }>();

    categories.forEach((cat) => {
      stats.set(cat.id, { today: 0, week: 0, total: 0 });
    });

    timeEntries.forEach((entry) => {
      const current = stats.get(entry.categoryId) ?? { today: 0, week: 0, total: 0 };
      const duration = entry.duration ?? 0;

      current.total += duration;

      if (isToday(entry.startTime)) {
        current.today += duration;
      }

      if (isThisWeek(entry.startTime)) {
        current.week += duration;
      }

      stats.set(entry.categoryId, current);
    });

    return stats;
  }, [categories, timeEntries]);

  const renderIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || Folder;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Categorias</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Visualize suas categorias e estatísticas de tempo
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 py-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-sm">
            <p className="font-medium text-primary">Categorias Especializadas</p>
            <p className="mt-1 text-muted-foreground">
              Cada categoria possui um tipo de registro personalizado. Selecione uma categoria no
              timer para ver suas funcionalidades específicas.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category: Category) => {
          const stats = categoryStats.get(category.id);

          return (
            <Card key={category.id} className="group relative transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: category.color }}
                    >
                      {renderIcon(category.icon)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: `${category.color}20`,
                          color: category.color,
                        }}
                      >
                        {typeLabels[category.type]}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Descrição */}
                  <p className="text-sm text-muted-foreground">{category.description}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3 text-sm">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Hoje</p>
                      <p className="font-semibold">{formatDuration(stats?.today ?? 0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Semana</p>
                      <p className="font-semibold">{formatDuration(stats?.week ?? 0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-semibold">{formatDuration(stats?.total ?? 0)}</p>
                    </div>
                  </div>

                  {/* Tasks Section - Apenas para categorias do tipo task */}
                  {(category.type === 'task' || category.type === 'simple') && (
                    <div className="border-t border-border pt-3">
                      <button
                        onClick={() =>
                          setExpandedTasksId(expandedTasksId === category.id ? null : category.id)
                        }
                        className="flex w-full items-center justify-between text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <span>
                          {category.type === 'task' ? 'Tarefas Salvas' : 'Itens do Checklist'}
                        </span>
                        {expandedTasksId === category.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>

                      {expandedTasksId === category.id && (
                        <div className="mt-3">
                          <TaskList
                            categoryId={category.id}
                            categoryColor={category.color}
                            userId="user-1"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Exercise Section - Para categoria Treino */}
                  {category.type === 'workout' && (
                    <div className="border-t border-border pt-3">
                      <button
                        onClick={() =>
                          setExpandedTasksId(expandedTasksId === category.id ? null : category.id)
                        }
                        className="flex w-full items-center justify-between text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <span>Exercícios e Rotinas</span>
                        {expandedTasksId === category.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>

                      {expandedTasksId === category.id && (
                        <div className="mt-3">
                          <ExerciseManager categoryColor={category.color} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Empty State - Não deve acontecer com categorias fixas */}
        {categories.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mb-2 text-lg font-medium">Erro ao carregar categorias</h3>
              <p className="text-muted-foreground">
                Houve um problema ao carregar as categorias. Recarregue a página.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
