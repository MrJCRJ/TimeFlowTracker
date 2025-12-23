'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { TimerBarWrapper } from '@/components/timer/TimerBarWrapper';
import type { AuthUser } from '@/lib/auth';

interface DashboardLayoutClientProps {
  user: AuthUser;
  children: React.ReactNode;
}

export function DashboardLayoutClient({ user, children }: DashboardLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar user={user} isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:ml-sidebar">
        {/* Header */}
        <Header user={user} onToggleSidebar={toggleSidebar} />

        {/* Page content */}
        <main className="pb-timer flex-1 p-4 md:p-6">{children}</main>

        {/* Timer Bar */}
        <TimerBarWrapper userId={user.id} />
      </div>
    </div>
  );
}
