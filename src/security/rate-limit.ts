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

// Lazy initialization of Upstash rate limiter
let upstashRatelimit: Ratelimit | null = null;
let isUpstashInitialized = false;

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
      upstashRatelimit = null;
      return null;
    }
  }

  isUpstashInitialized = true;
  upstashRatelimit = null;
  return null;
}

/**
 * In-memory sliding window rate limiter fallback.
 * Ensures security is never disabled even if Redis is temporarily offline or unconfigured.
 */
function checkMemoryRateLimit(identifier: string, now: number = Date.now()): RateLimitResult {
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

  if (entry.timestamps.length >= MAX_ATTEMPTS) {
    const oldest = entry.timestamps[0];
    const reset = oldest + WINDOW_MS;
    return {
      success: false,
      limit: MAX_ATTEMPTS,
      remaining: 0,
      reset,
    };
  }

  entry.timestamps.push(now);
  const remaining = Math.max(0, MAX_ATTEMPTS - entry.timestamps.length);
  const reset = entry.timestamps[0] + WINDOW_MS;

  return {
    success: true,
    limit: MAX_ATTEMPTS,
    remaining,
    reset,
  };
}

export function resetMemoryRateLimit(identifier: string): void {
  memoryStore.delete(identifier);
}

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();
  return '127.0.0.1';
}

/**
 * Validates login rate limit using Upstash Redis sliding-window with resilient local fallback.
 * Keyed by combining normalized email and client IP to prevent targeted brute force and credential stuffing.
 */
export async function checkLoginRateLimit(request: NextRequest, email: string): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  const normalizedEmail = email.toLowerCase().trim();
  const identifier = `login:${normalizedEmail}:${ip}`;
  const now = Date.now();

  const limiter = getUpstashLimiter();
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
      console.warn('[RateLimiter] Upstash Redis request failed. Gracefully falling back to local rate limiting:', err);
      return checkMemoryRateLimit(identifier, now);
    }
  }

  return checkMemoryRateLimit(identifier, now);
}
