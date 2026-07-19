// hooks/useAutoRefresh.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useAutoRefresh(interval: number = 30000) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // ✅ Refresh all queries every interval
    const timer = setInterval(() => {
      queryClient.invalidateQueries();
      console.log('🔄 Auto-refresh: All queries invalidated');
    }, interval);

    return () => clearInterval(timer);
  }, [interval, queryClient]);
}

// ✅ Refresh specific query keys
export function useAutoRefreshKeys(keys: string[], interval: number = 30000) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setInterval(() => {
      keys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      console.log(`🔄 Auto-refresh: Refreshed keys: ${keys.join(', ')}`);
    }, interval);

    return () => clearInterval(timer);
  }, [keys, interval, queryClient]);
}

// ✅ Conditional auto-refresh (only when tab is visible)
export function useAutoRefreshOnVisible(interval: number = 30000) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const startTimer = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        if (document.visibilityState === 'visible') {
          queryClient.invalidateQueries();
          console.log('🔄 Auto-refresh (visible): All queries invalidated');
        }
      }, interval);
    };

    const stopTimer = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    startTimer();

    // ✅ Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startTimer();
        // ✅ Refresh immediately when tab becomes visible
        queryClient.invalidateQueries();
        console.log('🔄 Tab became visible: Refreshing all queries');
      } else {
        stopTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [interval, queryClient]);
}