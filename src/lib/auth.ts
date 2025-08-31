import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';

export interface AdminToken {
  role: string;
  timestamp: number;
}

/**
 * Verify admin token from request headers
 */
export function verifyAdminToken(req: NextApiRequest): AdminToken | null {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || ''
    ) as AdminToken;

    // Check if token is expired (24 hours)
    const tokenAge = Date.now() - decoded.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (tokenAge > maxAge) {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Middleware to protect admin API routes
 */
export function withAdminAuth(handler: Function) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const token = verifyAdminToken(req);
    
    if (!token || token.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return handler(req, res);
  };
}

/**
 * Get admin token from localStorage (client-side)
 */
export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken');
}

/**
 * Remove admin token (logout)
 */
export function removeAdminToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('adminToken');
  // Also remove the cookie
  document.cookie = 'adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
}
