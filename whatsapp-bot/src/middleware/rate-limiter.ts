// ============================================= //
// ✅ RATE LIMITER MIDDLEWARE                   //
// ============================================= //
// Simple in-memory rate limiter per user JID.  //
// Prevents command spam and abuse.             //
// Uses a sliding window per sender.            //
// ============================================= //

import { config } from "../config";
import { IncomingMessage } from "../types/events";
import { createLogger } from "../core/logger";

const log = createLogger("middleware.rate-limiter");

// ============================================= //
// ✅ CONFIGURATION                             //
// ============================================= //

interface RateLimitConfig {
  /** Max commands allowed in the window */
  maxCommands: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Whether to allow burst (a higher limit for the first requests) */
  allowBurst: boolean;
  /** Burst multiplier (e.g., 2 = double commands in first window) */
  burstMultiplier: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxCommands: 10,
  windowMs: 60_000, // 1 minute
  allowBurst: true,
  burstMultiplier: 3,
};

// ============================================= //
// ✅ IN-MEMORY STORE                           //
// ============================================= //

interface RateLimitEntry {
  /** Timestamps of command executions within the window */
  timestamps: number[];
  /** Whether this user has used their burst allowance */
  burstUsed: boolean;
}

class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Clean up stale entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60_000);
    this.cleanupInterval.unref();
  }

  /**
   * Check if a request is allowed for a given key.
   * Returns true if allowed, false if rate limited.
   */
  check(key: string, config: RateLimitConfig = DEFAULT_CONFIG): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      // First request — create entry and allow
      this.store.set(key, {
        timestamps: [now],
        burstUsed: false,
      });
      return true;
    }

    // Remove timestamps outside the window
    const windowStart = now - config.windowMs;
    entry.timestamps = entry.timestamps.filter((ts) => ts >= windowStart);

    // Determine effective limit
    let effectiveLimit = config.maxCommands;
    if (config.allowBurst && !entry.burstUsed) {
      effectiveLimit = config.maxCommands * config.burstMultiplier;
    }

    if (entry.timestamps.length >= effectiveLimit) {
      // Rate limited
      log.warn(
        {
          key: key.substring(0, 10) + "...",
          count: entry.timestamps.length,
          limit: effectiveLimit,
          windowMs: config.windowMs,
        },
        "Rate limit exceeded"
      );
      return false;
    }

    // Mark burst as used if we're beyond the normal limit
    if (
      config.allowBurst &&
      !entry.burstUsed &&
      entry.timestamps.length >= config.maxCommands
    ) {
      entry.burstUsed = true;
    }

    entry.timestamps.push(now);
    return true;
  }

  /**
   * Get rate limit info for a key.
   */
  getInfo(key: string): {
    remaining: number;
    resetMs: number;
    limit: number;
  } | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const now = Date.now();
    const windowStart = now - DEFAULT_CONFIG.windowMs;
    const recent = entry.timestamps.filter((ts) => ts >= windowStart);

    let effectiveLimit = DEFAULT_CONFIG.maxCommands;
    if (DEFAULT_CONFIG.allowBurst && !entry.burstUsed) {
      effectiveLimit = DEFAULT_CONFIG.maxCommands * DEFAULT_CONFIG.burstMultiplier;
    }

    const remaining = Math.max(0, effectiveLimit - recent.length);
    const oldestTimestamp = recent.length > 0 ? Math.min(...recent) : now;
    const resetMs = Math.max(0, windowStart + DEFAULT_CONFIG.windowMs - oldestTimestamp);

    return {
      remaining,
      resetMs,
      limit: effectiveLimit,
    };
  }

  /**
   * Remove stale entries to prevent memory leaks.
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = DEFAULT_CONFIG.windowMs * 2; // Keep entries twice the window

    for (const [key, entry] of this.store.entries()) {
      const oldest = Math.min(...entry.timestamps);
      if (now - oldest > maxAge) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all rate limit data (e.g., on bot restart).
   */
  clear(): void {
    this.store.clear();
  }
}

// ============================================= //
// ✅ SINGLETON STORE                           //
// ============================================= //

const store = new RateLimitStore();

// ============================================= //
// ✅ PUBLIC API                                //
// ============================================= //

/**
 * Check if a message sender is rate limited.
 * Returns true if the message should be allowed, false if rate limited.
 */
export function isRateLimited(message: IncomingMessage): boolean {
  const key = message.senderJid;
  const allowed = store.check(key);

  if (!allowed) {
    log.warn(
      { sender: message.senderJid, command: message.commandName },
      "Command blocked by rate limiter"
    );
  }

  return !allowed;
}

/**
 * Check if a specific JID is rate limited (without message context).
 */
export function isJidRateLimited(jid: string): boolean {
  return !store.check(jid);
}

/**
 * Get rate limit info for a JID.
 */
export function getRateLimitInfo(jid: string) {
  return store.getInfo(jid);
}

/**
 * Clear all rate limit data.
 */
export function clearRateLimits(): void {
  store.clear();
}
