import { NextResponse } from 'next/server';
import { getSession } from '@/lib/server-auth';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ user: session });
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json({ error: 'Session error' }, { status: 500 });
  }
}