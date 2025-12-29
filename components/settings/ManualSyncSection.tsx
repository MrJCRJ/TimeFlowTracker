'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useManualSync } from '@/hooks/useManualSync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CloudUpload, CloudDownload, Loader2, Info, Smartphone } from 'lucide-react';

/**
 * Componente para sincronização manual com Google Drive
 */
export function ManualSyncSection() {
  const { data: session } = useSession();
  const { backupToDrive, restoreFromDrive, isBackingUp, isRestoring } = useManualSync();

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudUpload className="h-5 w-5" />
            Google Drive
          </CardTitle>
          <CardDescription>
            Faça login para sincronizar seus dados com o Google Drive
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudUpload className="h-5 w-5 text-primary" />
          Google Drive
        </CardTitle>
        <CardDescription>
          Faça backup ou restaure seus dados do Google Drive. O app funciona 100% offline - a
          sincronização é opcional.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Botões de ação */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Botão de Backup */}
          <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CloudUpload className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Fazer Backup</h4>
                <p className="text-xs text-muted-foreground">Salvar no Drive</p>
              </div>
            </div>
            <Button
              onClick={backupToDrive}
              disabled={isBackingUp || isRestoring}
              className="w-full"
              size="lg"
            >
              {isBackingUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CloudUpload className="mr-2 h-4 w-4" />
                  Fazer Backup
                </>
              )}
            </Button>
          </div>

          {/* Botão de Restauração */}
          <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                <CloudDownload className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h4 className="font-medium">Restaurar</h4>
                <p className="text-xs text-muted-foreground">Baixar do Drive</p>
              </div>
            </div>
            <Button
              onClick={restoreFromDrive}
              disabled={isBackingUp || isRestoring}
              className="w-full"
              variant="outline"
              size="lg"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restaurando...
                </>
              ) : (
                <>
                  <CloudDownload className="mr-2 h-4 w-4" />
                  Restaurar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="rounded-xl bg-muted/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <h5 className="text-sm font-medium">Como funciona</h5>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Smartphone className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>O app funciona 100% offline - seus dados ficam salvos no dispositivo</span>
            </li>
            <li className="flex items-start gap-2">
              <CloudUpload className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>Use o backup para salvar uma cópia no seu Google Drive</span>
            </li>
            <li className="flex items-start gap-2">
              <CloudDownload className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>Restauração sobrescreve os dados locais com os do Drive</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
