import { NextResponse } from 'next/server';
import { getSession } from '../../../lib/server-auth';

export async function GET(request) {
  try {
    // Log all headers for debugging
    const headers = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('Request headers:', headers);
    
    // Get session
    const session = await getSession();
    console.log('Session data:', session);
    
    if (!session) {
      return NextResponse.json(
        { error: "No session found" },
        { status: 401 }
      );
    }
    
    // Return session data
    return NextResponse.json({
      message: "Session valid",
      session: {
        id: session.id,
        email: session.email,
        role: session.role
      }
    });
  } catch (error) {
    console.error('Test session error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';