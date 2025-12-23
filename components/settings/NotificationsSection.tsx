'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, AlertCircle } from 'lucide-react';

interface NotificationsSectionProps {
  notificationsEnabled: boolean;
  pushEnabled: boolean;
  pushPermission: NotificationPermission | null;
  isPushSupported: boolean;
  onNotificationsChange: (enabled: boolean) => void;
  onPushToggle: () => void;
}

/**
 * NotificationsSection - Seção de notificações nas configurações
 */
export function NotificationsSection({
  notificationsEnabled,
  pushEnabled,
  pushPermission,
  isPushSupported,
  onNotificationsChange,
  onPushToggle,
}: NotificationsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações
        </CardTitle>
        <CardDescription>Controle como você recebe notificações</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Notificações in-app */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Label htmlFor="notifications">Notificações no app</Label>
            <p className="text-sm text-muted-foreground">Receba alertas sobre timers e eventos</p>
          </div>
          <Switch
            id="notifications"
            checked={notificationsEnabled}
            onCheckedChange={onNotificationsChange}
          />
        </div>

        {/* Push Notifications */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Label htmlFor="push-notifications">Notificações push</Label>
            <p className="text-sm text-muted-foreground">
              {isPushSupported
                ? 'Receba notificações mesmo com o app fechado'
                : 'Não suportado neste navegador'}
            </p>
            {pushPermission === 'denied' && (
              <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                Permissão negada. Altere nas configurações do navegador.
              </p>
            )}
          </div>
          <Switch
            id="push-notifications"
            checked={pushEnabled}
            onCheckedChange={onPushToggle}
            disabled={!isPushSupported || pushPermission === 'denied'}
          />
        </div>
      </CardContent>
    </Card>
  );
}
