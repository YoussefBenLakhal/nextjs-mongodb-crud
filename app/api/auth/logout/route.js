import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Get base URL from request headers
    const host = request.headers.get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http://' : 'https://';
    const baseUrl = `${protocol}${host}`;

    // Create response with cookie invalidation
    const response = NextResponse.redirect(new URL('/', baseUrl), {
      status: 302,
    });

    // Clear session cookie
    response.cookies.set('session', '', {
      path: '/',
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}