import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Add debugging
  console.log('Middleware processing path:', pathname);
  
  const publicPaths = [
    '/login',
    '/register',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/session',
    '/api/test-session',
    '/unauthorized' // Add this to prevent redirect loops
  ];

  if (publicPaths.some(path => pathname.startsWith(path))) {
    console.log('Public path, skipping auth check');
    return NextResponse.next();
  }

  try {
    // For API routes, check Authorization header or cookies
    if (pathname.startsWith('/api')) {
      console.log('API route detected');
      
      // Get cookies from request
      const cookieHeader = request.headers.get('cookie');
      if (!cookieHeader) {
        console.log('No cookies found in request');
        throw new Error('No cookies found');
      }
      
      // Parse cookies manually
      const cookies = parseCookies(cookieHeader);
      const token = cookies.session;
      
      if (!token) {
        console.log('No session cookie found');
        throw new Error('Missing session cookie');
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified for user:', decoded.email);
      
      // Add user info to headers
      const headers = new Headers(request.headers);
      headers.set('x-user-id', decoded.id);
      headers.set('x-user-role', decoded.role);
      
      return NextResponse.next({
        request: { headers }
      });
    }
    
    // For page routes
    return NextResponse.next();

  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    // Don't redirect API routes, just return 401
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Unauthorized', details: error.message },
        { status: 401 }
      );
    }
    
    // Only redirect to /unauthorized if not already there
    if (!pathname.startsWith('/unauthorized')) {
      const url = new URL('/unauthorized', request.url);
      url.searchParams.set('reason', error.message);
      return NextResponse.redirect(url);
    }
    
    return NextResponse.next();
  }
}

// Helper function to parse cookies
function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts.shift().trim();
    const value = decodeURIComponent(parts.join('='));
    list[name] = value;
  });
  
  return list;
}

// Specify which paths this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};