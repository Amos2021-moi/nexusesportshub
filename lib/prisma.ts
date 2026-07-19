import { PrismaClient } from '@prisma/client'
import { eventService } from './services/event.service'

// ============================================ //
// ✅ CONNECTION POOLING & CACHING              //
// ============================================ //

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

// ✅ OPTIMIZED: Prisma client with proper logging
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // ✅ Only log errors in production
  log: isDevelopment ? ['error', 'warn', 'info'] : ['error'],
})

// ============================================ //
// ✅ MONITOR: Connection pool health           //
// ============================================ //

// ✅ Log connection pool status (only in development)
if (!isProduction) {
  setInterval(() => {
    // @ts-ignore - Internal property access
    const pool = prisma._pool
    if (pool) {
      console.log(`📊 Connection pool status: Active: ${pool.active || 0}, Idle: ${pool.idle || 0}, Pending: ${pool.pending || 0}`)
    }
  }, 60000) // Log every minute
}

// ============================================ //
// ✅ PERFORMANCE: Query Caching Middleware     //
// ============================================ //

// ✅ Cache for expensive queries
const queryCache = new Map<string, { data: any; timestamp: number }>()
// ✅ Different TTLs for different operations
const CACHE_TTL = {
  DEFAULT: 60 * 1000, // 1 minute
  LONG: 5 * 60 * 1000, // 5 minutes
  SHORT: 10 * 1000, // 10 seconds
}

// ✅ Track cache hits/misses for monitoring
let cacheHits = 0
let cacheMisses = 0

// ============================================ //
// ✅ MIDDLEWARE: Events & Performance          //
// ============================================ //

prisma.$use(async (params, next) => {
  const startTime = performance.now()
  const model = params.model
  const action = params.action
  
  // ✅ Generate cache key for read operations
  const isRead = ['findMany', 'findUnique', 'findFirst', 'count'].includes(action)
  const cacheKey = model && isRead
    ? `${model}-${action}-${JSON.stringify(params.args)}`
    : null

  // ✅ Check cache for read operations in production
  if (cacheKey && isProduction) {
    const cached = queryCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL.DEFAULT) {
      cacheHits++
      // Only log in development
      if (isDevelopment) {
        console.log(`✅ Cache HIT: ${model}.${action}`)
      }
      return cached.data
    }
    cacheMisses++
  }

  // ✅ Execute query with timeout protection
  try {
    const result = await Promise.race([
      next(params),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Query timeout after 10s: ${model}.${action}`)), 10000)
      )
    ])

    // ✅ Cache read results in production
    if (cacheKey && isProduction) {
      // ✅ Determine TTL based on operation
      let ttl = CACHE_TTL.DEFAULT
      if (model === 'Season' || model === 'Tournament' || model === 'Award') {
        ttl = CACHE_TTL.LONG
      } else if (model === 'Result' || model === 'Fixture' || model === 'LeagueEntry') {
        ttl = CACHE_TTL.SHORT
      }
      
      queryCache.set(cacheKey, { data: result, timestamp: Date.now() })
      
      // ✅ Prevent memory leaks - limit cache size
      if (queryCache.size > 200) {
        const oldestKey = Array.from(queryCache.keys())[0]
        queryCache.delete(oldestKey)
      }
    }

    // ✅ Clear cache on ANY mutation
    if (['create', 'update', 'delete', 'upsert', 'createMany', 'updateMany', 'deleteMany'].includes(action)) {
      queryCache.clear()
      cacheHits = 0
      cacheMisses = 0
      console.log(`🔄 Cache cleared after ${model}.${action}`)
    }

    // ✅ Log slow queries
    const duration = performance.now() - startTime
    const slowThreshold = isProduction ? 500 : 100
    if (duration > slowThreshold) {
      console.warn(`🐌 Slow query: ${model}.${action} took ${duration.toFixed(0)}ms`)
    }

    return result
  } catch (error) {
    // ✅ Handle connection pool errors
    const duration = performance.now() - startTime
    console.error(`❌ Query failed: ${model}.${action} after ${duration.toFixed(0)}ms`, error)
    
    // ✅ If connection pool exhausted, log and re-throw
    if (error instanceof Error && error.message.includes('Timed out fetching a new connection')) {
      console.error('🔥 CONNECTION POOL EXHAUSTED!')
      console.error('🔥 Add connection_limit=20 to your DATABASE_URL in .env.local')
    }
    
    throw error
  }
})

// ============================================ //
// ✅ CLEANUP: Clear cache periodically         //
// ============================================ //

if (isProduction) {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of queryCache) {
      if (now - value.timestamp > CACHE_TTL.DEFAULT) {
        queryCache.delete(key)
      }
    }
  }, CACHE_TTL.DEFAULT)
}

// ============================================ //
// ✅ DEV ONLY: Global instance                 //
// ============================================ //

if (!isProduction) {
  globalForPrisma.prisma = prisma
}

// ============================================ //
// ✅ UTILITY: Clear cache on demand            //
// ============================================ //

export const clearQueryCache = () => {
  queryCache.clear()
  cacheHits = 0
  cacheMisses = 0
  console.log('✅ Query cache cleared')
}

// ============================================ //
// ✅ UTILITY: Get cache stats                  //
// ============================================ //

export const getCacheStats = () => ({
  size: queryCache.size,
  keys: Array.from(queryCache.keys()),
  hits: cacheHits,
  misses: cacheMisses,
  hitRate: cacheHits + cacheMisses > 0 
    ? Math.round((cacheHits / (cacheHits + cacheMisses)) * 100) 
    : 0,
})

// ============================================ //
// ✅ UTILITY: Invalidate cache for specific key//
// ============================================ //

export const invalidateCache = (keyPattern: string) => {
  const keysToDelete: string[] = []
  for (const key of queryCache.keys()) {
    if (key.includes(keyPattern)) {
      keysToDelete.push(key)
    }
  }
  keysToDelete.forEach(key => queryCache.delete(key))
  console.log(`✅ Invalidated ${keysToDelete.length} cache entries matching: ${keyPattern}`)
}

// ============================================ //
// ✅ UTILITY: Check database connection        //
// ============================================ //

export async function checkDatabaseConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    return { success: true, message: 'Connected to database' }
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return { success: false, error: String(error) }
  }
}

// ============================================ //
// ✅ UTILITY: Get connection pool stats        //
// ============================================ //

export function getConnectionPoolStats() {
  // @ts-ignore - Internal property access
  const pool = prisma._pool
  return {
    active: pool?.active || 0,
    idle: pool?.idle || 0,
    pending: pool?.pending || 0,
  }
}

export default prisma