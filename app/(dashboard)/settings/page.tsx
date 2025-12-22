'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  User,
  Bell,
  Moon,
  Sun,
  CloudUpload,
  Trash2,
  LogOut,
  Shield,
  Database,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useCategoryStore } from '@/stores/categoryStore';
import { useTimerStore } from '@/stores/timerStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useTheme } from '@/stores/themeStore';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { categories, reset: resetCategories } = useCategoryStore();
  const { timeEntries, reset: resetTimer } = useTimerStore();
  const { addNotification } = useNotificationStore();
  const { theme, setTheme, isDark } = useTheme();
  const {
    enabled: pushEnabled,
    permission,
    isSupported,
    toggleNotifications,
  } = usePushNotifications();

  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [driveConnected, setDriveConnected] = useState(false);

  // Verificar status da conexão com Google Drive
  useEffect(() => {
    // Só executar no cliente
    if (typeof window === 'undefined') return;

    const checkDriveConnection = async () => {
      if (!session?.accessToken) {
        setDriveConnected(false);
        return;
      }

      try {
        const response = await fetch('/api/drive/status');
        const data = await response.json();
        setDriveConnected(data.connected);
        if (data.lastBackup) {
          setLastSync(new Date(data.lastBackup).toLocaleString('pt-BR'));
        }
      } catch (error) {
        console.error('Erro ao verificar status do Drive:', error);
        setDriveConnected(false);
      }
    };

    checkDriveConnection();
  }, [session]);

  const handleClearData = async () => {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
      setIsClearing(true);
      try {
        resetCategories();
        resetTimer();
        localStorage.clear();
        alert('Dados limpos com sucesso!');
      } catch (error) {
        console.error('Erro ao limpar dados:', error);
        alert('Erro ao limpar dados');
      } finally {
        setIsClearing(false);
      }
    }
  };

  const handleSyncNow = async () => {
    if (!session) {
      addNotification({
        type: 'error',
        title: 'Erro de autenticação',
        message: 'Você precisa estar logado para sincronizar com o Google Drive.',
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus('idle');

    try {
      const response = await fetch('/api/drive/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories,
          timeEntries,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSyncStatus('success');
        setLastSync(new Date().toLocaleString('pt-BR'));
        addNotification({
          type: 'success',
          title: 'Sincronização concluída',
          message: 'Seus dados foram sincronizados com sucesso no Google Drive.',
        });
      } else {
        setSyncStatus('error');
        addNotification({
          type: 'error',
          title: 'Erro na sincronização',
          message: data.error || 'Ocorreu um erro ao sincronizar os dados.',
        });
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      setSyncStatus('error');
      addNotification({
        type: 'error',
        title: 'Erro de conexão',
        message: 'Não foi possível conectar ao Google Drive. Verifique sua conexão com a internet.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportData = () => {
    const data = {
      categories,
      timeEntries,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas preferências e dados da aplicação</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil
          </CardTitle>
          <CardDescription>Informações da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? 'Avatar'}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                <span className="text-xl font-bold text-primary-foreground">
                  {session?.user?.name?.charAt(0) ?? 'U'}
                </span>
              </div>
            )}
            <div>
              <p className="text-lg font-medium">{session?.user?.name ?? 'Usuário'}</p>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="w-full sm:w-auto">
            <LogOut className="mr-2 h-4 w-4" />
            Sair da conta
          </Button>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Aparência
          </CardTitle>
          <CardDescription>Personalize a aparência da aplicação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <div>
                <Label htmlFor="dark-mode">Modo escuro</Label>
                <p className="text-sm text-muted-foreground">
                  {theme === 'system'
                    ? 'Usar tema do sistema'
                    : `Tema ${theme === 'dark' ? 'escuro' : 'claro'} ativado`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
              >
                <Sun className="h-4 w-4" />
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
              >
                <Moon className="h-4 w-4" />
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('system')}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>Configure as notificações do aplicativo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Notificações do app */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications">Notificações do app</Label>
              <p className="text-sm text-muted-foreground">Mostrar lembretes na interface</p>
            </div>
            <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
          </div>

          {/* Notificações push */}
          {isSupported && (
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications">Notificações push</Label>
                <p className="text-sm text-muted-foreground">
                  {permission === 'granted'
                    ? 'Receber notificações no navegador'
                    : permission === 'denied'
                      ? 'Permissão negada - verifique as configurações do navegador'
                      : 'Permitir notificações push do navegador'}
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={pushEnabled}
                onCheckedChange={toggleNotifications}
                disabled={permission === 'denied'}
              />
            </div>
          )}

          {!isSupported && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                Notificações push não são suportadas neste navegador.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudUpload className="h-5 w-5" />
            Sincronização com Google Drive
          </CardTitle>
          <CardDescription>
            Configure a sincronização automática e gerencie seus dados na nuvem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status da conexão */}
          <div className="flex items-center gap-3 rounded-lg border p-3">
            {driveConnected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <p className="font-medium">
                {driveConnected ? 'Conectado ao Google Drive' : 'Não conectado ao Google Drive'}
              </p>
              <p className="text-sm text-muted-foreground">
                {driveConnected
                  ? 'Seus dados estão sendo sincronizados automaticamente'
                  : 'Faça login com sua conta Google para ativar a sincronização'}
              </p>
            </div>
          </div>

          {/* Último backup */}
          {lastSync && (
            <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Último backup</p>
                <p className="text-sm text-muted-foreground">{lastSync}</p>
              </div>
            </div>
          )}

          {/* Configurações */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-sync">Sincronização automática</Label>
              <p className="text-sm text-muted-foreground">
                Sincronizar dados automaticamente a cada 30 minutos
              </p>
            </div>
            <Switch
              id="auto-sync"
              checked={autoSync}
              onCheckedChange={setAutoSync}
              disabled={!driveConnected}
            />
          </div>

          {/* Botão de sincronização manual */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSyncNow}
              disabled={!driveConnected || isSyncing}
              className="flex-1"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}
            </Button>
          </div>

          {/* Status da sincronização */}
          {syncStatus === 'success' && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Sincronização concluída com sucesso
            </div>
          )}
          {syncStatus === 'error' && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              Erro na sincronização. Tente novamente.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Dados
          </CardTitle>
          <CardDescription>Gerencie seus dados locais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <p className="text-2xl font-bold">{categories.length}</p>
              <p className="text-sm text-muted-foreground">Categorias</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-2xl font-bold">{timeEntries.length}</p>
              <p className="text-sm text-muted-foreground">Registros de tempo</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportData}>
              <CloudUpload className="mr-2 h-4 w-4" />
              Exportar dados
            </Button>
            <Button variant="destructive" onClick={handleClearData} disabled={isClearing}>
              <Trash2 className="mr-2 h-4 w-4" />
              {isClearing ? 'Limpando...' : 'Limpar todos os dados'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacidade
          </CardTitle>
          <CardDescription>Informações sobre privacidade e segurança</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Seus dados são armazenados localmente no seu dispositivo e, opcionalmente, sincronizados
            com seu Google Drive pessoal. Não compartilhamos seus dados com terceiros.
          </p>
        </CardContent>
      </Card>

      {/* Version Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>TimeFlow Tracker v1.0.0</p>
        <p>© 2025 - Todos os direitos reservados</p>
      </div>
    </div>
  );
}
