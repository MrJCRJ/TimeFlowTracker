'use client';

import { TimerBar } from '@/components/timer/TimerBar';
import { useCategoryStore } from '@/stores/categoryStore';

interface TimerBarWrapperProps {
  userId: string;
}

export function TimerBarWrapper({ userId }: TimerBarWrapperProps) {
  const { categories, isLoading } = useCategoryStore();

  return <TimerBar userId={userId} isLoading={isLoading && categories.length === 0} />;
}
