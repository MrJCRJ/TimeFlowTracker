import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { validateEnvironment } from '@/lib/env-validation';
import { Providers } from '../providers';
import { TimerNotifications } from '@/components/notifications/TimerNotifications';
import { TimerSync } from '@/components/timer/TimerSync';
import { DashboardLayoutClient } from './DashboardLayoutClient';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Validar variáveis de ambiente (apenas registra avisos em produção)
  try {
    validateEnvironment();
  } catch (error) {
    console.warn(
      'Environment validation failed, but continuing:',
      error instanceof Error ? error.message : String(error)
    );
  }

  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <Providers>
      <DashboardLayoutClient user={session.user}>{children}</DashboardLayoutClient>

      {/* Timer Notifications */}
      <TimerNotifications />

      {/* Timer Sync (auto-sync e persistência) */}
      <TimerSync />
    </Providers>
  );
}
