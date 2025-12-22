'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTimerOptions {
  onTick?: (seconds: number) => void;
  onComplete?: () => void;
  autoStart?: boolean;
}

interface UseTimerReturn {
  seconds: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setTime: (seconds: number) => void;
}

export function useTimer(options: UseTimerOptions = {}): UseTimerReturn {
  const { onTick, onComplete, autoStart = false } = options;
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onTickRef = useRef(onTick);
  const onCompleteRef = useRef(onComplete);

  // Update refs when callbacks change
  useEffect(() => {
    onTickRef.current = onTick;
    onCompleteRef.current = onComplete;
  }, [onTick, onComplete]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          const newSeconds = prev + 1;
          onTickRef.current?.(newSeconds);
          return newSeconds;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setSeconds(0);
    onCompleteRef.current?.();
  }, []);

  const setTime = useCallback((newSeconds: number) => {
    setSeconds(Math.max(0, newSeconds));
  }, []);

  return {
    seconds,
    isRunning,
    start,
    pause,
    reset,
    setTime,
  };
}
