// lib/mutations.ts
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

// ✅ Global mutation success handler
export function useMutationSuccess() {
  const queryClient = useQueryClient();

  // ✅ Invalidate ALL queries (use after any mutation)
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries();
    console.log('🔄 All cache invalidated after mutation');
  }, [queryClient]);

  // ✅ Invalidate specific keys
  const invalidate = useCallback((keys: string[]) => {
    keys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
    console.log(`🔄 Invalidated: ${keys.join(', ')}`);
  }, [queryClient]);

  // ✅ Refresh all (invalidate + refetch)
  const refreshAll = useCallback(async () => {
    await queryClient.invalidateQueries();
    await queryClient.refetchQueries();
    console.log('🔄 All refreshed');
  }, [queryClient]);

  // ✅ Reset and refetch
  const resetAll = useCallback(() => {
    queryClient.resetQueries();
    console.log('🔄 All queries reset');
  }, [queryClient]);

  return { invalidateAll, invalidate, refreshAll, resetAll };
}

// ✅ Hook for mutations that should refresh the entire app
export function useAppMutation() {
  const { invalidateAll, refreshAll } = useMutationSuccess();

  return {
    // ✅ After any mutation, call this
    onSuccess: () => {
      invalidateAll();
    },
    // ✅ After any mutation with refresh
    onSuccessWithRefresh: async () => {
      await refreshAll();
    },
  };
}