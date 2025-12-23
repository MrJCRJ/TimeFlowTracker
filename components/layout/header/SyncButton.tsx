import React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncButtonProps {
  onClick: () => void | Promise<void>;
  isLoading: boolean;
  className?: string;
}

export function SyncButton({ onClick, isLoading, className }: SyncButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        'rounded-lg p-2 transition-colors hover:bg-muted',
        isLoading && 'animate-spin',
        className
      )}
      aria-label="Sincronizar"
      title="Sincronizar com Google Drive"
    >
      <RefreshCw className="h-5 w-5" />
    </button>
  );
}
