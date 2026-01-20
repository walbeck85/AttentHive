// src/lib/rate-limit.ts
// Rate limiting utility using Upstash Redis
//
// This module provides rate limiters for protecting sensitive endpoints
// from brute force attacks, credential stuffing, and general API abuse.

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { NextResponse } from 'next/server';

// Initialize Redis client - will be null if env vars are missing
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Rate limit result type
export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

// Check if rate limiting should be skipped (test environment or missing config)
function shouldSkipRateLimit(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.SKIP_RATE_LIMIT === 'true' ||
    !redis
  );
}

// Auth limiter: 5 requests per 15 minutes
// Used for login attempts to prevent brute force attacks
export const authLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      prefix: 'ratelimit:auth',
    })
  : null;

// Signup limiter: 3 requests per hour
// Prevents mass account creation
export const signupLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      prefix: 'ratelimit:signup',
    })
  : null;

// Password reset limiter: 3 requests per hour
// Prevents email enumeration and spam
export const passwordResetLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      prefix: 'ratelimit:password-reset',
    })
  : null;

// API limiter: 100 requests per minute
// General protection for authenticated API endpoints
export const apiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      prefix: 'ratelimit:api',
    })
  : null;

/**
 * Check rate limit for a given limiter and identifier
 *
 * @param limiter - The rate limiter to use
 * @param identifier - The identifier to rate limit (e.g., IP address, email, user ID)
 * @returns Rate limit result with success status and metadata
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<RateLimitResult> {
  // Skip rate limiting in test environment or if limiter is not configured
  if (shouldSkipRateLimit() || !limiter) {
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    };
  }

  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Generate a 429 Too Many Requests response with appropriate headers
 *
 * @param result - The rate limit result from checkRateLimit
 * @returns NextResponse with 429 status and rate limit headers
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

  return NextResponse.json(
    {
      error: 'Too many requests. Please try again later.',
      retryAfter: retryAfter > 0 ? retryAfter : 60,
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': (retryAfter > 0 ? retryAfter : 60).toString(),
      },
    }
  );
}

/**
 * Get client IP address from request headers
 * Works with Vercel, Cloudflare, and standard proxies
 *
 * @param request - The incoming request
 * @returns The client IP address or 'unknown'
 */
export function getClientIp(request: Request): string {
  // Vercel uses x-forwarded-for
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs; the first one is the client
    return forwardedFor.split(',')[0].trim();
  }

  // Cloudflare uses cf-connecting-ip
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback for direct connections or other proxies
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}
