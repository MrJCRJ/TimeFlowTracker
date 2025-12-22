'use client';

import { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncIndicatorProps {
  lastSync: Date | null;
  isSyncing: boolean;
  isOnline: boolean;
  className?: string;
}

export function SyncIndicator({ lastSync, isSyncing, isOnline, className }: SyncIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    const updateTimeAgo = () => {
      if (!lastSync) {
        setTimeAgo('Nunca sincronizado');
        return;
      }

      const diff = Date.now() - lastSync.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);

      if (minutes < 1) {
        setTimeAgo('Agora mesmo');
      } else if (minutes < 60) {
        setTimeAgo(`${minutes}min atrás`);
      } else if (hours < 24) {
        setTimeAgo(`${hours}h atrás`);
      } else {
        setTimeAgo(lastSync.toLocaleDateString('pt-BR'));
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000);
    return () => clearInterval(interval);
  }, [lastSync]);

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs',
        isOnline ? 'text-muted-foreground' : 'text-destructive',
        className
      )}
      title={`Última sincronização: ${timeAgo}`}
    >
      {isSyncing ? (
        <>
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>Sincronizando...</span>
        </>
      ) : isOnline ? (
        <>
          <Cloud className="h-3 w-3" />
          <span>{timeAgo}</span>
        </>
      ) : (
        <>
          <CloudOff className="h-3 w-3" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}
