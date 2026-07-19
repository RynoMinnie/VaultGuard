import { NextResponse } from 'next/server';

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Check if a request from the given IP is within the rate limit.
 * Automatically cleans up entries older than windowMs on each check.
 */
export function rateLimit(
  ip: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();

  // Auto-cleanup: remove entries older than the window
  for (const [key, entry] of rateLimitMap) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) {
      rateLimitMap.delete(key);
    }
  }

  const key = ip;
  const entry = rateLimitMap.get(key);

  if (!entry || entry.timestamps.length === 0) {
    rateLimitMap.set(key, { timestamps: [now] });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.timestamps.length >= limit) {
    // Calculate retry-after from the oldest timestamp in the window
    const oldest = entry.timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, retryAfter: Math.max(1, retryAfter) };
  }

  entry.timestamps.push(now);
  return { allowed: true, retryAfter: 0 };
}

/**
 * Set security headers on a NextResponse to prevent caching and MIME sniffing.
 */
export function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return 'unknown';
}