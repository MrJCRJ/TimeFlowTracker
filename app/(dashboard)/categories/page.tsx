'use client';

import React, { useState, useEffect } from 'react';
import { useCategoryStore } from '@/stores/categoryStore';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTimerStore } from '@/stores/timerStore';
import { formatDuration, isThisWeek, isToday } from '@/lib/utils';
import { Plus, Edit, Trash2, Clock } from 'lucide-react';
import type { Category } from '@/types';

export default function CategoriesPage() {
  const {
    categories,
    isLoading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    initializeDefaults,
  } = useCategoryStore();

  const { timeEntries } = useTimerStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Initialize default categories
  useEffect(() => {
    initializeDefaults('user-1');
  }, [initializeDefaults]);

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

  const handleCreateCategory = async (data: { name: string; color: string; icon: string }) => {
    addCategory(data, 'user-1');
    setIsFormOpen(false);
  };

  const handleUpdateCategory = (data: { name: string; color: string }) => {
    if (editingCategory) {
      updateCategory(editingCategory.id, data);
      setEditingCategory(null);
    }
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategory(id);
    setDeletingId(null);
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(false);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categorias</h1>
          <p className="mt-1 text-muted-foreground">Gerencie suas categorias de tempo</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} disabled={isFormOpen}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Create Form */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Nova Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryForm onSubmit={handleCreateCategory} onCancel={handleCancelForm} />
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      {editingCategory && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Editar Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryForm
              category={editingCategory}
              onSubmit={handleUpdateCategory}
              onCancel={handleCancelForm}
            />
          </CardContent>
        </Card>
      )}

      {/* Categories Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const stats = categoryStats.get(category.id);
          const isDeleting = deletingId === category.id;

          return (
            <Card
              key={category.id}
              className={`group relative transition-all ${
                isDeleting ? 'border-destructive bg-destructive/5' : ''
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full ring-2 ring-offset-2 ring-offset-background"
                      style={{
                        backgroundColor: category.color,
                      }}
                    />
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditClick(category)}
                      disabled={!!editingCategory}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletingId(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Delete Confirmation */}
                {isDeleting ? (
                  <div className="space-y-3">
                    <p className="text-sm text-destructive">
                      Tem certeza que deseja excluir esta categoria?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        Excluir
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeletingId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Hoje</p>
                        <p className="font-medium">{formatDuration(stats?.today ?? 0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Semana</p>
                        <p className="font-medium">{formatDuration(stats?.week ?? 0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-medium">{formatDuration(stats?.total ?? 0)}</p>
                      </div>
                    </div>

                    {/* Created date */}
                    <p className="text-xs text-muted-foreground">
                      Criada em {new Date(category.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Empty State */}
        {categories.length === 0 && !isLoading && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mb-2 text-lg font-medium">Nenhuma categoria ainda</h3>
              <p className="mb-4 text-muted-foreground">
                Crie sua primeira categoria para começar a rastrear seu tempo.
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Categoria
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
