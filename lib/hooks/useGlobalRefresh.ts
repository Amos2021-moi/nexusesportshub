// lib/hooks/useGlobalRefresh.ts
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { getQueryClientInstance, invalidateAllQueries, refetchAllActiveQueries } from "@/lib/react-query";

// ✅ Query key groups for bulk refresh
export const REFRESH_GROUPS = {
  DASHBOARD: ['dashboard', 'dashboard-stats', 'dashboard-activity', 'dashboard-leaderboard', 'dashboard-next-match', 'dashboard-prize-pool', 'dashboard-season-progress', 'dashboard-streak', 'dashboard-h2h', 'dashboard-achievements', 'dashboard-trust-meter'],
  LEAGUE: ['league', 'league-table', 'league-entries', 'league-settings', 'competition', 'competition-entries'],
  FIXTURES: ['fixtures', 'upcoming-fixtures', 'fixture', 'results'],
  PAYMENTS: ['payments', 'payment-stats', 'payment-methods', 'payment-revenue', 'payment-status', 'competition-payments'],
  TOURNAMENTS: ['tournaments', 'tournament', 'tournament-bracket', 'tournament-stats'],
  COMMUNITY: ['posts', 'post', 'comments', 'reports', 'notifications', 'smart-notifications'],
  ADMIN: ['admin-stats', 'admin-analytics', 'admin-overview', 'admin-recent-activity', 'admin-system-status', 'admin-verification-queue', 'admin-audit', 'admin-backups'],
  PLAYERS: ['players', 'player', 'admin-players'],
  SEASONS: ['seasons', 'season', 'admin-seasons'],
  ALL: [],
};

// ✅ Main global refresh hook
export function useGlobalRefresh() {
  const queryClient = useQueryClient();
  const refreshInProgress = useRef(false);

  // ✅ Refresh all queries with loading state
  const refreshAll = useCallback(async (options?: { 
    force?: boolean; 
    delay?: number;
    onComplete?: () => void;
  }) => {
    if (refreshInProgress.current && !options?.force) {
      console.log('⏳ Refresh already in progress, skipping...');
      return;
    }

    refreshInProgress.current = true;
    console.log('🔄 Global refresh started...');

    try {
      // Invalidate all queries
      await queryClient.invalidateQueries();
      console.log('✅ All queries invalidated');
      
      // Wait for delay if specified (for DB operations)
      if (options?.delay) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }
      
      // Refetch all active queries
      await queryClient.refetchQueries({
        type: 'active',
        exact: false,
      });
      console.log('✅ All active queries refetched');
      
      if (options?.onComplete) {
        options.onComplete();
      }
    } catch (error) {
      console.error('❌ Refresh error:', error);
    } finally {
      refreshInProgress.current = false;
      console.log('🔄 Global refresh complete');
    }
  }, [queryClient]);

  // ✅ Refresh specific queries
  const refreshQueries = useCallback(async (keys: string[], options?: { 
    delay?: number;
    refetch?: boolean;
    onComplete?: () => void;
  }) => {
    if (!keys || keys.length === 0) return;

    console.log(`🔄 Refreshing queries: ${keys.join(', ')}`);

    try {
      // Invalidate specific keys
      await Promise.all(keys.map(key => 
        queryClient.invalidateQueries({ queryKey: [key] })
      ));
      console.log(`✅ Invalidated: ${keys.join(', ')}`);

      // Wait for delay if specified
      if (options?.delay) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }

      // Refetch if specified (default: true)
      if (options?.refetch !== false) {
        await queryClient.refetchQueries({
          type: 'active',
          exact: false,
        });
        console.log(`✅ Refetched: ${keys.join(', ')}`);
      }

      if (options?.onComplete) {
        options.onComplete();
      }
    } catch (error) {
      console.error('❌ Refresh error:', error);
    }
  }, [queryClient]);

  // ✅ Refresh a group of related queries
  const refreshGroup = useCallback(async (groupName: keyof typeof REFRESH_GROUPS, options?: {
    delay?: number;
    refetch?: boolean;
    onComplete?: () => void;
  }) => {
    const keys = REFRESH_GROUPS[groupName];
    if (!keys || keys.length === 0) {
      console.warn(`⚠️ Group "${groupName}" not found or empty`);
      return;
    }
    await refreshQueries(keys, options);
  }, [refreshQueries]);

  // ✅ Force refetch all active queries (without invalidating)
  const refetchAll = useCallback(async (options?: {
    onComplete?: () => void;
  }) => {
    console.log('🔄 Refetching all active queries...');
    try {
      await queryClient.refetchQueries({
        type: 'active',
        exact: false,
      });
      console.log('✅ All queries refetched');
      if (options?.onComplete) {
        options.onComplete();
      }
    } catch (error) {
      console.error('❌ Refetch error:', error);
    }
  }, [queryClient]);

  // ✅ Reset all queries
  const resetAll = useCallback(() => {
    queryClient.resetQueries();
    console.log('🔄 All queries reset');
  }, [queryClient]);

  // ✅ Clear cache
  const clearCache = useCallback(() => {
    queryClient.clear();
    console.log('🗑️ Cache cleared');
  }, [queryClient]);

  // ✅ Remove specific queries from cache
  const removeQueries = useCallback((keys: string[]) => {
    keys.forEach(key => {
      queryClient.removeQueries({ queryKey: [key] });
    });
    console.log(`🗑️ Removed queries: ${keys.join(', ')}`);
  }, [queryClient]);

  // ✅ Check if data is stale
  const isStale = useCallback((key: string) => {
    const state = queryClient.getQueryState([key]);
    if (!state) return true;
    return state.isInvalidated || false;
  }, [queryClient]);

  // ✅ Get query data from cache
  const getCachedData = useCallback(<T = any>(key: string): T | undefined => {
    return queryClient.getQueryData<T>([key]);
  }, [queryClient]);

  // ✅ Set query data in cache (optimistic update)
  const setCachedData = useCallback(<T = any>(key: string, data: T | ((old: T | undefined) => T)) => {
    queryClient.setQueryData<T>([key], data);
    console.log(`📦 Updated cache for: ${key}`);
  }, [queryClient]);

  // ✅ Prefetch data for a key
  const prefetch = useCallback(async (key: string, fetcher: () => Promise<any>) => {
    console.log(`📦 Prefetching: ${key}`);
    return queryClient.prefetchQuery({
      queryKey: [key],
      queryFn: fetcher,
      staleTime: 60000, // 1 minute
    });
  }, [queryClient]);

  return { 
    refreshAll, 
    refreshQueries, 
    refreshGroup,
    refetchAll, 
    resetAll, 
    clearCache,
    removeQueries,
    isStale,
    getCachedData,
    setCachedData,
    prefetch,
    REFRESH_GROUPS,
    isRefreshing: refreshInProgress.current,
  };
}

// ✅ Hook for specific page refresh (simplified)
export function usePageRefresh(pageKeys: string[]) {
  const { refreshQueries, isStale, getCachedData } = useGlobalRefresh();

  const refreshPage = useCallback(async (options?: { delay?: number }) => {
    await refreshQueries(pageKeys, options);
  }, [refreshQueries, pageKeys]);

  const checkStale = useCallback(() => {
    return pageKeys.some(key => isStale(key));
  }, [pageKeys, isStale]);

  return {
    refreshPage,
    checkStale,
    getCachedData,
  };
}

// ✅ Hook to force refresh on navigation
export function useNavigationRefresh() {
  const { refreshAll, refetchAll } = useGlobalRefresh();

  const refreshOnNavigation = useCallback(async (delay: number = 300) => {
    // Quick refresh when navigating between pages
    await refreshAll({ delay, force: true });
  }, [refreshAll]);

  return { refreshOnNavigation };
}

// ✅ Hook for mutation success handling
export function useMutationSuccess() {
  const { refreshAll, refreshQueries, refreshGroup } = useGlobalRefresh();

  const handleSuccess = useCallback(async (options?: {
    keys?: string[];
    group?: keyof typeof REFRESH_GROUPS;
    delay?: number;
  }) => {
    if (options?.group) {
      await refreshGroup(options.group, { delay: options.delay || 300 });
    } else if (options?.keys) {
      await refreshQueries(options.keys, { delay: options.delay || 300 });
    } else {
      await refreshAll({ delay: options?.delay || 500 });
    }
  }, [refreshAll, refreshQueries, refreshGroup]);

  return { handleSuccess };
}