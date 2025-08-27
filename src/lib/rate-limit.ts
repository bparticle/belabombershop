/**
 * Rate Limiting Utility
 * 
 * Simple in-memory rate limiting for API endpoints.
 * In production, consider using Redis or a dedicated rate limiting service.
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (not suitable for production with multiple instances)
const store: RateLimitStore = {};

/**
 * Creates a rate limiting function
 * @param config - Rate limiting configuration
 * @returns Function that checks if request is within rate limit
 */
export function createRateLimiter(config: RateLimitConfig) {
  return function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = `rate_limit:${identifier}`;
    
    if (!store[key] || now > store[key].resetTime) {
      // Reset or create new entry
      store[key] = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: store[key].resetTime,
      };
    }
    
    if (store[key].count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: store[key].resetTime,
      };
    }
    
    store[key].count++;
    return {
      allowed: true,
      remaining: config.maxRequests - store[key].count,
      resetTime: store[key].resetTime,
    };
  };
}

/**
 * Rate limiting middleware for Next.js API routes
 * @param config - Rate limiting configuration
 * @returns Middleware function
 */
export function withRateLimit(config: RateLimitConfig) {
  return function rateLimitMiddleware(req: any, res: any, next: () => void) {
    // Get client identifier (IP address or user ID)
    const identifier = req.headers['x-forwarded-for'] || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress || 
                      'unknown';
    
    const rateLimiter = createRateLimiter(config);
    const result = rateLimiter(identifier);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
    
    if (!result.allowed) {
      res.setHeader('Retry-After', Math.ceil(config.windowMs / 1000));
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(config.windowMs / 1000),
      });
    }
    
    next();
  };
}

/**
 * Default rate limiting configurations
 */
export const RATE_LIMITS = {
  // General API endpoints
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
  // Authentication endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  // Webhook endpoints
  WEBHOOK: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
  // Search endpoints
  SEARCH: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
} as const;

/**
 * Clean up expired rate limit entries
 * This should be called periodically in production
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}

// Clean up expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}
