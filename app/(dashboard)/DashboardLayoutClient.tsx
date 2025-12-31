'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { TimerBarWrapper } from '@/components/timer/TimerBarWrapper';
import type { AuthUser } from '@/lib/auth';

interface DashboardLayoutClientProps {
  user: AuthUser;
  children: React.ReactNode;
}

export function DashboardLayoutClient({ user, children }: DashboardLayoutClientProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Desktop only (hidden on mobile, menu is in Header) */}
      <Sidebar user={user} />

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:ml-sidebar">
        {/* Header - with mobile menu dropdown */}
        <Header user={user} />

        {/* Page content - Improved mobile padding */}
        <main className="pb-timer flex-1 p-3 sm:p-4 md:p-6">{children}</main>

        {/* Timer Bar */}
        <TimerBarWrapper userId={user.id} />
      </div>
    </div>
  );
}
