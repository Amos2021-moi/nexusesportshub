import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// ✅ Create rate limiter
export const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
  analytics: true,
})

// ✅ Specific limiters for different endpoints
export const authLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 attempts per minute
  analytics: true,
})

export const postLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "60 s"), // 3 posts per minute
  analytics: true,
})

export const commentLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 comments per minute
  analytics: true,
})

export const uploadLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(2, "60 s"), // 2 uploads per minute
  analytics: true,
})