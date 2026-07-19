// lib/react-query.ts
import { QueryClient } from "@tanstack/react-query";

// ✅ Get the global query client
let globalQueryClient: QueryClient | null = null;

export function setQueryClient(client: QueryClient) {
  globalQueryClient = client;
}

export function getQueryClientInstance() {
  return globalQueryClient;
}

// ✅ Invalidate specific query keys
export function invalidateQueries(key: string | string[]) {
  const client = getQueryClientInstance();
  if (client) {
    client.invalidateQueries({ queryKey: typeof key === 'string' ? [key] : key });
    console.log(`✅ Invalidated queries: ${typeof key === 'string' ? key : key.join(', ')}`);
  }
}

// ✅ Invalidate ALL queries
export function invalidateAllQueries() {
  const client = getQueryClientInstance();
  if (client) {
    client.invalidateQueries();
    console.log('✅ Invalidated ALL queries');
  }
}

// ✅ Reset all queries
export function resetAllQueries() {
  const client = getQueryClientInstance();
  if (client) {
    client.resetQueries();
    console.log('✅ All queries reset');
  }
}

// ✅ Refetch specific queries
export function refetchQueries(key: string | string[]) {
  const client = getQueryClientInstance();
  if (client) {
    client.refetchQueries({ queryKey: typeof key === 'string' ? [key] : key });
    console.log(`✅ Refetched queries: ${typeof key === 'string' ? key : key.join(', ')}`);
  }
}

// ✅ Clear all cache
export function clearAllCache() {
  const client = getQueryClientInstance();
  if (client) {
    client.clear();
    console.log('✅ All cache cleared');
  }
}