'use client';

import React from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { UserAvatar } from './header/UserAvatar';
import { NotificationsPanel } from './header/NotificationsPanel';
import type { AuthUser } from '@/lib/auth';

interface HeaderProps {
  user: AuthUser;
  onToggleSidebar?: () => void;
}

export function Header({ user, onToggleSidebar }: HeaderProps) {
  return (
    <>
      <header className="sticky top-0 z-30 h-14 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sm:h-16">
        <div className="flex h-full items-center justify-between px-3 sm:px-4 md:px-6">
          {/* Left side - Menu and Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Menu button - Improved for mobile */}
            <button
              type="button"
              onClick={() => {
                console.log('Menu button clicked');
                onToggleSidebar?.();
              }}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-200 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 lg:hidden"
              aria-label="Abrir menu lateral"
            >
              <Menu className="h-6 w-6" strokeWidth={2.5} />
            </button>

            {/* Logo - Responsive sizing */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary sm:h-9 sm:w-9">
                <span className="text-sm font-bold text-primary-foreground sm:text-base">TF</span>
              </div>
              <span className="hidden font-semibold sm:inline">TimeFlow</span>
            </Link>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <NotificationsPanel />
            <UserAvatar user={user} size="sm" />
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;
