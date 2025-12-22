'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Menu,
  Bell,
  RefreshCw,
  X,
  LayoutDashboard,
  FolderOpen,
  BarChart3,
  Settings,
  LogOut,
  Check,
  Trash2,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/stores/notificationStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useTimerStore } from '@/stores/timerStore';
import type { AuthUser } from '@/lib/auth';
import type { UserPreferences } from '@/types';

interface HeaderProps {
  user: AuthUser;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/categories', label: 'Categorias', icon: FolderOpen },
  { href: '/analytics', label: 'Análises', icon: BarChart3 },
  { href: '/settings', label: 'Configurações', icon: Settings },
];

export function Header({ user }: HeaderProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const pathname = usePathname();

  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } =
    useNotificationStore();
  const { categories } = useCategoryStore();
  const { timeEntries } = useTimerStore();

  const handleSync = async () => {
    setIsSyncing(true);

    try {
      // Verificar se há sessão ativa
      const sessionResponse = await fetch('/api/auth/session');
      if (!sessionResponse.ok) {
        throw new Error('Usuário não autenticado');
      }

      const session = await sessionResponse.json();
      if (!session?.user) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar se há access token do Google
      if (!session.accessToken) {
        throw new Error('Token de acesso do Google não encontrado. Faça login novamente.');
      }

      // Mostrar notificação de início (mais discreta)
      useNotificationStore.getState().addNotification({
        type: 'info',
        title: 'Sincronizando',
        message: 'Sincronizando dados...',
      });

      // 1. Fazer backup dos dados locais para o Drive
      const backupResponse = await fetch('/api/drive/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories,
          timeEntries,
          preferences: {
            userId: session.user.id,
            workHours: { start: '09:00', end: '18:00' },
            dailyGoals: {},
            theme: 'system',
            notifications: true,
            autoSync: true,
            syncInterval: 5,
            updatedAt: new Date().toISOString(),
          } as UserPreferences,
        }),
      });

      if (!backupResponse.ok) {
        const errorData = await backupResponse.json();
        throw new Error(errorData.error?.message || 'Falha ao fazer backup para o Drive');
      }

      // 2. Carregar dados do Drive
      const syncResponse = await fetch('/api/drive/sync', {
        method: 'GET',
      });

      if (!syncResponse.ok) {
        const errorData = await syncResponse.json();
        throw new Error(errorData.error?.message || 'Falha ao sincronizar dados do Drive');
      }

      const syncData = await syncResponse.json();

      // 3. Atualizar stores locais com dados do Drive (se houver)
      if (syncData.success && syncData.data) {
        const { categories: driveCategories, timeEntries: driveTimeEntries } = syncData.data;

        // TODO: Implementar merge inteligente de dados
        console.log('Dados sincronizados:', {
          localCategories: categories.length,
          driveCategories: driveCategories?.length || 0,
          localTimeEntries: timeEntries.length,
          driveTimeEntries: driveTimeEntries?.length || 0,
        });
      }

      // Mostrar notificação de sucesso (mais discreta)
      useNotificationStore.getState().addNotification({
        type: 'success',
        title: 'Sincronizado',
        message: 'Dados atualizados com sucesso',
      });
    } catch (error) {
      console.error('Erro na sincronização:', error);

      // Mostrar notificação de erro
      useNotificationStore.getState().addNotification({
        type: 'error',
        title: 'Erro na Sincronização',
        message: error instanceof Error ? error.message : 'Erro desconhecido na sincronização',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isNotificationsOpen) setIsNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    if (isMenuOpen) setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-full items-center justify-between px-4 md:px-6">
          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="rounded-lg p-2 transition-colors hover:bg-muted lg:hidden"
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo for mobile */}
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">TF</span>
            </div>
            <span className="font-semibold">TimeFlow</span>
          </Link>

          {/* Spacer */}
          <div className="hidden lg:block" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Sync button */}
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={cn(
                'rounded-lg p-2 transition-colors hover:bg-muted',
                isSyncing && 'animate-spin'
              )}
              aria-label="Sincronizar"
              title="Sincronizar com Google Drive"
            >
              <RefreshCw className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <button
              onClick={toggleNotifications}
              className={cn(
                'relative rounded-lg p-2 transition-colors hover:bg-muted',
                isNotificationsOpen && 'bg-muted'
              )}
              aria-label={`Notificações ${unreadCount > 0 ? `(${unreadCount} não lidas)` : ''}`}
              aria-expanded={isNotificationsOpen}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* User avatar (mobile) */}
            <Link
              href="/settings"
              className="rounded-full p-1 ring-primary/20 transition-all hover:ring-2 lg:hidden"
            >
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name ?? 'Avatar'}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <span className="text-xs font-medium">
                    {user.name?.charAt(0) ?? user.email?.charAt(0)}
                  </span>
                </div>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={cn(
          'fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 transform border-r border-border bg-card transition-transform duration-300 ease-in-out lg:hidden',
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
          <div className="mb-3 flex items-center gap-3">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? 'Avatar'}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <span className="text-sm font-medium">
                  {user.name?.charAt(0) ?? user.email?.charAt(0)}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Link
            href="/api/auth/signout"
            onClick={() => setIsMenuOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Link>
        </div>
      </div>

      {/* Notifications Panel */}
      {isNotificationsOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
          <div className="fixed right-4 top-16 z-50 w-80 rounded-lg border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="font-semibold">Notificações</h3>
              {notifications.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    title="Marcar todas como lidas"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={clearAll}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    title="Limpar todas"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <Bell className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p>Nenhuma notificação no momento</p>
                  <p className="mt-1 text-xs">As notificações de timer aparecerão aqui</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 transition-colors hover:bg-muted/50',
                        !notification.read && 'bg-primary/5'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h4 className="truncate text-sm font-medium">{notification.title}</h4>
                            {!notification.read && (
                              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="mb-2 text-xs text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.timestamp).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                          title="Remover notificação"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="mt-2 text-xs text-primary hover:underline"
                        >
                          Marcar como lida
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Header;
