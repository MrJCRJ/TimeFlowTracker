'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, AlertCircle } from 'lucide-react';

interface DangerZoneSectionProps {
  isClearing: boolean;
  onClearData: () => void;
}

/**
 * DangerZoneSection - Seção de ações perigosas nas configurações
 */
export function DangerZoneSection({ isClearing, onClearData }: DangerZoneSectionProps) {
  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          Zona de Perigo
        </CardTitle>
        <CardDescription>Ações irreversíveis - tenha cuidado</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Limpar todos os dados</p>
            <p className="text-sm text-muted-foreground">
              Remove permanentemente todas as categorias, registros de tempo e configurações.
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={onClearData}
            disabled={isClearing}
            className="flex-shrink-0"
          >
            {isClearing ? (
              <>
                <Trash2 className="mr-2 h-4 w-4 animate-spin" />
                Limpando...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Tudo
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
