import { cookies } from 'next/headers';
export async function GET(request) {
  try {
    // 1. Get cookies ASYNCHRONOUSLY
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session');
    
    // 2. Debug logging
    console.log('All cookies:', Array.from(cookieStore));
    console.log('Session cookie:', sessionCookie?.value);
    // 3. Verify session exists
    if (!sessionCookie?.value) {
      return Response.json(
        { valid: false, error: "No session cookie found" },
        { status: 401 }
      );
    }

    // 4. Extract token
    const token = sessionCookie.value.replace('Bearer ', '');
    return Response.json({ valid: true, token });

  } catch (error) {
    console.error('Cookie error:', error);
    return Response.json(
      { valid: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}