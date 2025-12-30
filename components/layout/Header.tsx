'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard, FolderOpen, BarChart3, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from './header/UserAvatar';
import { NotificationsPanel } from './header/NotificationsPanel';
import type { AuthUser } from '@/lib/auth';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Fecha menu ao clicar fora
  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Fecha menu ao mudar de rota
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Fecha menu ao pressionar Escape
  useEffect(() => {
    if (!menuOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 h-14 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sm:h-16">
        <div className="flex h-full items-center justify-between px-3 sm:px-4 md:px-6">
          {/* Left side - Menu and Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Menu button - Mobile only */}
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95',
                'lg:hidden',
                menuOpen
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              )}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <X className="h-6 w-6" strokeWidth={2.5} />
              ) : (
                <Menu className="h-6 w-6" strokeWidth={2.5} />
              )}
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

      {/* Mobile Menu Dropdown - Similar to NotificationsPanel */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div
            ref={menuRef}
            className="fixed left-3 right-3 top-16 z-50 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl lg:hidden"
          >
            {/* User Info */}
            <div className="border-b border-border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? 'Avatar'}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-lg font-medium text-primary">
                      {user.name?.charAt(0) ?? user.email?.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{user.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted active:scale-[0.98]'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="border-t border-border p-2">
              <Link
                href="/api/auth/signout"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium text-destructive transition-all duration-200 hover:bg-destructive/10 active:scale-[0.98]"
              >
                <LogOut className="h-5 w-5" />
                Sair da conta
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Header;
