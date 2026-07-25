// lib/hooks/useAutoRefresh.ts
import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// ✅ Query keys for auto-refresh
export const AUTO_REFRESH_KEYS = {
  DASHBOARD: ['dashboard', 'dashboard-stats', 'dashboard-activity', 'dashboard-leaderboard'],
  LEAGUE: ['league', 'league-table', 'league-entries', 'league-settings'],
  FIXTURES: ['fixtures', 'upcoming-fixtures'],
  PAYMENTS: ['payments', 'payment-stats', 'payment-revenue'],
  TOURNAMENTS: ['tournaments', 'tournament'],
  COMMUNITY: ['posts', 'notifications', 'smart-notifications'],
  ADMIN: ['admin-stats', 'admin-overview', 'admin-recent-activity'],
  ALL: [],
};

// ✅ Main auto-refresh hook
export function useAutoRefresh(interval: number = 30000, options?: {
  enabled?: boolean;
  keys?: string[];
  onRefresh?: () => void;
}) {
  const queryClient = useQueryClient();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isEnabled = options?.enabled !== false;

  const refresh = useCallback(async () => {
    if (!queryClient) return;
    
    const keys = options?.keys || [];
    
    if (keys.length > 0) {
      // Refresh specific keys
      await Promise.all(keys.map(key => 
        queryClient.invalidateQueries({ queryKey: [key] })
      ));
      console.log(`🔄 Auto-refresh: Refreshed keys: ${keys.join(', ')}`);
    } else {
      // Refresh all
      await queryClient.invalidateQueries();
      console.log('🔄 Auto-refresh: All queries invalidated');
    }
    
    // Refetch active queries
    await queryClient.refetchQueries({
      type: 'active',
      exact: false,
    });
    
    if (options?.onRefresh) {
      options.onRefresh();
    }
  }, [queryClient, options]);

  useEffect(() => {
    if (!isEnabled) return;

    const startTimer = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      timerRef.current = setInterval(refresh, interval);
    };

    startTimer();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [interval, isEnabled, refresh]);

  return { refresh };
}

// ✅ Refresh specific query keys
export function useAutoRefreshKeys(keys: string[], interval: number = 30000, options?: {
  enabled?: boolean;
  onRefresh?: () => void;
}) {
  return useAutoRefresh(interval, {
    enabled: options?.enabled !== false,
    keys,
    onRefresh: options?.onRefresh,
  });
}

// ✅ Conditional auto-refresh (only when tab is visible)
export function useAutoRefreshOnVisible(interval: number = 30000, options?: {
  enabled?: boolean;
  keys?: string[];
  onRefresh?: () => void;
}) {
  const queryClient = useQueryClient();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isEnabled = options?.enabled !== false;

  const refresh = useCallback(async () => {
    if (!queryClient || document.visibilityState !== 'visible') return;
    
    const keys = options?.keys || [];
    
    if (keys.length > 0) {
      await Promise.all(keys.map(key => 
        queryClient.invalidateQueries({ queryKey: [key] })
      ));
      console.log(`🔄 Auto-refresh (visible): Refreshed keys: ${keys.join(', ')}`);
    } else {
      await queryClient.invalidateQueries();
      console.log('🔄 Auto-refresh (visible): All queries invalidated');
    }
    
    await queryClient.refetchQueries({
      type: 'active',
      exact: false,
    });
    
    if (options?.onRefresh) {
      options.onRefresh();
    }
  }, [queryClient, options]);

  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    timerRef.current = setInterval(refresh, interval);
  }, [refresh, interval]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isEnabled) return;

    startTimer();

    // ✅ Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startTimer();
        // ✅ Refresh immediately when tab becomes visible
        refresh();
        console.log('🔄 Tab became visible: Refreshing queries');
      } else {
        stopTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEnabled, startTimer, stopTimer, refresh]);

  return { refresh };
}

// ✅ Manual refresh hook with debounce
export function useManualRefresh(delay: number = 500) {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async (keys?: string[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    return new Promise<void>((resolve) => {
      timeoutRef.current = setTimeout(async () => {
        if (keys && keys.length > 0) {
          await Promise.all(keys.map(key => 
            queryClient.invalidateQueries({ queryKey: [key] })
          ));
          console.log(`🔄 Manual refresh: Refreshed keys: ${keys.join(', ')}`);
        } else {
          await queryClient.invalidateQueries();
          console.log('🔄 Manual refresh: All queries invalidated');
        }
        
        await queryClient.refetchQueries({
          type: 'active',
          exact: false,
        });
        
        timeoutRef.current = null;
        resolve();
      }, delay);
    });
  }, [queryClient, delay]);

  return { refresh };
}

// ✅ Auto-refresh with interval control (start/stop)
export function useAutoRefreshWithControl(interval: number = 30000) {
  const queryClient = useQueryClient();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef<boolean>(false);

  const refresh = useCallback(async () => {
    if (!queryClient) return;
    await queryClient.invalidateQueries();
    await queryClient.refetchQueries({
      type: 'active',
      exact: false,
    });
    console.log('🔄 Auto-refresh triggered');
  }, [queryClient]);

  const start = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    timerRef.current = setInterval(refresh, interval);
    console.log('▶️ Auto-refresh started');
  }, [interval, refresh]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      isRunningRef.current = false;
      console.log('⏹️ Auto-refresh stopped');
    }
  }, []);

  const toggle = useCallback(() => {
    if (isRunningRef.current) {
      stop();
    } else {
      start();
    }
  }, [start, stop]);

  useEffect(() => {
    // Auto-start by default
    start();
    return () => stop();
  }, [start, stop]);

  return { start, stop, toggle, isRunning: isRunningRef.current, refresh };
}

// ✅ Auto-refresh for specific pages
export function useDashboardAutoRefresh(interval: number = 30000) {
  return useAutoRefreshKeys(
    AUTO_REFRESH_KEYS.DASHBOARD,
    interval,
    {
      onRefresh: () => console.log('📊 Dashboard refreshed'),
    }
  );
}

export function useLeagueAutoRefresh(interval: number = 30000) {
  return useAutoRefreshKeys(
    AUTO_REFRESH_KEYS.LEAGUE,
    interval,
    {
      onRefresh: () => console.log('🏆 League data refreshed'),
    }
  );
}

export function usePaymentsAutoRefresh(interval: number = 30000) {
  return useAutoRefreshKeys(
    AUTO_REFRESH_KEYS.PAYMENTS,
    interval,
    {
      onRefresh: () => console.log('💰 Payments data refreshed'),
    }
  );
}

export function useAdminAutoRefresh(interval: number = 60000) {
  return useAutoRefreshOnVisible(
    interval,
    {
      keys: AUTO_REFRESH_KEYS.ADMIN,
      onRefresh: () => console.log('👑 Admin data refreshed'),
    }
  );
}