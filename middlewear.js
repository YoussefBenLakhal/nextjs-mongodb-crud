import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  const publicPaths = ['/api/auth/login', '/api/auth/register'];

  if (publicPaths.includes(path)) return NextResponse.next();

  if (path.startsWith('/api/auth/protected') || path.startsWith('/api/auth/test-token')) {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - No token provided' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
      console.log('Decoded Token:', decoded); // Add this line
      
      if (!decoded.id) {
        console.error('JWT payload missing ID:', decoded);
        return new NextResponse(
          JSON.stringify({ error: 'Invalid token structure' }),
          { status: 401 }
        );
      }
    
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decoded.id.toLowerCase());
      
      console.log('Setting headers:', { 
        'x-user-id': decoded.id,
        originalHeaders: Object.fromEntries(request.headers.entries())
      })}
      catch (error) {
      console.error('JWT Error:', error.message);
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return NextResponse.next();
}