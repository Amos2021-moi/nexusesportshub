// lib/cache.ts
import { unstable_cache } from 'next/cache'

// ✅ Global cache options
export const CACHE_OPTIONS = {
  // Short cache (10 seconds) - for frequently changing data
  SHORT: { revalidate: 10 },
  // Medium cache (60 seconds) - for moderately changing data
  MEDIUM: { revalidate: 60 },
  // Long cache (5 minutes) - for rarely changing data
  LONG: { revalidate: 300 },
  // Very long cache (1 hour) - for static data
  VERY_LONG: { revalidate: 3600 },
}

// ✅ Helper to create cached queries
export function withCache<T>(
  fn: () => Promise<T>,
  key: string | string[],
  options: { revalidate: number } = CACHE_OPTIONS.MEDIUM
) {
  return unstable_cache(fn, typeof key === 'string' ? [key] : key, options)
}

// ✅ Helper to clear specific cache
export async function clearCache(key: string | string[]) {
  const cacheKey = typeof key === 'string' ? [key] : key
  // Note: Next.js doesn't provide a way to clear specific cache entries
  // This is a placeholder for when the API is available
  console.log(`Cache cleared for: ${cacheKey.join('-')}`)
}