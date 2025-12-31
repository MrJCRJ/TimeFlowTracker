'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, ChevronUp, ChevronDown, Briefcase, Check, Settings, DollarSign } from 'lucide-react';
import { useJobStore, JOB_COLORS } from '@/stores/jobStore';
import type { Job } from '@/types/entries/work';

interface WorkEntryPanelProps {
  categoryColor: string;
  selectedJobId: string | null;
  onJobSelect: (jobId: string | null) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  className?: string;
}

/**
 * Painel para categoria Trabalho
 * Permite selecionar trabalho/projeto e gerenciar trabalhos
 */
export function WorkEntryPanel({
  categoryColor,
  selectedJobId,
  onJobSelect,
  isExpanded,
  onToggleExpand,
  className,
}: WorkEntryPanelProps) {
  const { jobs, addJob, updateJob, deleteJob, getActiveJobs } = useJobStore();
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [newJobName, setNewJobName] = useState('');
  const [newJobRate, setNewJobRate] = useState('');
  const [newJobColor, setNewJobColor] = useState<string>(JOB_COLORS[0]);

  const activeJobs = getActiveJobs();
  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  const handleAddJob = () => {
    if (!newJobName.trim()) return;

    const job = addJob({
      name: newJobName.trim(),
      hourlyRate: newJobRate ? parseFloat(newJobRate) : undefined,
      color: newJobColor,
    });

    onJobSelect(job.id);
    setNewJobName('');
    setNewJobRate('');
    setNewJobColor(JOB_COLORS[0]);
    setIsAddingJob(false);
  };

  const handleToggleJobActive = (job: Job) => {
    updateJob(job.id, { isActive: !job.isActive });
    if (job.id === selectedJobId && job.isActive) {
      onJobSelect(null);
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
          <Briefcase className="h-4 w-4" style={{ color: categoryColor }} />
          <span className="text-sm font-medium">Trabalho</span>
          {selectedJob && (
            <span
              className="rounded-full px-1.5 py-0.5 text-xs"
              style={{ backgroundColor: `${selectedJob.color}20`, color: selectedJob.color }}
            >
              {selectedJob.name}
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
          {/* Tabs: Selecionar | Gerenciar */}
          <div className="mb-2 flex gap-2 border-b border-border/30 py-2">
            <button
              type="button"
              onClick={() => setIsManaging(false)}
              className={cn(
                'rounded px-2 py-1 text-xs transition-colors',
                !isManaging
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Selecionar
            </button>
            <button
              type="button"
              onClick={() => setIsManaging(true)}
              className={cn(
                'flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors',
                isManaging
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Settings className="h-3 w-3" />
              Gerenciar
            </button>
          </div>

          {!isManaging ? (
            /* Seleção de trabalho */
            <div className="space-y-1">
              {activeJobs.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Nenhum trabalho cadastrado. Adicione um trabalho para começar.
                </p>
              ) : (
                activeJobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => onJobSelect(selectedJobId === job.id ? null : job.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-3 py-2',
                      'text-left transition-all',
                      selectedJobId === job.id
                        ? 'bg-primary/10 ring-1 ring-primary/30'
                        : 'bg-muted/50 hover:bg-muted'
                    )}
                  >
                    <div
                      className="h-3 w-3 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: job.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{job.name}</p>
                      {job.hourlyRate && (
                        <p className="text-xs text-muted-foreground">
                          R$ {job.hourlyRate.toFixed(2)}/h
                        </p>
                      )}
                    </div>
                    {selectedJobId === job.id && (
                      <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    )}
                  </button>
                ))
              )}

              {/* Adicionar trabalho rápido */}
              {!isAddingJob ? (
                <button
                  type="button"
                  onClick={() => setIsAddingJob(true)}
                  className={cn(
                    'mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2',
                    'text-sm text-muted-foreground',
                    'border border-dashed border-muted-foreground/30',
                    'hover:border-primary hover:text-primary',
                    'transition-colors'
                  )}
                >
                  <Plus className="h-4 w-4" />
                  Novo trabalho
                </button>
              ) : (
                <div className="mt-2 space-y-2 rounded-lg border border-border bg-muted/30 p-2">
                  <input
                    type="text"
                    value={newJobName}
                    onChange={(e) => setNewJobName(e.target.value)}
                    placeholder="Nome do trabalho..."
                    className={cn(
                      'w-full rounded-md px-3 py-2 text-sm',
                      'border border-input bg-background',
                      'focus:outline-none focus:ring-2 focus:ring-primary/50'
                    )}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddJob();
                      if (e.key === 'Escape') setIsAddingJob(false);
                    }}
                  />
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="number"
                        value={newJobRate}
                        onChange={(e) => setNewJobRate(e.target.value)}
                        placeholder="Valor/hora"
                        className={cn(
                          'w-full rounded-md py-2 pl-7 pr-3 text-sm',
                          'border border-input bg-background',
                          'focus:outline-none focus:ring-2 focus:ring-primary/50'
                        )}
                        min={0}
                        step={0.01}
                      />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {JOB_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewJobColor(color)}
                        className={cn(
                          'h-6 w-6 rounded-full transition-transform',
                          newJobColor === color && 'ring-2 ring-primary ring-offset-2'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddJob}
                      disabled={!newJobName.trim()}
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
                      onClick={() => {
                        setIsAddingJob(false);
                        setNewJobName('');
                        setNewJobRate('');
                      }}
                      className={cn(
                        'rounded-md px-3 py-2 text-sm',
                        'transition-colors hover:bg-muted'
                      )}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Gerenciamento de trabalhos */
            <div className="space-y-1">
              {jobs.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Nenhum trabalho cadastrado.
                </p>
              ) : (
                jobs.map((job) => (
                  <div
                    key={job.id}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2',
                      'bg-muted/50',
                      !job.isActive && 'opacity-50'
                    )}
                  >
                    <div
                      className="h-3 w-3 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: job.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{job.name}</p>
                      {job.hourlyRate && (
                        <p className="text-xs text-muted-foreground">
                          R$ {job.hourlyRate.toFixed(2)}/h
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleJobActive(job)}
                      className={cn(
                        'rounded px-2 py-1 text-xs',
                        job.isActive
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {job.isActive ? 'Ativo' : 'Inativo'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteJob(job.id)}
                      className="rounded px-2 py-1 text-xs text-destructive transition-colors hover:bg-destructive/20"
                    >
                      Excluir
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
