'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, FolderOpen, BarChart3, Settings, LogOut, X } from 'lucide-react';
import type { AuthUser } from '@/lib/auth';

interface SidebarProps {
  user: AuthUser;
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/categories', label: 'Categorias', icon: FolderOpen },
  { href: '/analytics', label: 'Análises', icon: BarChart3 },
  { href: '/settings', label: 'Configurações', icon: Settings },
];

export function Sidebar({ user, isOpen: externalIsOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isFirstRender = useRef(true);

  // Use external control if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  }, [onClose]);

  // Close sidebar when route changes on mobile (but not on first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      handleClose();
    }
  }, [pathname, handleClose]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      <aside
        data-open={isOpen}
        className={cn(
          // Base styles
          'fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col border-r border-border bg-card',
          'transition-transform duration-300 ease-in-out',
          'sm:w-sidebar',
          // Mobile: slide in/out based on isOpen state
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible and static
          'lg:static lg:translate-x-0'
        )}
      >
        {/* Header with close button for mobile */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4 sm:h-16 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary sm:h-8 sm:w-8">
              <span className="text-base font-bold text-primary-foreground sm:text-sm">TF</span>
            </div>
            <span className="text-lg font-semibold">TimeFlow</span>
          </div>

          {/* Close button for mobile - Enhanced */}
          <button
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive active:scale-95 lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3 sm:p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all duration-200 sm:rounded-lg sm:px-3 sm:py-2 sm:text-sm',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.98]'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-border p-3 sm:p-4">
          <div className="mb-3 flex items-center gap-3">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? 'Avatar'}
                width={44}
                height={44}
                className="h-11 w-11 rounded-full sm:h-10 sm:w-10"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted sm:h-10 sm:w-10">
                <span className="text-base font-medium sm:text-sm">
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
            className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-base text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive active:scale-[0.98] sm:rounded-lg sm:px-3 sm:py-2 sm:text-sm"
          >
            <LogOut className="h-5 w-5 sm:h-4 sm:w-4" />
            Sair
          </Link>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
