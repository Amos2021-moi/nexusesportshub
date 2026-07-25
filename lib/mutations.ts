// lib/mutations.ts
import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { useCallback } from "react";
import toast from "react-hot-toast";

// ✅ Cache invalidation keys for the entire app
export const QUERY_KEYS = {
  // Dashboard
  DASHBOARD: 'dashboard',
  DASHBOARD_STATS: 'dashboard-stats',
  DASHBOARD_ACTIVITY: 'dashboard-activity',
  DASHBOARD_LEADERBOARD: 'dashboard-leaderboard',
  DASHBOARD_NEXT_MATCH: 'dashboard-next-match',
  DASHBOARD_PRIZE_POOL: 'dashboard-prize-pool',
  DASHBOARD_SEASON_PROGRESS: 'dashboard-season-progress',
  DASHBOARD_STREAK: 'dashboard-streak',
  DASHBOARD_H2H: 'dashboard-h2h',
  DASHBOARD_ACHIEVEMENTS: 'dashboard-achievements',
  DASHBOARD_TRUST_METER: 'dashboard-trust-meter',

  // Seasons
  SEASONS: 'seasons',
  SEASON: 'season',
  ADMIN_SEASONS: 'admin-seasons',

  // League
  LEAGUE: 'league',
  LEAGUE_TABLE: 'league-table',
  LEAGUE_ENTRIES: 'league-entries',
  LEAGUE_SETTINGS: 'league-settings',

  // Fixtures
  FIXTURES: 'fixtures',
  FIXTURE: 'fixture',
  UPCOMING_FIXTURES: 'upcoming-fixtures',

  // Results
  RESULTS: 'results',
  RESULT: 'result',

  // Payments
  PAYMENTS: 'payments',
  PAYMENT_STATS: 'payment-stats',
  PAYMENT_METHODS: 'payment-methods',
  PAYMENT_REVENUE: 'payment-revenue',
  PAYMENT_STATUS: 'payment-status',

  // Players
  PLAYERS: 'players',
  PLAYER: 'player',
  ADMIN_PLAYERS: 'admin-players',

  // Tournaments
  TOURNAMENTS: 'tournaments',
  TOURNAMENT: 'tournament',
  TOURNAMENT_BRACKET: 'tournament-bracket',
  TOURNAMENT_STATS: 'tournament-stats',

  // Community
  POSTS: 'posts',
  POST: 'post',
  COMMENTS: 'comments',
  REPORTS: 'reports',

  // Notifications
  NOTIFICATIONS: 'notifications',
  SMART_NOTIFICATIONS: 'smart-notifications',

  // Admin
  ADMIN_STATS: 'admin-stats',
  ADMIN_ANALYTICS: 'admin-analytics',
  ADMIN_AUDIT: 'admin-audit',
  ADMIN_BACKUPS: 'admin-backups',
  ADMIN_COMMUNICATION: 'admin-communication',
  ADMIN_ENTITY: 'admin-entity',
  ADMIN_OVERVIEW: 'admin-overview',
  ADMIN_RECENT_ACTIVITY: 'admin-recent-activity',
  ADMIN_SEARCH: 'admin-search',
  ADMIN_SYSTEM_STATUS: 'admin-system-status',
  ADMIN_VERIFICATION_QUEUE: 'admin-verification-queue',

  // Settings
  SETTINGS: 'settings',
  SYSTEM_SETTINGS: 'system-settings',
  NOTIFICATION_SETTINGS: 'notification-settings',
  MODERATION_SETTINGS: 'moderation-settings',

  // Awards
  AWARDS: 'awards',
  HALL_OF_FAME: 'hall-of-fame',

  // Squads
  SQUADS: 'squads',
  SQUAD: 'squad',

  // Competition
  COMPETITION: 'competition',
  COMPETITION_ENTRIES: 'competition-entries',
  COMPETITION_PAYMENTS: 'competition-payments',
  COMPETITION_PLAYERS: 'competition-players',
  COMPETITION_PRIZE_POOL: 'competition-prize-pool',

  // News
  NEWS: 'news',
  NEWS_ITEM: 'news-item',

  // Other
  PROFILE: 'profile',
  USER: 'user',
  STATS: 'stats',
  VERSION: 'version',
  MAINTENANCE: 'maintenance',
};

// ✅ Cache invalidation groups (invalidate multiple related keys at once)
export const INVALIDATION_GROUPS = {
  DASHBOARD: [
    QUERY_KEYS.DASHBOARD,
    QUERY_KEYS.DASHBOARD_STATS,
    QUERY_KEYS.DASHBOARD_ACTIVITY,
    QUERY_KEYS.DASHBOARD_LEADERBOARD,
    QUERY_KEYS.DASHBOARD_NEXT_MATCH,
    QUERY_KEYS.DASHBOARD_PRIZE_POOL,
    QUERY_KEYS.DASHBOARD_SEASON_PROGRESS,
    QUERY_KEYS.DASHBOARD_STREAK,
    QUERY_KEYS.DASHBOARD_H2H,
    QUERY_KEYS.DASHBOARD_ACHIEVEMENTS,
    QUERY_KEYS.DASHBOARD_TRUST_METER,
  ],
  SEASON: [
    QUERY_KEYS.SEASONS,
    QUERY_KEYS.SEASON,
    QUERY_KEYS.ADMIN_SEASONS,
    QUERY_KEYS.LEAGUE_TABLE,
    QUERY_KEYS.LEAGUE_ENTRIES,
    QUERY_KEYS.LEAGUE_SETTINGS,
    QUERY_KEYS.FIXTURES,
    QUERY_KEYS.RESULTS,
  ],
  PAYMENTS: [
    QUERY_KEYS.PAYMENTS,
    QUERY_KEYS.PAYMENT_STATS,
    QUERY_KEYS.PAYMENT_METHODS,
    QUERY_KEYS.PAYMENT_REVENUE,
    QUERY_KEYS.PAYMENT_STATUS,
    QUERY_KEYS.COMPETITION_PAYMENTS,
    QUERY_KEYS.DASHBOARD,
  ],
  LEAGUE: [
    QUERY_KEYS.LEAGUE,
    QUERY_KEYS.LEAGUE_TABLE,
    QUERY_KEYS.LEAGUE_ENTRIES,
    QUERY_KEYS.LEAGUE_SETTINGS,
    QUERY_KEYS.COMPETITION,
    QUERY_KEYS.COMPETITION_ENTRIES,
  ],
  TOURNAMENT: [
    QUERY_KEYS.TOURNAMENTS,
    QUERY_KEYS.TOURNAMENT,
    QUERY_KEYS.TOURNAMENT_BRACKET,
    QUERY_KEYS.TOURNAMENT_STATS,
  ],
  COMMUNITY: [
    QUERY_KEYS.POSTS,
    QUERY_KEYS.POST,
    QUERY_KEYS.COMMENTS,
    QUERY_KEYS.REPORTS,
  ],
  PLAYER: [
    QUERY_KEYS.PLAYERS,
    QUERY_KEYS.PLAYER,
    QUERY_KEYS.ADMIN_PLAYERS,
    QUERY_KEYS.LEAGUE_TABLE,
  ],
  ADMIN: [
    QUERY_KEYS.ADMIN_STATS,
    QUERY_KEYS.ADMIN_ANALYTICS,
    QUERY_KEYS.ADMIN_OVERVIEW,
    QUERY_KEYS.ADMIN_RECENT_ACTIVITY,
    QUERY_KEYS.ADMIN_SYSTEM_STATUS,
    QUERY_KEYS.ADMIN_VERIFICATION_QUEUE,
  ],
  ALL: [], // Will be filled by invalidateAll
};

// ✅ Global mutation handler
export function useMutationSuccess() {
  const queryClient = useQueryClient();

  // ✅ Invalidate specific keys
  const invalidate = useCallback((keys: string[]) => {
    if (!keys || keys.length === 0) return;
    keys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
    console.log(`🔄 Invalidated: ${keys.join(', ')}`);
  }, [queryClient]);

  // ✅ Invalidate multiple groups
  const invalidateGroups = useCallback((groups: string[][]) => {
    groups.forEach(group => {
      group.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    });
    console.log(`🔄 Invalidated ${groups.length} groups`);
  }, [queryClient]);

  // ✅ Invalidate ALL queries
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries();
    console.log('🔄 All cache invalidated');
  }, [queryClient]);

  // ✅ Refresh specific queries (invalidate + refetch)
  const refresh = useCallback(async (keys: string[]) => {
    if (!keys || keys.length === 0) return;
    await Promise.all(keys.map(key => 
      queryClient.invalidateQueries({ queryKey: [key] })
    ));
    await queryClient.refetchQueries();
    console.log(`🔄 Refreshed: ${keys.join(', ')}`);
  }, [queryClient]);

  // ✅ Refresh ALL
  const refreshAll = useCallback(async () => {
    await queryClient.invalidateQueries();
    await queryClient.refetchQueries();
    console.log('🔄 All refreshed');
  }, [queryClient]);

  // ✅ Reset all queries
  const resetAll = useCallback(() => {
    queryClient.resetQueries();
    console.log('🔄 All queries reset');
  }, [queryClient]);

  // ✅ Remove specific queries from cache
  const remove = useCallback((keys: string[]) => {
    keys.forEach(key => {
      queryClient.removeQueries({ queryKey: [key] });
    });
    console.log(`🗑️ Removed: ${keys.join(', ')}`);
  }, [queryClient]);

  return { invalidate, invalidateGroups, invalidateAll, refresh, refreshAll, resetAll, remove };
}

// ✅ Generic mutation hook with automatic cache invalidation
export function useAppMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    invalidateKeys?: string[];
    invalidateGroups?: string[][];
    invalidateAll?: boolean;
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: any, variables: TVariables) => void;
    showToast?: boolean;
  }
) {
  const queryClient = useQueryClient();
  const { invalidate, invalidateGroups, invalidateAll: invalidateAllQueries, refreshAll } = useMutationSuccess();

  return useMutation({
    mutationFn,
    onSuccess: async (data, variables) => {
      // ✅ Invalidate specific keys
      if (options?.invalidateKeys && options.invalidateKeys.length > 0) {
        invalidate(options.invalidateKeys);
      }

      // ✅ Invalidate groups
      if (options?.invalidateGroups && options.invalidateGroups.length > 0) {
        invalidateGroups(options.invalidateGroups);
      }

      // ✅ Invalidate ALL
      if (options?.invalidateAll) {
        invalidateAllQueries();
      }

      // ✅ Always refetch active queries to ensure UI is fresh
      await queryClient.refetchQueries({
        type: 'active',
        exact: false,
      });

      // ✅ Show success message
      if (options?.successMessage && options.showToast !== false) {
        toast.success(options.successMessage);
      }

      // ✅ Call custom onSuccess
      if (options?.onSuccess) {
        options.onSuccess(data, variables);
      }
    },
    onError: (error: any, variables) => {
      const message = error?.error || error?.message || 'Something went wrong';
      
      if (options?.errorMessage && options?.showToast !== false) {
        toast.error(options.errorMessage);
      } else if (options?.showToast !== false) {
        toast.error(message);
      }

      if (options?.onError) {
        options.onError(error, variables);
      }
    },
  });
}

// ✅ ==================== SPECIFIC MUTATION HOOKS ====================

// --- Seasons ---
export function useCreateSeason() {
  return useAppMutation(
    async (data: any) => {
      const res = await fetch('/api/seasons/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    },
    {
      successMessage: 'Season created successfully! 🎉',
      invalidateGroups: [INVALIDATION_GROUPS.SEASON, INVALIDATION_GROUPS.DASHBOARD],
    }
  );
}

export function useUpdateSeason() {
  return useAppMutation(
    async ({ id, ...data }: any) => {
      const res = await fetch(`/api/seasons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    },
    {
      successMessage: 'Season updated successfully! ✅',
      invalidateGroups: [INVALIDATION_GROUPS.SEASON, INVALIDATION_GROUPS.DASHBOARD, INVALIDATION_GROUPS.LEAGUE],
    }
  );
}

export function useDeleteSeason() {
  return useAppMutation(
    async (id: string) => {
      const res = await fetch(`/api/seasons/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    },
    {
      successMessage: 'Season deleted successfully! 🗑️',
      invalidateGroups: [INVALIDATION_GROUPS.SEASON, INVALIDATION_GROUPS.DASHBOARD, INVALIDATION_GROUPS.LEAGUE],
    }
  );
}

// --- League ---
export function useUpdateLeagueSettings() {
  return useAppMutation(
    async (data: any) => {
      const res = await fetch('/api/admin/settings/league', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    },
    {
      successMessage: 'League settings updated! ✅',
      invalidateKeys: [QUERY_KEYS.LEAGUE_SETTINGS, QUERY_KEYS.COMPETITION],
    }
  );
}

// --- Payments ---
export function useMarkPaymentPaid() {
  return useAppMutation(
    async ({ entryId, data }: any) => {
      const res = await fetch(`/api/admin/competition/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, ...data }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    },
    {
      successMessage: 'Payment marked as paid! 💰',
      invalidateGroups: [INVALIDATION_GROUPS.PAYMENTS, INVALIDATION_GROUPS.DASHBOARD],
    }
  );
}

// --- Fixtures ---
export function useGenerateFixtures() {
  return useAppMutation(
    async (seasonId: string) => {
      const res = await fetch('/api/fixtures/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasonId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    },
    {
      successMessage: 'Fixtures generated successfully! 📅',
      invalidateKeys: [QUERY_KEYS.FIXTURES, QUERY_KEYS.UPCOMING_FIXTURES],
    }
  );
}

export function useUpdateFixture() {
  return useAppMutation(
    async ({ fixtureId, data }: any) => {
      const res = await fetch(`/api/fixtures/${fixtureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    },
    {
      successMessage: 'Fixture updated! ✅',
      invalidateKeys: [QUERY_KEYS.FIXTURES, QUERY_KEYS.UPCOMING_FIXTURES],
    }
  );
}

// --- Results ---
export function useSubmitResult() {
  return useAppMutation(
    async ({ fixtureId, data }: any) => {
      const res = await fetch(`/api/results/submit/${fixtureId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    },
    {
      successMessage: 'Result submitted successfully! 📊',
      invalidateKeys: [QUERY_KEYS.RESULTS, QUERY_KEYS.FIXTURES, QUERY_KEYS.LEAGUE_TABLE],
    }
  );
}

export function useApproveResult() {
  return useAppMutation(
    async (resultId: string) => {
      const res = await fetch(`/api/admin/results/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    },
    {
      successMessage: 'Result approved! ✅',
      invalidateKeys: [QUERY_KEYS.RESULTS, QUERY_KEYS.FIXTURES, QUERY_KEYS.LEAGUE_TABLE],
    }
  );
}

// --- Tournaments ---
export function useCreateTournament() {
  return useAppMutation(
    async (data: any) => {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    },
    {
      successMessage: 'Tournament created! 🏆',
      invalidateKeys: [QUERY_KEYS.TOURNAMENTS],
    }
  );
}

export function useUpdateTournament() {
  return useAppMutation(
    async ({ id, ...data }: any) => {
      const res = await fetch(`/api/tournaments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    },
    {
      successMessage: 'Tournament updated! ✅',
      invalidateKeys: [QUERY_KEYS.TOURNAMENTS, QUERY_KEYS.TOURNAMENT],
    }
  );
}

// --- News ---
export function useCreateNews() {
  return useAppMutation(
    async (data: any) => {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    },
    {
      successMessage: 'News article published! 📰',
      invalidateKeys: [QUERY_KEYS.NEWS],
    }
  );
}

export function useUpdateNews() {
  return useAppMutation(
    async ({ id, ...data }: any) => {
      const res = await fetch(`/api/news/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    },
    {
      successMessage: 'News updated! ✅',
      invalidateKeys: [QUERY_KEYS.NEWS],
    }
  );
}

export function useDeleteNews() {
  return useAppMutation(
    async (id: string) => {
      const res = await fetch(`/api/news/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    },
    {
      successMessage: 'News deleted! 🗑️',
      invalidateKeys: [QUERY_KEYS.NEWS],
    }
  );
}

// --- Community ---
export function useCreatePost() {
  return useAppMutation(
    async (data: any) => {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    },
    {
      successMessage: 'Post created! 📝',
      invalidateKeys: [QUERY_KEYS.POSTS],
    }
  );
}

export function useLikePost() {
  return useAppMutation(
    async ({ postId, action }: { postId: string; action: 'like' | 'unlike' }) => {
      const res = await fetch(`/api/community/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    },
    {
      invalidateKeys: [QUERY_KEYS.POSTS],
      showToast: false,
    }
  );
}

export function useAddComment() {
  return useAppMutation(
    async ({ postId, content }: { postId: string; content: string }) => {
      const res = await fetch(`/api/community/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    },
    {
      successMessage: 'Comment added! 💬',
      invalidateKeys: [QUERY_KEYS.POSTS],
    }
  );
}

// --- Backups ---
export function useCreateBackup() {
  return useAppMutation(
    async (type: string = 'MANUAL') => {
      const res = await fetch('/api/admin/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    },
    {
      successMessage: 'Backup started! 💾',
      invalidateKeys: [QUERY_KEYS.ADMIN_BACKUPS],
    }
  );
}

// --- Players ---
export function useUpdatePlayer() {
  return useAppMutation(
    async ({ id, ...data }: any) => {
      const res = await fetch(`/api/admin/players/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    },
    {
      successMessage: 'Player updated! ✅',
      invalidateKeys: [QUERY_KEYS.PLAYERS, QUERY_KEYS.PLAYER],
    }
  );
}

// ✅ ==================== UTILITY HOOKS ====================

// ✅ Hook for forcing a full app refresh
export function useForceRefresh() {
  const queryClient = useQueryClient();

  const forceRefresh = useCallback(async () => {
    // Invalidate ALL queries
    await queryClient.invalidateQueries();
    // Refetch ALL active queries
    await queryClient.refetchQueries({
      type: 'active',
      exact: false,
    });
    console.log('🔄 Force refresh complete');
  }, [queryClient]);

  return { forceRefresh };
}

// ✅ Hook for optimistic updates
export function useOptimisticUpdate<TData, TVariables>(
  queryKey: string[],
  updater: (oldData: TData | undefined, variables: TVariables) => TData
) {
  const queryClient = useQueryClient();

  const optimisticUpdate = useCallback((variables: TVariables) => {
    queryClient.setQueryData<TData>(queryKey, (oldData) => {
      return updater(oldData, variables);
    });
  }, [queryClient, queryKey, updater]);

  return { optimisticUpdate };
}

// ✅ Hook for checking if data is stale
export function useIsStale(queryKey: string[]) {
  const queryClient = useQueryClient();

  const checkStale = useCallback(() => {
    const state = queryClient.getQueryState(queryKey);
    if (!state) return true;
    return state.isInvalidated || false;
  }, [queryClient, queryKey]);

  return { checkStale };
}