/**
 * In-memory rate limiter for API routes.
 * Uses a Map with sliding-window counters per key.
 * For production at scale, swap to Upstash Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp (ms)
}

const store = new Map<string, RateLimitEntry>();

// Periodically clean expired entries (every 60s)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    const entries = Array.from(store.entries());
    for (const [key, entry] of entries) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 60_000);
}

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfter: number; // seconds until reset (0 if not limited)
}

/** Pre-configured limits per route category */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  generate:      { maxRequests: 20,  windowSeconds: 3600 },   // 20/hr
  publish:       { maxRequests: 50,  windowSeconds: 3600 },   // 50/hr
  publicApi:     { maxRequests: 100, windowSeconds: 3600 },   // 100/hr
  auth:          { maxRequests: 30,  windowSeconds: 900 },    // 30/15min (login attempts)
  oauthRedirect: { maxRequests: 200, windowSeconds: 3600 },   // OAuth connect/callback — just redirects, not sensitive
  payments:      { maxRequests: 5,   windowSeconds: 60 },     // 5/min
};

/**
 * Check rate limit for a given key + config.
 * @param key   Unique identifier (e.g. `generate:userId` or `auth:ip`)
 * @param config  The limit config to apply
 */
export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  // Bypass rate limiting in development mode for better DX
  if (process.env.NODE_ENV === "development") {
    return { success: true, remaining: 999, retryAfter: 0 };
  }

  const now = Date.now();
  const entry = store.get(key);

  // If no entry or window expired, start fresh
  if (!entry || now > entry.resetAt) {
    store.set(key, {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    });
    return { success: true, remaining: config.maxRequests - 1, retryAfter: 0 };
  }

  // Within window
  if (entry.count < config.maxRequests) {
    entry.count++;
    return {
      success: true,
      remaining: config.maxRequests - entry.count,
      retryAfter: 0,
    };
  }

  // Rate limited
  const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
  return { success: false, remaining: 0, retryAfter };
}

/**
 * Helper to build a NextResponse 429 JSON body
 */
export function rateLimitResponse(retryAfter: number) {
  return {
    success: false,
    error: "rate_limit_exceeded",
    message: "Too many requests. Please wait before trying again.",
    retryAfter,
  };
}

/**
 * Detect the route category from a pathname so callers
 * can look up the right config from RATE_LIMITS.
 */
export function detectRouteCategory(pathname: string): string | null {
  // OAuth connect/callback are just redirects — use generous limit
  if (pathname.includes("/connect") || pathname.includes("/callback")) return "oauthRedirect";
  if (pathname.startsWith("/api/generate"))  return "generate";
  if (pathname.startsWith("/api/publish"))   return "publish";
  if (pathname.startsWith("/api/v1"))        return "publicApi";
  if (pathname.startsWith("/api/auth"))      return "auth";
  if (pathname.startsWith("/api/payments"))  return "payments";
  return null;
}
