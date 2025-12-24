'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useManualSync } from '@/hooks/useManualSync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CloudUpload, CloudDownload, Loader2 } from 'lucide-react';

/**
 * Componente para sincronização manual com Google Drive
 * Substitui o sistema automático por botões manuais
 */
export function ManualSyncSection() {
  const { data: session } = useSession();
  const { backupToDrive, restoreFromDrive, isBackingUp, isRestoring } = useManualSync();

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sincronização com Google Drive</CardTitle>
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
        <CardTitle>Sincronização com Google Drive</CardTitle>
        <CardDescription>
          Faça backup dos seus dados ou restaure de um backup anterior.
          Todos os dados ficam armazenados no seu Google Drive pessoal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Botão de Backup */}
          <div className="space-y-2">
            <h4 className="font-medium">Fazer Backup</h4>
            <p className="text-sm text-muted-foreground">
              Salva todos os seus dados atuais no Google Drive
            </p>
            <Button
              onClick={backupToDrive}
              disabled={isBackingUp || isRestoring}
              className="w-full"
              variant="default"
            >
              {isBackingUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fazendo Backup...
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
          <div className="space-y-2">
            <h4 className="font-medium">Restaurar Dados</h4>
            <p className="text-sm text-muted-foreground">
              Carrega dados salvos anteriormente do Google Drive
            </p>
            <Button
              onClick={restoreFromDrive}
              disabled={isBackingUp || isRestoring}
              className="w-full"
              variant="outline"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restaurando...
                </>
              ) : (
                <>
                  <CloudDownload className="mr-2 h-4 w-4" />
                  Restaurar Dados
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h5 className="font-medium mb-2">ℹ️ Sobre a Sincronização</h5>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Os dados ficam armazenados apenas no seu Google Drive</li>
            <li>• Você controla quando fazer backup ou restaurar</li>
            <li>• Restauração sobrescreve todos os dados locais atuais</li>
            <li>• Funciona offline - sincronização é opcional</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}