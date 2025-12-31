'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Briefcase,
  Check,
  Settings,
  DollarSign,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useJobStore, JOB_COLORS } from '@/stores/jobStore';
import type { Job } from '@/types/entries/work';

interface WorkEntryPanelProps {
  categoryColor: string;
  selectedJobId: string | null;
  onJobSelect: (jobId: string | null) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  totalSecondsWorked?: number; // Total de segundos trabalhados neste trabalho (para calcular R$/h)
  className?: string;
}

type TabType = 'select' | 'earnings' | 'manage';

/**
 * Painel para categoria Trabalho
 * Permite selecionar trabalho/projeto, registrar ganhos e gerenciar trabalhos
 * O valor/hora é CALCULADO automaticamente: totalEarnings / totalHoursWorked
 */
export function WorkEntryPanel({
  categoryColor,
  selectedJobId,
  onJobSelect,
  isExpanded,
  onToggleExpand,
  totalSecondsWorked = 0,
  className,
}: WorkEntryPanelProps) {
  const {
    jobs,
    addJob,
    updateJob,
    deleteJob,
    getActiveJobs,
    addEarning,
    deleteEarning,
    getTotalEarnings,
    calculateHourlyRate,
  } = useJobStore();

  const [activeTab, setActiveTab] = useState<TabType>('select');
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [newJobName, setNewJobName] = useState('');
  const [newJobColor, setNewJobColor] = useState<string>(JOB_COLORS[0]);

  // Estados para adicionar ganho
  const [isAddingEarning, setIsAddingEarning] = useState(false);
  const [newEarningAmount, setNewEarningAmount] = useState('');
  const [newEarningDescription, setNewEarningDescription] = useState('');

  const activeJobs = getActiveJobs();
  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  // Calcular estatísticas do trabalho selecionado
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const selectedJobTotalEarnings = selectedJob ? getTotalEarnings(selectedJob.id, currentMonth) : 0;
  const selectedJobHourlyRate = selectedJob
    ? calculateHourlyRate(selectedJob.id, totalSecondsWorked, currentMonth)
    : null;

  const handleAddJob = () => {
    if (!newJobName.trim()) return;

    const job = addJob({
      name: newJobName.trim(),
      color: newJobColor,
    });

    onJobSelect(job.id);
    setNewJobName('');
    setNewJobColor(JOB_COLORS[0]);
    setIsAddingJob(false);
  };

  const handleToggleJobActive = (job: Job) => {
    updateJob(job.id, { isActive: !job.isActive });
    if (job.id === selectedJobId && job.isActive) {
      onJobSelect(null);
    }
  };

  const handleAddEarning = () => {
    if (!selectedJobId || !newEarningAmount) return;

    const amount = parseFloat(newEarningAmount);
    if (isNaN(amount) || amount <= 0) return;

    addEarning(selectedJobId, {
      amount,
      date: new Date().toISOString(),
      description: newEarningDescription.trim() || undefined,
    });

    setNewEarningAmount('');
    setNewEarningDescription('');
    setIsAddingEarning(false);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatHours = (seconds: number) => {
    const hours = seconds / 3600;
    return hours.toFixed(1);
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
          {/* Tabs: Selecionar | Ganhos | Gerenciar */}
          <div className="mb-2 flex gap-2 border-b border-border/30 py-2">
            <button
              type="button"
              onClick={() => setActiveTab('select')}
              className={cn(
                'rounded px-2 py-1 text-xs transition-colors',
                activeTab === 'select'
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Selecionar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('earnings')}
              disabled={!selectedJobId}
              className={cn(
                'flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors',
                activeTab === 'earnings'
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground',
                !selectedJobId && 'cursor-not-allowed opacity-50'
              )}
            >
              <DollarSign className="h-3 w-3" />
              Ganhos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              className={cn(
                'flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors',
                activeTab === 'manage'
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Settings className="h-3 w-3" />
              Gerenciar
            </button>
          </div>

          {activeTab === 'select' && (
            /* Seleção de trabalho */
            <div className="space-y-1">
              {activeJobs.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Nenhum trabalho cadastrado. Adicione um trabalho para começar.
                </p>
              ) : (
                activeJobs.map((job) => {
                  const jobTotalEarnings = getTotalEarnings(job.id, currentMonth);
                  return (
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
                        {jobTotalEarnings > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(jobTotalEarnings)} este mês
                          </p>
                        )}
                      </div>
                      {selectedJobId === job.id && (
                        <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                      )}
                    </button>
                  );
                })
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
          )}

          {activeTab === 'earnings' && selectedJob && (
            /* Ganhos do trabalho selecionado */
            <div className="space-y-3">
              {/* Resumo */}
              <div className="rounded-lg bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Ganhos este mês</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(selectedJobTotalEarnings)}
                    </p>
                  </div>
                  {selectedJobHourlyRate !== null && (
                    <div className="text-right">
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        Valor/hora
                      </p>
                      <p className="text-sm font-semibold">{formatCurrency(selectedJobHourlyRate)}/h</p>
                      <p className="text-xs text-muted-foreground">
                        ({formatHours(totalSecondsWorked)}h trabalhadas)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de ganhos */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Ganhos registrados</p>
                {selectedJob.earnings.length === 0 ? (
                  <p className="py-2 text-center text-xs text-muted-foreground">
                    Nenhum ganho registrado ainda.
                  </p>
                ) : (
                  <div className="max-h-32 space-y-1 overflow-y-auto">
                    {selectedJob.earnings
                      .filter((e) => e.date.startsWith(currentMonth))
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((earning) => (
                        <div
                          key={earning.id}
                          className="flex items-center justify-between rounded bg-muted/30 px-2 py-1.5"
                        >
                          <div>
                            <p className="text-sm font-medium">{formatCurrency(earning.amount)}</p>
                            {earning.description && (
                              <p className="text-xs text-muted-foreground">{earning.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(earning.date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteEarning(selectedJob.id, earning.id)}
                            className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Adicionar ganho */}
              {!isAddingEarning ? (
                <button
                  type="button"
                  onClick={() => setIsAddingEarning(true)}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-lg py-2',
                    'text-sm text-muted-foreground',
                    'border border-dashed border-muted-foreground/30',
                    'hover:border-primary hover:text-primary',
                    'transition-colors'
                  )}
                >
                  <Plus className="h-4 w-4" />
                  Registrar ganho
                </button>
              ) : (
                <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-2">
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="number"
                      value={newEarningAmount}
                      onChange={(e) => setNewEarningAmount(e.target.value)}
                      placeholder="Valor (R$)"
                      className={cn(
                        'w-full rounded-md py-2 pl-7 pr-3 text-sm',
                        'border border-input bg-background',
                        'focus:outline-none focus:ring-2 focus:ring-primary/50'
                      )}
                      min={0}
                      step={0.01}
                      autoFocus
                    />
                  </div>
                  <input
                    type="text"
                    value={newEarningDescription}
                    onChange={(e) => setNewEarningDescription(e.target.value)}
                    placeholder="Descrição (opcional)"
                    className={cn(
                      'w-full rounded-md px-3 py-2 text-sm',
                      'border border-input bg-background',
                      'focus:outline-none focus:ring-2 focus:ring-primary/50'
                    )}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddEarning}
                      disabled={!newEarningAmount || parseFloat(newEarningAmount) <= 0}
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
                        setIsAddingEarning(false);
                        setNewEarningAmount('');
                        setNewEarningDescription('');
                      }}
                      className={cn('rounded-md px-3 py-2 text-sm', 'transition-colors hover:bg-muted')}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'manage' && (
            /* Gerenciamento de trabalhos */
            <div className="space-y-1">
              {jobs.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Nenhum trabalho cadastrado.
                </p>
              ) : (
                jobs.map((job) => {
                  const jobTotalEarnings = getTotalEarnings(job.id);
                  return (
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
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(jobTotalEarnings)} total
                        </p>
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
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
