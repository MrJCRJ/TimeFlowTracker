'use client';

import { TimerBar } from '@/components/timer/TimerBar';
import { useCategoryStore } from '@/stores/categoryStore';

interface TimerBarWrapperProps {
  userId: string;
}

/**
 * TimerBarWrapper - Wrapper que usa TimerBar local
 *
 * Este componente utiliza o TimerBar que funciona 100% localmente.
 * Os dados são salvos no localStorage e podem ser sincronizados
 * manualmente com o Google Drive através da página de configurações.
 *
 * Categorias são fixas, então não há estado de loading.
 */
export function TimerBarWrapper({ userId }: TimerBarWrapperProps) {
  const { categories } = useCategoryStore();

  return <TimerBar userId={userId} isLoading={categories.length === 0} />;
}
