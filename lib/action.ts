// lib/actions.ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { clearQueryCache } from "./prisma";

// ✅ Clear ALL Next.js cache
export async function clearAllCache() {
  // ✅ Clear Prisma cache
  clearQueryCache();
  
  // ✅ Revalidate all paths
  revalidatePath('/', 'layout');
  
  // ✅ Revalidate specific tags
  revalidateTag('seasons', 'layout');
  revalidateTag('players', 'layout');
  revalidateTag('fixtures', 'layout');
  revalidateTag('tournaments', 'layout');
  revalidateTag('standings', 'layout');
  revalidateTag('stats', 'layout');
  
  console.log('✅ All server cache cleared');
}

// ✅ Clear specific cache by path
export async function clearCacheForPath(path: string) {
  revalidatePath(path);
  console.log(`✅ Cache cleared for: ${path}`);
}

// ✅ Clear cache by tag
export async function clearCacheByTag(tag: string) {
  revalidateTag(tag, 'layout');
  console.log(`✅ Cache cleared for tag: ${tag}`);
}