'use client';

import { useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTimerStore } from '@/stores/timerStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useJobStore } from '@/stores/jobStore';
import { useRecipeStore } from '@/stores/recipeStore';
import { useCommitmentStore } from '@/stores/commitmentStore';
import { useTaskStore } from '@/stores/taskStore';
import { useAutocompleteStore } from '@/stores/autocompleteStore';
import type { TimeEntry } from '@/types';

/**
 * Interface para todos os dados sincronizáveis
 */
interface SyncData {
  timeEntries: TimeEntry[];
  jobs: unknown[];
  recipes: unknown[];
  commitments: unknown[];
  tasks: unknown[];
  autocomplete: {
    exerciseNames: string[];
    taskNames: string[];
  };
}

/**
 * Hook para sincronização MANUAL com Google Drive
 * Permite fazer backup e restaurar dados manualmente
 *
 * Sincroniza todos os stores:
 * - timeEntries (registros de tempo)
 * - jobs (trabalhos e ganhos)
 * - recipes (receitas)
 * - commitments (compromissos)
 * - tasks (tarefas)
 * - autocomplete (histórico de autocomplete)
 */
export function useManualSync() {
  const { data: session } = useSession();
  const { addNotification } = useNotificationStore();

  // Estados
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Timer Store
  const timeEntries = useTimerStore((s) => s.timeEntries);
  const setTimeEntries = useTimerStore((s) => s.setTimeEntries);

  // Job Store
  const jobs = useJobStore((s) => s.jobs);
  const setJobs = useJobStore((s) => s.setJobs);

  // Recipe Store
  const recipes = useRecipeStore((s) => s.recipes);
  const setRecipes = useRecipeStore((s) => s.setRecipes);

  // Commitment Store
  const commitments = useCommitmentStore((s) => s.commitments);
  const setCommitments = useCommitmentStore((s) => s.setCommitments);

  // Task Store
  const tasks = useTaskStore((s) => s.tasks);
  const setTasks = useTaskStore((s) => s.setTasks);

  // Autocomplete Store
  const exerciseNames = useAutocompleteStore((s) => s.exerciseNames);
  const taskNames = useAutocompleteStore((s) => s.taskNames);
  const setAutocomplete = useAutocompleteStore((s) => s.setAutocomplete);

  /**
   * Coleta todos os dados locais para backup
   */
  const getLocalData = useCallback((): SyncData => {
    return {
      timeEntries,
      jobs,
      recipes,
      commitments,
      tasks,
      autocomplete: {
        exerciseNames,
        taskNames,
      },
    };
  }, [timeEntries, jobs, recipes, commitments, tasks, exerciseNames, taskNames]);

  /**
   * Faz backup manual dos dados locais para o Drive
   */
  const backupToDrive = useCallback(async (): Promise<boolean> => {
    if (!session?.accessToken) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Você precisa estar logado para fazer backup',
      });
      return false;
    }

    setIsBackingUp(true);

    try {
      const localData = getLocalData();

      const response = await fetch('/api/drive/sync/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeEntries: localData.timeEntries,
          jobs: localData.jobs,
          recipes: localData.recipes,
          commitments: localData.commitments,
          tasks: localData.tasks,
          autocomplete: localData.autocomplete,
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar dados para o Drive');
      }

      addNotification({
        type: 'success',
        title: 'Backup Concluído',
        message: 'Todos os seus dados foram salvos no Google Drive',
      });
      return true;
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro no Backup',
        message: error instanceof Error ? error.message : 'Falha ao salvar dados no Drive',
      });
      return false;
    } finally {
      setIsBackingUp(false);
    }
  }, [session?.accessToken, getLocalData, addNotification]);

  /**
   * Restaura dados do Drive (sobrescreve dados locais)
   */
  const restoreFromDrive = useCallback(async (): Promise<boolean> => {
    if (!session?.accessToken) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Você precisa estar logado para restaurar dados',
      });
      return false;
    }

    // Confirmação antes de sobrescrever
    const confirmRestore = window.confirm(
      'ATENÇÃO: Isso irá sobrescrever TODOS os seus dados locais com os dados do Google Drive. Deseja continuar?'
    );

    if (!confirmRestore) {
      return false;
    }

    setIsRestoring(true);

    try {
      const response = await fetch('/api/drive/sync/download');

      if (!response.ok) {
        throw new Error('Falha ao baixar dados do Drive');
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Restaurar todos os dados
        if (result.data.timeEntries?.length > 0) {
          setTimeEntries(result.data.timeEntries as TimeEntry[]);
        }

        if (result.data.jobs?.length > 0) {
          setJobs(result.data.jobs);
        }

        if (result.data.recipes?.length > 0) {
          setRecipes(result.data.recipes);
        }

        if (result.data.commitments?.length > 0) {
          setCommitments(result.data.commitments);
        }

        if (result.data.tasks?.length > 0) {
          setTasks(result.data.tasks);
        }

        if (result.data.autocomplete) {
          setAutocomplete(result.data.autocomplete);
        }

        addNotification({
          type: 'success',
          title: 'Restauração Concluída',
          message: 'Todos os dados restaurados do Google Drive',
        });
        return true;
      } else {
        addNotification({
          type: 'warning',
          title: 'Nenhum dado encontrado',
          message: 'Não há dados salvos no Google Drive',
        });
        return false;
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro na Restauração',
        message: error instanceof Error ? error.message : 'Falha ao carregar dados do Drive',
      });
      return false;
    } finally {
      setIsRestoring(false);
    }
  }, [
    session?.accessToken,
    setTimeEntries,
    setJobs,
    setRecipes,
    setCommitments,
    setTasks,
    setAutocomplete,
    addNotification,
  ]);

  return {
    backupToDrive,
    restoreFromDrive,
    isBackingUp,
    isRestoring,
  };
}
