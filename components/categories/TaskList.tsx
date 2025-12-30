'use client';

import React, { useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { Plus, Trash2, Check, X, ListTodo } from 'lucide-react';
import type { Task } from '@/types';

interface TaskListProps {
  categoryId: string;
  categoryColor: string;
  userId: string;
}

export function TaskList({ categoryId, categoryColor, userId }: TaskListProps) {
  const { getTasksByCategory, addTask, updateTask, deleteTask } = useTaskStore();
  const [newTaskName, setNewTaskName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const tasks = getTasksByCategory(categoryId);
  const activeTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted);

  const handleAddTask = () => {
    if (!newTaskName.trim()) return;

    addTask(
      {
        name: newTaskName.trim(),
        categoryId,
      },
      userId
    );

    setNewTaskName('');
    setIsAdding(false);
  };

  const handleToggleComplete = (task: Task) => {
    updateTask(task.id, { isCompleted: !task.isCompleted });
  };

  const handleStartEdit = (task: Task) => {
    setEditingId(task.id);
    setEditingName(task.name);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editingName.trim()) return;

    updateTask(editingId, { name: editingName.trim() });
    setEditingId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ListTodo className="h-4 w-4" />
          <span>Tarefas ({activeTasks.length})</span>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary transition-colors hover:bg-primary/10"
          >
            <Plus className="h-3 w-3" />
            Adicionar
          </button>
        )}
      </div>

      {/* Adicionar nova tarefa */}
      {isAdding && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTask();
              if (e.key === 'Escape') {
                setIsAdding(false);
                setNewTaskName('');
              }
            }}
            placeholder="Nome da tarefa..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
          <button
            onClick={handleAddTask}
            disabled={!newTaskName.trim()}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setIsAdding(false);
              setNewTaskName('');
            }}
            className="rounded-lg bg-muted px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Lista de tarefas ativas */}
      {activeTasks.length > 0 && (
        <div className="space-y-1">
          {activeTasks.map((task) => (
            <div
              key={task.id}
              className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
            >
              {/* Checkbox */}
              <button
                onClick={() => handleToggleComplete(task)}
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors hover:border-primary"
                style={{ borderColor: categoryColor }}
              >
                {task.isCompleted && <Check className="h-3 w-3" style={{ color: categoryColor }} />}
              </button>

              {/* Nome */}
              {editingId === task.id ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  onBlur={handleSaveEdit}
                  className="flex-1 rounded border border-border bg-background px-2 py-0.5 text-sm focus:border-primary focus:outline-none"
                  autoFocus
                />
              ) : (
                <span
                  onClick={() => handleStartEdit(task)}
                  className="flex-1 cursor-pointer truncate text-sm"
                >
                  {task.name}
                </span>
              )}

              {/* Ações */}
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="flex-shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tarefas concluídas */}
      {completedTasks.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="mb-2 text-xs text-muted-foreground">Concluídas ({completedTasks.length})</p>
          <div className="space-y-1">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="group flex items-center gap-2 rounded-lg px-2 py-1.5 opacity-60 transition-colors hover:bg-muted/50"
              >
                <button
                  onClick={() => handleToggleComplete(task)}
                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded transition-colors"
                  style={{ backgroundColor: `${categoryColor}30` }}
                >
                  <Check className="h-3 w-3" style={{ color: categoryColor }} />
                </button>
                <span className="flex-1 truncate text-sm line-through">{task.name}</span>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="flex-shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {tasks.length === 0 && !isAdding && (
        <p className="py-2 text-center text-xs text-muted-foreground">Nenhuma tarefa ainda</p>
      )}
    </div>
  );
}

export default TaskList;
