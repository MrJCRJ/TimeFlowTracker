import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { validateEnvironment } from '@/lib/env-validation';
import { Providers } from '../providers';
import { TimerBar } from '@/components/timer/TimerBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { TimerNotifications } from '@/components/notifications/TimerNotifications';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Validar variáveis de ambiente (apenas registra avisos em produção)
  try {
    validateEnvironment();
  } catch (error) {
    console.warn('Environment validation failed, but continuing:', error instanceof Error ? error.message : String(error));
  }

  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <Providers>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar user={session.user} />

        {/* Main content */}
        <div className="flex flex-1 flex-col lg:ml-sidebar">
          {/* Header */}
          <Header user={session.user} />

          {/* Page content */}
          <main className="pb-timer flex-1 p-4 md:p-6">{children}</main>

          {/* Timer Bar */}
          <TimerBar userId={session.user.id} />
        </div>

        {/* Timer Notifications */}
        <TimerNotifications />
      </div>
    </Providers>
  );
}
