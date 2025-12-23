'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

  // Use external control if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  }, [onClose]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      // lg breakpoint
      handleClose();
    }
  }, [pathname, handleClose]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={handleClose} />}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-sidebar flex-col border-r border-border bg-card transition-transform duration-300 ease-in-out',
          // Desktop: always visible
          'lg:flex lg:translate-x-0',
          // Mobile: slide in/out
          'flex lg:static',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header with close button for mobile */}
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">TF</span>
            </div>
            <span className="text-lg font-semibold">TimeFlow</span>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
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
        <div className="border-t border-border p-4">
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
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Link>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
