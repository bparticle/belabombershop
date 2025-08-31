import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only apply to admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Skip the login page itself
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Check for admin token in cookies or headers
    const token = request.cookies.get('adminToken')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      // Redirect to login if no token found
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // For API routes, we'll let the API handle token validation
    if (request.nextUrl.pathname.startsWith('/api/admin')) {
      return NextResponse.next();
    }

    // For page routes, we'll do basic validation
    try {
      // Basic JWT validation (you might want to do more thorough validation)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      const tokenAge = Date.now() - payload.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (tokenAge > maxAge) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
