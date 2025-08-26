/**
 * CORS Configuration Utility
 * 
 * Handles Cross-Origin Resource Sharing (CORS) for API routes.
 * Configures allowed origins, methods, and headers.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

interface CorsConfig {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const defaultConfig: Required<CorsConfig> = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * CORS middleware for Next.js API routes
 * @param config - CORS configuration
 * @returns Middleware function
 */
export function withCors(config: CorsConfig = {}) {
  const corsConfig = { ...defaultConfig, ...config };
  
  return function corsMiddleware(
    req: NextApiRequest,
    res: NextApiResponse,
    next?: () => void
  ) {
    const origin = req.headers.origin;
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', getOriginHeader(origin, corsConfig.origin));
      res.setHeader('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
      res.setHeader('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
      res.setHeader('Access-Control-Allow-Credentials', corsConfig.credentials.toString());
      res.setHeader('Access-Control-Max-Age', corsConfig.maxAge.toString());
      res.status(200).end();
      return;
    }
    
    // Set CORS headers for actual requests
    res.setHeader('Access-Control-Allow-Origin', getOriginHeader(origin, corsConfig.origin));
    res.setHeader('Access-Control-Allow-Credentials', corsConfig.credentials.toString());
    
    if (next) {
      next();
    }
  };
}

/**
 * Determines the appropriate Access-Control-Allow-Origin header value
 * @param requestOrigin - The origin from the request
 * @param allowedOrigins - The allowed origins from config
 * @returns The appropriate origin header value
 */
function getOriginHeader(requestOrigin: string | undefined, allowedOrigins: string | string[] | boolean): string {
  if (allowedOrigins === true) {
    return requestOrigin || '*';
  }
  
  if (allowedOrigins === false) {
    return '';
  }
  
  if (typeof allowedOrigins === 'string') {
    return allowedOrigins;
  }
  
  if (Array.isArray(allowedOrigins)) {
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      return requestOrigin;
    }
    return allowedOrigins[0] || '';
  }
  
  return '';
}

/**
 * Wrapper function to apply CORS to an API handler
 * @param handler - The API route handler
 * @param config - CORS configuration
 * @returns Wrapped handler with CORS support
 */
export function corsHandler(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  config?: CorsConfig
) {
  const corsMiddleware = withCors(config);
  
  return async (req: NextApiRequest, res: NextApiResponse) => {
    corsMiddleware(req, res, () => {
      return handler(req, res);
    });
  };
}

/**
 * Predefined CORS configurations for different use cases
 */
export const CORS_CONFIGS = {
  // Public API - allows all origins
  PUBLIC: {
    origin: true,
    credentials: false,
  },
  
  // Private API - only allows specific origins
  PRIVATE: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
    credentials: true,
  },
  
  // Development - allows localhost
  DEVELOPMENT: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  
  // Webhook - minimal CORS for webhook endpoints
  WEBHOOK: {
    origin: false,
    credentials: false,
  },
} as const;
