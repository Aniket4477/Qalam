/**
 * In-memory rate limiting implementation
 * For production, consider using Redis with @upstash/ratelimit
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (will reset on server restart)
// For production with multiple instances, use Redis
const store = new Map<string, RateLimitEntry>()

// Rate limit configurations per endpoint type
const RATE_LIMITS = {
  upload: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  vote: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
  },
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
} as const

export type RateLimitType = keyof typeof RATE_LIMITS

export interface RateLimitResult {
  success: boolean
  limit?: number
  remaining?: number
  resetAt?: number
  retryAfter?: number
}

/**
 * Rate limit a request based on identifier and type
 */
export async function rateLimit(
  identifier: string,
  type: RateLimitType = 'api'
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[type]
  const key = `${type}:${identifier}`
  const now = Date.now()

  // Clean up expired entries periodically (simple approach)
  if (Math.random() < 0.01) {
    // 1% chance to clean up
    cleanupExpiredEntries(now)
  }

  const entry = store.get(key)

  // No entry or expired entry - create new
  if (!entry || now > entry.resetAt) {
    store.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    })

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    }
  }

  // Entry exists and not expired
  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000), // seconds
    }
  }

  // Increment count
  entry.count++
  store.set(key, entry)

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries(now: number): void {
  const keysToDelete: string[] = []

  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      keysToDelete.push(key)
    }
  }

  for (const key of keysToDelete) {
    store.delete(key)
  }
}

/**
 * Reset rate limit for a specific identifier and type
 * Useful for testing or manual intervention
 */
export function resetRateLimit(identifier: string, type: RateLimitType): void {
  const key = `${type}:${identifier}`
  store.delete(key)
}

/**
 * Get current rate limit status without incrementing
 */
export async function getRateLimitStatus(
  identifier: string,
  type: RateLimitType = 'api'
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[type]
  const key = `${type}:${identifier}`
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
    }
  }

  return {
    success: entry.count < config.maxRequests,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: entry.resetAt,
    retryAfter: entry.count >= config.maxRequests
      ? Math.ceil((entry.resetAt - now) / 1000)
      : undefined,
  }
}
