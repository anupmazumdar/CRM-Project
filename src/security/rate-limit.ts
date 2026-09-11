import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Timestamp in milliseconds when the window resets
}

// Resilient in-memory sliding-window store for fallback / local development
interface MemoryEntry {
  timestamps: number[];
}

const memoryStore = new Map<string, MemoryEntry>();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const MAX_IP_ATTEMPTS = 20;
const MAX_ACCOUNT_ACTION_ATTEMPTS = 10;

// Lazy initialization of Upstash rate limiters
let upstashRatelimit: Ratelimit | null = null;
let isUpstashInitialized = false;

let upstashIpRatelimit: Ratelimit | null = null;
let isUpstashIpInitialized = false;

let upstashAccountActionRatelimit: Ratelimit | null = null;
let isUpstashAccountActionInitialized = false;

function getUpstashLimiter(): Ratelimit | null {
  if (isUpstashInitialized) return upstashRatelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token && url.trim().length > 0 && token.trim().length > 0) {
    try {
      const redis = new Redis({
        url: url.trim(),
        token: token.trim(),
      });

      upstashRatelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(MAX_ATTEMPTS, '15 m'),
        analytics: true,
        prefix: 'crm_ratelimit',
      });
      isUpstashInitialized = true;
      return upstashRatelimit;
    } catch (err) {
      console.warn('[RateLimiter] Failed to initialize Upstash Redis. Falling back to local memory store:', err);
      isUpstashInitialized = true;
      upstashRatelimit = {
        limit: async (identifier: string) => {
          const res = checkMemoryRateLimit(identifier, MAX_ATTEMPTS);
          return {
            success: res.success,
            limit: res.limit,
            remaining: res.remaining,
            reset: res.reset,
            pending: Promise.resolve(),
          };
        },
      } as unknown as Ratelimit;
      return upstashRatelimit;
    }
  }

  console.warn('[RateLimiter] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is unconfigured. Falling back to local memory store.');
  isUpstashInitialized = true;
  upstashRatelimit = {
    limit: async (identifier: string) => {
      const res = checkMemoryRateLimit(identifier, MAX_ATTEMPTS);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
        pending: Promise.resolve(),
      };
    },
  } as unknown as Ratelimit;
  return upstashRatelimit;
}

function getUpstashIpLimiter(): Ratelimit | null {
  if (isUpstashIpInitialized) return upstashIpRatelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token && url.trim().length > 0 && token.trim().length > 0) {
    try {
      const redis = new Redis({
        url: url.trim(),
        token: token.trim(),
      });

      upstashIpRatelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(MAX_IP_ATTEMPTS, '15 m'),
        analytics: true,
        prefix: 'crm_ip_ratelimit',
      });
      isUpstashIpInitialized = true;
      return upstashIpRatelimit;
    } catch (err) {
      console.warn('[RateLimiter] Failed to initialize Upstash Redis IP limiter:', err);
      isUpstashIpInitialized = true;
      upstashIpRatelimit = {
        limit: async (identifier: string) => {
          const res = checkMemoryRateLimit(identifier, MAX_IP_ATTEMPTS);
          return {
            success: res.success,
            limit: res.limit,
            remaining: res.remaining,
            reset: res.reset,
            pending: Promise.resolve(),
          };
        },
      } as unknown as Ratelimit;
      return upstashIpRatelimit;
    }
  }

  console.warn('[RateLimiter] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is unconfigured. IP rate limiting falling back to local memory store.');
  isUpstashIpInitialized = true;
  upstashIpRatelimit = {
    limit: async (identifier: string) => {
      const res = checkMemoryRateLimit(identifier, MAX_IP_ATTEMPTS);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
        pending: Promise.resolve(),
      };
    },
  } as unknown as Ratelimit;
  return upstashIpRatelimit;
}

function getUpstashAccountActionLimiter(): Ratelimit | null {
  if (isUpstashAccountActionInitialized) return upstashAccountActionRatelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token && url.trim().length > 0 && token.trim().length > 0) {
    try {
      const redis = new Redis({
        url: url.trim(),
        token: token.trim(),
      });

      upstashAccountActionRatelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(MAX_ACCOUNT_ACTION_ATTEMPTS, '15 m'),
        analytics: true,
        prefix: 'crm_account_ratelimit',
      });
      isUpstashAccountActionInitialized = true;
      return upstashAccountActionRatelimit;
    } catch (err) {
      console.warn('[RateLimiter] Failed to initialize Upstash Redis Account Action limiter:', err);
      isUpstashAccountActionInitialized = true;
      upstashAccountActionRatelimit = {
        limit: async (identifier: string) => {
          const res = checkMemoryRateLimit(identifier, MAX_ACCOUNT_ACTION_ATTEMPTS);
          return {
            success: res.success,
            limit: res.limit,
            remaining: res.remaining,
            reset: res.reset,
            pending: Promise.resolve(),
          };
        },
      } as unknown as Ratelimit;
      return upstashAccountActionRatelimit;
    }
  }

  console.warn('[RateLimiter] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is unconfigured. Account action rate limiting falling back to local memory store.');
  isUpstashAccountActionInitialized = true;
  upstashAccountActionRatelimit = {
    limit: async (identifier: string) => {
      const res = checkMemoryRateLimit(identifier, MAX_ACCOUNT_ACTION_ATTEMPTS);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
        pending: Promise.resolve(),
      };
    },
  } as unknown as Ratelimit;
  return upstashAccountActionRatelimit;
}

/**
 * In-memory sliding window rate limiter fallback.
 * Ensures security is never disabled even if Redis is temporarily offline or unconfigured.
 */
export function checkMemoryRateLimit(
  identifier: string,
  maxAttempts: number = MAX_ATTEMPTS,
  now: number = Date.now()
): RateLimitResult {
  // Prune expired entries to prevent memory leaks
  if (memoryStore.size > 5000) {
    memoryStore.forEach((entry, key) => {
      entry.timestamps = entry.timestamps.filter((ts: number) => now - ts < WINDOW_MS);
      if (entry.timestamps.length === 0) memoryStore.delete(key);
    });
  }

  let entry = memoryStore.get(identifier);
  if (!entry) {
    entry = { timestamps: [] };
    memoryStore.set(identifier, entry);
  }

  // Filter timestamps to only keep those within current sliding window
  entry.timestamps = entry.timestamps.filter((ts: number) => now - ts < WINDOW_MS);

  if (entry.timestamps.length >= maxAttempts) {
    const oldest = entry.timestamps[0];
    const reset = oldest + WINDOW_MS;
    return {
      success: false,
      limit: maxAttempts,
      remaining: 0,
      reset,
    };
  }

  entry.timestamps.push(now);
  const remaining = Math.max(0, maxAttempts - entry.timestamps.length);
  const reset = entry.timestamps[0] + WINDOW_MS;

  return {
    success: true,
    limit: maxAttempts,
    remaining,
    reset,
  };
}

export function resetMemoryRateLimit(identifier: string): void {
  memoryStore.delete(identifier);
}

/**
 * VULN-17: IP Spoofing & Rate-Limit Bypass Prevention.
 *
 * Trust Assumptions:
 * 1. Assumes deployment behind Vercel, Cloudflare, or trusted reverse proxies (e.g. AWS ALB/Nginx)
 *    which set/sanitize platform headers:
 *    - `request.ip`: Populated directly by Vercel/Next.js edge runtime from the TCP connection socket.
 *    - `cf-connecting-ip`: Injected and overwritten by Cloudflare edge servers.
 *    - `x-real-ip`: Set/overwritten by the perimeter reverse proxy.
 * 2. If inspecting `X-Forwarded-For`, proxies in the forwarding chain append incoming hops to the right.
 *    The first (leftmost) entry is untrusted client input and trivially spoofable (e.g. `X-Forwarded-For: <fake-ip>, <real-ip>`).
 *    Taking the rightmost non-empty hop ensures we inspect the peer IP recorded by the trusted edge.
 * 3. Fallback to '127.0.0.1' is permitted only in non-production environments (development and automated testing).
 *    In production (`NODE_ENV === 'production'`), requests without a verifiable client IP are flagged and marked untrusted.
 */
export function getClientIp(request: NextRequest): string {
  // 1. Direct platform property (Vercel / Edge runtime)
  const directIp = (request as unknown as { ip?: string }).ip;
  if (directIp && typeof directIp === 'string' && directIp.trim().length > 0) {
    return directIp.trim();
  }

  // 2. Cloudflare connecting IP (trusted edge overwrite)
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp && cfConnectingIp.trim().length > 0) {
    return cfConnectingIp.trim();
  }

  // 3. Trusted reverse proxy header (Vercel / Nginx / ALB)
  const realIp = request.headers.get('x-real-ip');
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }

  // 4. Rightmost hop of X-Forwarded-For (perimeter proxy appends rather than prepends)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const hops = forwardedFor.split(',').map((s) => s.trim()).filter(Boolean);
    if (hops.length > 0) {
      const rightmost = hops[hops.length - 1];
      if (rightmost) return rightmost;
    }
  }

  // 5. Fallback behavior: allow local loopback in dev/test, flag & mark untrusted in production
  if (process.env.NODE_ENV === 'production') {
    console.warn('[RateLimiter:Security] Missing or invalid client IP in production request. Flagged as untrusted-client-ip.');
    return 'untrusted-client-ip';
  }

  return '127.0.0.1';
}

/**
 * Validates login rate limit using Upstash Redis sliding-window with resilient local fallback.
 * Enforces two independent limits:
 * 1. login-ip:{ip} (20 attempts / 15m) to thwart email enumeration and credential stuffing.
 * 2. login:{email}:{ip} (5 attempts / 15m) to thwart single-target brute force.
 */
export async function checkLoginRateLimit(request: NextRequest, email: string): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  if (ip === 'untrusted-client-ip' && process.env.NODE_ENV === 'production') {
    return {
      success: false,
      limit: 0,
      remaining: 0,
      reset: Date.now() + WINDOW_MS,
    };
  }
  const normalizedEmail = email.toLowerCase().trim();
  const emailIpIdentifier = `login:${normalizedEmail}:${ip}`;
  const ipIdentifier = `login-ip:${ip}`;
  const now = Date.now();

  // VULN-10: Check IP-only rate limit first
  let ipResult: RateLimitResult;
  const ipLimiter = getUpstashIpLimiter();
  if (ipLimiter) {
    try {
      const res = await ipLimiter.limit(ipIdentifier);
      ipResult = {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
      };
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[RateLimiter:Fatal] Upstash Redis IP limiter check failed in production:', err);
        throw new Error('Rate limit check unavailable');
      }
      ipResult = checkMemoryRateLimit(ipIdentifier, MAX_IP_ATTEMPTS, now);
    }
  } else {
    if (process.env.NODE_ENV === 'production') {
      console.error('[RateLimiter:Fatal] Upstash Redis IP limiter unconfigured in production.');
      throw new Error('Rate limiting unconfigured in production');
    }
    ipResult = checkMemoryRateLimit(ipIdentifier, MAX_IP_ATTEMPTS, now);
  }

  if (!ipResult.success) {
    return ipResult;
  }

  // Check per-(email, ip) rate limit
  let emailIpResult: RateLimitResult;
  const emailIpLimiter = getUpstashLimiter();
  if (emailIpLimiter) {
    try {
      const res = await emailIpLimiter.limit(emailIpIdentifier);
      emailIpResult = {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
      };
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[RateLimiter:Fatal] Upstash Redis email-IP limiter check failed in production:', err);
        throw new Error('Rate limit check unavailable');
      }
      emailIpResult = checkMemoryRateLimit(emailIpIdentifier, MAX_ATTEMPTS, now);
    }
  } else {
    if (process.env.NODE_ENV === 'production') {
      console.error('[RateLimiter:Fatal] Upstash Redis email-IP limiter unconfigured in production.');
      throw new Error('Rate limiting unconfigured in production');
    }
    emailIpResult = checkMemoryRateLimit(emailIpIdentifier, MAX_ATTEMPTS, now);
  }

  return emailIpResult;
}

/**
 * VULN-13: Rate limits authenticated account actions (password change, admin password reset).
 * Keyed by session user ID with a ceiling of 10 attempts per 15 minutes.
 */
export async function checkAccountActionRateLimit(userId: string): Promise<RateLimitResult> {
  const identifier = `account-action:${userId}`;
  const now = Date.now();

  const limiter = getUpstashAccountActionLimiter();
  if (limiter) {
    try {
      const res = await limiter.limit(identifier);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
      };
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[RateLimiter:Fatal] Upstash Redis account action limiter check failed in production:', err);
        throw new Error('Rate limit check unavailable');
      }
      return checkMemoryRateLimit(identifier, MAX_ACCOUNT_ACTION_ATTEMPTS, now);
    }
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('[RateLimiter:Fatal] Upstash Redis account action limiter unconfigured in production.');
    throw new Error('Rate limiting unconfigured in production');
  }

  return checkMemoryRateLimit(identifier, MAX_ACCOUNT_ACTION_ATTEMPTS, now);
}
