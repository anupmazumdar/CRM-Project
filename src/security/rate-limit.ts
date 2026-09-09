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
      upstashRatelimit = null;
      return null;
    }
  }

  isUpstashInitialized = true;
  upstashRatelimit = null;
  return null;
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
      upstashIpRatelimit = null;
      return null;
    }
  }

  isUpstashIpInitialized = true;
  upstashIpRatelimit = null;
  return null;
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
      upstashAccountActionRatelimit = null;
      return null;
    }
  }

  isUpstashAccountActionInitialized = true;
  upstashAccountActionRatelimit = null;
  return null;
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
 * Enforces two independent limits:
 * 1. login-ip:{ip} (20 attempts / 15m) to thwart email enumeration and credential stuffing.
 * 2. login:{email}:{ip} (5 attempts / 15m) to thwart single-target brute force.
 */
export async function checkLoginRateLimit(request: NextRequest, email: string): Promise<RateLimitResult> {
  const ip = getClientIp(request);
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
      ipResult = checkMemoryRateLimit(ipIdentifier, MAX_IP_ATTEMPTS, now);
    }
  } else {
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
      emailIpResult = checkMemoryRateLimit(emailIpIdentifier, MAX_ATTEMPTS, now);
    }
  } else {
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
      return checkMemoryRateLimit(identifier, MAX_ACCOUNT_ACTION_ATTEMPTS, now);
    }
  }

  return checkMemoryRateLimit(identifier, MAX_ACCOUNT_ACTION_ATTEMPTS, now);
}
