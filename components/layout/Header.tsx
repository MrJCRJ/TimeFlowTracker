'use client';

import React from 'react';
import Link from 'next/link';
import { useSync } from './header/useSync';
import { SyncButton } from './header/SyncButton';
import { UserAvatar } from './header/UserAvatar';
import { NotificationsPanel } from './header/NotificationsPanel';
import type { AuthUser } from '@/lib/auth';

interface HeaderProps {
  user: AuthUser;
}

export function Header({ user }: HeaderProps) {
  const { handleSync, isSyncing } = useSync();

  return (
    <>
      <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-full items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">TF</span>
            </div>
            <span className="font-semibold">TimeFlow</span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <SyncButton onClick={handleSync} isLoading={isSyncing} />
            <NotificationsPanel />
            <UserAvatar user={user} size="sm" className="lg:hidden" />
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;
