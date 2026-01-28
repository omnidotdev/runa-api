/**
 * In-memory sliding-window rate limiter for AI chat endpoints.
 *
 * Tracks request counts per key (userId or organizationId) within a
 * configurable time window. Counters are stored in a Map and automatically
 * cleaned up on a periodic interval to prevent memory leaks.
 *
 * For v1, this is sufficient for single-instance deployments.
 * For production scale, swap the backing store to Redis.
 */

interface RateLimitEntry {
  /** Timestamps of requests within the current window. */
  timestamps: number[];
}

interface RateLimitConfig {
  /** Maximum number of requests allowed within the window. */
  maxRequests: number;
  /** Time window in milliseconds. */
  windowMs: number;
}

interface RateLimitResult {
  /** Whether the request is allowed. */
  allowed: boolean;
  /** Number of remaining requests in the current window. */
  remaining: number;
  /** Seconds until the oldest request expires from the window. */
  retryAfterSeconds: number;
}

const store = new Map<string, RateLimitEntry>();

/** Cleanup interval handle — clears expired entries every 60 seconds. */
const CLEANUP_INTERVAL_MS = 60_000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanupTimer(windowMs: number): void {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      // Remove timestamps outside the largest possible window
      entry.timestamps = entry.timestamps.filter(
        (ts) => now - ts < windowMs,
      );
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  // Allow the process to exit even if the timer is running
  if (typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

/**
 * Check whether a request is allowed under the rate limit.
 *
 * Uses a sliding window: only timestamps within the last `windowMs`
 * milliseconds are counted.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const { maxRequests, windowMs } = config;

  ensureCleanupTimer(windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Prune expired timestamps
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    // Rate limited — compute retry-after from the oldest timestamp
    const oldestTimestamp = entry.timestamps[0];
    const retryAfterMs = oldestTimestamp + windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  // Allow the request
  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    retryAfterSeconds: 0,
  };
}

/** Per-user rate limit: 20 requests per 60 seconds. */
export const USER_CHAT_LIMIT: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60_000,
};

/** Per-org rate limit: 100 requests per 60 seconds. */
export const ORG_CHAT_LIMIT: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60_000,
};
