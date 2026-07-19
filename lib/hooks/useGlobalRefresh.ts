// hooks/useGlobalRefresh.ts
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export function useGlobalRefresh() {
  const queryClient = useQueryClient();

  // ✅ Refresh all queries
  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries();
    console.log('🔄 All queries refreshed');
  }, [queryClient]);

  // ✅ Refresh specific queries
  const refreshQueries = useCallback((keys: string[]) => {
    keys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
    console.log(`🔄 Refreshed queries: ${keys.join(', ')}`);
  }, [queryClient]);

  // ✅ Force refetch all active queries
  const refetchAll = useCallback(() => {
    queryClient.refetchQueries();
    console.log('🔄 All queries refetched');
  }, [queryClient]);

  // ✅ Reset all queries
  const resetAll = useCallback(() => {
    queryClient.resetQueries();
    console.log('🔄 All queries reset');
  }, [queryClient]);

  // ✅ Clear cache
  const clearCache = useCallback(() => {
    queryClient.clear();
    console.log('🔄 Cache cleared');
  }, [queryClient]);

  return { refreshAll, refreshQueries, refetchAll, resetAll, clearCache };
}