'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CloudUpload, RefreshCw, CheckCircle, XCircle, Clock, Database } from 'lucide-react';

interface SyncSectionProps {
  isConnected: boolean;
  lastSync: string | null;
  isSyncing: boolean;
  syncStatus: 'idle' | 'success' | 'error';
  autoSync: boolean;
  onAutoSyncChange: (enabled: boolean) => void;
  onSyncNow: () => void;
  onExportData: () => void;
  dataStats: {
    categories: number;
    timeEntries: number;
  };
}

/**
 * SyncSection - Seção de sincronização com Google Drive
 */
export function SyncSection({
  isConnected,
  lastSync,
  isSyncing,
  syncStatus,
  autoSync,
  onAutoSyncChange,
  onSyncNow,
  onExportData,
  dataStats,
}: SyncSectionProps) {
  const getSyncIcon = () => {
    if (isSyncing) {
      return <RefreshCw className="h-5 w-5 animate-spin text-primary" />;
    }
    if (syncStatus === 'success') {
      return <CheckCircle className="h-5 w-5 text-success" />;
    }
    if (syncStatus === 'error') {
      return <XCircle className="h-5 w-5 text-destructive" />;
    }
    return <CloudUpload className="h-5 w-5" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getSyncIcon()}
          Sincronização
        </CardTitle>
        <CardDescription>Sincronize seus dados com o Google Drive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status da conexão */}
        <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${isConnected ? 'bg-success' : 'bg-muted-foreground'}`}
            />
            <span className="text-sm">
              {isConnected ? 'Conectado ao Google Drive' : 'Não conectado'}
            </span>
          </div>
          {lastSync && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Última sync: {lastSync}
            </div>
          )}
        </div>

        {/* Estatísticas de dados */}
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{dataStats.categories}</p>
              <p className="text-xs text-muted-foreground">Categorias</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{dataStats.timeEntries}</p>
              <p className="text-xs text-muted-foreground">Registros</p>
            </div>
          </div>
        </div>

        {/* Auto sync */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Label htmlFor="auto-sync">Sincronização automática</Label>
            <p className="text-sm text-muted-foreground">
              Sincronizar automaticamente a cada 5 minutos
            </p>
          </div>
          <Switch
            id="auto-sync"
            checked={autoSync}
            onCheckedChange={onAutoSyncChange}
            disabled={!isConnected}
          />
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={onSyncNow} disabled={isSyncing || !isConnected} className="flex-1">
            {isSyncing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <CloudUpload className="mr-2 h-4 w-4" />
                Sincronizar Agora
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onExportData} className="flex-1">
            <Database className="mr-2 h-4 w-4" />
            Exportar JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
