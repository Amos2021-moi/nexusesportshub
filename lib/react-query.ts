// lib/react-query.ts
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createContext, useContext, useRef } from "react";

// ✅ Query client configuration
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 3,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
};

// ✅ Create a singleton QueryClient
let clientSingleton: QueryClient | null = null;

function createQueryClient() {
  if (clientSingleton) return clientSingleton;
  
  clientSingleton = new QueryClient(queryClientConfig);
  return clientSingleton;
}

// ✅ Get the global query client instance
let globalQueryClient: QueryClient | null = null;

export function setQueryClient(client: QueryClient) {
  globalQueryClient = client;
}

export function getQueryClientInstance() {
  if (!globalQueryClient) {
    globalQueryClient = createQueryClient();
  }
  return globalQueryClient;
}

// ✅ ==================== CACHE MANAGEMENT ====================

// ✅ Invalidate specific query keys
export function invalidateQueries(key: string | string[]) {
  const client = getQueryClientInstance();
  if (client) {
    const keys = Array.isArray(key) ? key : [key];
    keys.forEach(k => {
      client.invalidateQueries({ queryKey: [k] });
    });
    console.log(`🔄 Invalidated queries: ${keys.join(', ')}`);
  }
}

// ✅ Invalidate with options (for more control)
export function invalidateQueriesWithOptions(options: { queryKey: any[]; exact?: boolean; refetchType?: 'active' | 'inactive' | 'all' | 'none' }) {
  const client = getQueryClientInstance();
  if (client) {
    client.invalidateQueries(options);
    console.log(`🔄 Invalidated with options: ${JSON.stringify(options)}`);
  }
}

// ✅ Invalidate ALL queries
export function invalidateAllQueries() {
  const client = getQueryClientInstance();
  if (client) {
    client.invalidateQueries();
    console.log('🔄 Invalidated ALL queries');
  }
}

// ✅ Reset all queries
export function resetAllQueries() {
  const client = getQueryClientInstance();
  if (client) {
    client.resetQueries();
    console.log('🔄 All queries reset');
  }
}

// ✅ Refetch specific queries
export function refetchQueries(key: string | string[]) {
  const client = getQueryClientInstance();
  if (client) {
    const keys = Array.isArray(key) ? key : [key];
    keys.forEach(k => {
      client.refetchQueries({ queryKey: [k] });
    });
    console.log(`🔄 Refetched queries: ${keys.join(', ')}`);
  }
}

// ✅ Refetch ALL active queries
export function refetchAllActiveQueries() {
  const client = getQueryClientInstance();
  if (client) {
    client.refetchQueries({
      type: 'active',
      exact: false,
    });
    console.log('🔄 Refetched ALL active queries');
  }
}

// ✅ Clear all cache
export function clearAllCache() {
  const client = getQueryClientInstance();
  if (client) {
    client.clear();
    console.log('🗑️ All cache cleared');
  }
}

// ✅ Remove specific queries from cache
export function removeQueries(key: string | string[]) {
  const client = getQueryClientInstance();
  if (client) {
    const keys = Array.isArray(key) ? key : [key];
    keys.forEach(k => {
      client.removeQueries({ queryKey: [k] });
    });
    console.log(`🗑️ Removed queries: ${keys.join(', ')}`);
  }
}

// ✅ Get query data from cache
export function getQueryData<T = any>(key: string | string[]): T | undefined {
  const client = getQueryClientInstance();
  if (client) {
    const keys = Array.isArray(key) ? key : [key];
    return client.getQueryData<T>(keys);
  }
  return undefined;
}

// ✅ Set query data in cache
export function setQueryData<T = any>(key: string | string[], data: T | ((old: T | undefined) => T)) {
  const client = getQueryClientInstance();
  if (client) {
    const keys = Array.isArray(key) ? key : [key];
    client.setQueryData<T>(keys, data);
    console.log(`📦 Set query data for: ${keys.join(', ')}`);
  }
}

// ✅ Check if data is stale
export function isStale(key: string | string[]) {
  const client = getQueryClientInstance();
  if (client) {
    const keys = Array.isArray(key) ? key : [key];
    const state = client.getQueryState(keys);
    if (!state) return true;
    return state.isInvalidated || false;
  }
  return true;
}

// ✅ Get query state
export function getQueryState(key: string | string[]) {
  const client = getQueryClientInstance();
  if (client) {
    const keys = Array.isArray(key) ? key : [key];
    return client.getQueryState(keys);
  }
  return null;
}

// ✅ Force refresh with delay (for when you need to wait for DB)
export async function forceRefreshWithDelay(delayMs: number = 500) {
  const client = getQueryClientInstance();
  if (client) {
    await client.invalidateQueries();
    // Wait for the specified delay
    await new Promise(resolve => setTimeout(resolve, delayMs));
    await client.refetchQueries({
      type: 'active',
      exact: false,
    });
    console.log(`🔄 Force refresh complete after ${delayMs}ms delay`);
  }
}

// ✅ Full cache reset (clear everything)
export function fullCacheReset() {
  const client = getQueryClientInstance();
  if (client) {
    client.clear();
    console.log('🗑️ Full cache reset complete');
  }
}

// ✅ ==================== REACT QUERY PROVIDER ====================

// ✅ Context for query client
const QueryClientContext = createContext<QueryClient | null>(null);

export function useQueryClientProvider() {
  const context = useContext(QueryClientContext);
  if (!context) {
    throw new Error('useQueryClientProvider must be used within a QueryClientProvider');
  }
  return context;
}

// ✅ Custom hook to get the query client (for components)
export function useQueryClientInstance() {
  const client = getQueryClientInstance();
  if (!client) {
    throw new Error('Query client not initialized. Make sure QueryProvider is mounted.');
  }
  return client;
}

// ✅ ==================== MUTATION HELPERS ====================

// ✅ Invalidate and refetch after a mutation
export async function invalidateAndRefetch(keys: string | string[]) {
  const client = getQueryClientInstance();
  if (client) {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    await Promise.all(keyArray.map(key => client.invalidateQueries({ queryKey: [key] })));
    await client.refetchQueries({
      type: 'active',
      exact: false,
    });
    console.log(`🔄 Invalidated and refetched: ${keyArray.join(', ')}`);
  }
}

// ✅ Mutation success handler with automatic cache invalidation
export function handleMutationSuccess(options?: {
  invalidateKeys?: string[];
  invalidateAll?: boolean;
  refetchActive?: boolean;
  delay?: number;
}) {
  return async () => {
    const client = getQueryClientInstance();
    if (!client) return;

    if (options?.invalidateAll) {
      await client.invalidateQueries();
    } else if (options?.invalidateKeys) {
      await Promise.all(options.invalidateKeys.map(key => 
        client.invalidateQueries({ queryKey: [key] })
      ));
    }

    if (options?.refetchActive !== false) {
      await client.refetchQueries({
        type: 'active',
        exact: false,
      });
    }

    console.log('✅ Mutation success - cache updated');
  };
}

// ✅ ==================== UTILITY HOOKS ====================

// ✅ Hook to force a full app refresh
export function useForceRefresh() {
  const client = getQueryClientInstance();

  const forceRefresh = async (delay: number = 500) => {
    if (!client) return;
    await client.invalidateQueries();
    await new Promise(resolve => setTimeout(resolve, delay));
    await client.refetchQueries({
      type: 'active',
      exact: false,
    });
    console.log('🔄 Force refresh complete');
  };

  return { forceRefresh };
}

// ✅ Hook to get data from cache
export function useCachedData<T = any>(key: string | string[]) {
  const client = getQueryClientInstance();
  if (!client) return undefined;
  
  const keys = Array.isArray(key) ? key : [key];
  return client.getQueryData<T>(keys);
}

// ✅ Hook to check if data is loading
export function useIsLoading(key: string | string[]) {
  const client = getQueryClientInstance();
  if (!client) return false;
  
  const keys = Array.isArray(key) ? key : [key];
  const state = client.getQueryState(keys);
  return state?.status === 'pending';
}