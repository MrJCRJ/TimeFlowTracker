'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useAutoSync } from '@/hooks/useAutoSync';
import { SyncButton } from './header/SyncButton';
import { UserAvatar } from './header/UserAvatar';
import { NotificationsPanel } from './header/NotificationsPanel';
import type { AuthUser } from '@/lib/auth';

interface HeaderProps {
  user: AuthUser;
  onToggleSidebar?: () => void;
}

export function Header({ user, onToggleSidebar }: HeaderProps) {
  const { syncToCloud, isSyncing } = useAutoSync();

  const handleSync = useCallback(async () => {
    await syncToCloud();
  }, [syncToCloud]);

  return (
    <>
      <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-full items-center justify-between px-4 md:px-6">
          {/* Left side - Menu and Logo */}
          <div className="flex items-center gap-2">
            {/* Menu button - Always visible on mobile/tablet, hidden on desktop */}
            <button
              type="button"
              onClick={() => {
                console.log('Menu button clicked');
                onToggleSidebar?.();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 active:bg-accent/80 lg:hidden"
              aria-label="Abrir menu lateral"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo - Responsive sizing */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">TF</span>
              </div>
              <span className="hidden font-semibold sm:inline">TimeFlow</span>
            </Link>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <SyncButton onClick={handleSync} isLoading={isSyncing} />
            <NotificationsPanel />
            <UserAvatar user={user} size="sm" />
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;
