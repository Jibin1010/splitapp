/**
 * In-Memory Sliding-Window Counter Rate Limiter
 * Provides thread-safe, memory-bounded rate limiting suitable for multi-app verification.
 */

interface RateLimitRecord {
  timestamps: number[]
}

const memoryStore = new Map<string, RateLimitRecord>()

// Periodic garbage collection to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of memoryStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 3600_000) // retain 1hr max
      if (record.timestamps.length === 0) {
        memoryStore.delete(key)
      }
    }
  }, 300_000).unref?.() // every 5 mins, unref so it won't block tests or process shutdown
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetMs: number
  total: number
}

/**
 * Checks and records an access event using a sliding window algorithm.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  let record = memoryStore.get(key)

  if (!record) {
    record = { timestamps: [] }
    memoryStore.set(key, record)
  }

  // Filter timestamps within current window
  const windowStart = now - windowMs
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart)

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0]
    const resetMs = Math.max(0, oldest + windowMs - now)
    return {
      allowed: false,
      remaining: 0,
      resetMs,
      total: record.timestamps.length,
    }
  }

  // Record this attempt
  record.timestamps.push(now)
  const remaining = limit - record.timestamps.length

  return {
    allowed: true,
    remaining,
    resetMs: windowMs,
    total: record.timestamps.length,
  }
}

/** Resets rate limits for testing */
export function resetRateLimits(): void {
  memoryStore.clear()
}

