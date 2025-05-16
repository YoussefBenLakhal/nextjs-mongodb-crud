// app/api/auth/login/route.js
import { User } from '@/models/User';
import { compare } from 'bcryptjs';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const cookieStore = cookies();

    // Normalize email input
    const normalizedEmail = email.toLowerCase().trim();
    console.log('[LOGIN] Attempt for:', normalizedEmail);

    // Basic validation
    if (!normalizedEmail || !password) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      console.log('[LOGIN] User not found:', normalizedEmail);
      return Response.json(
        { error: 'Invalid credentials' }, 
        { status: 401 }
      );
    }

    // Verify password hash format
    if (!/^\$2[aby]\$/.test(user.password)) {
      console.error('[LOGIN] Invalid password hash format');
      return Response.json(
        { error: 'Authentication system error' },
        { status: 500 }
      );
    }

    // Compare passwords
    console.log('[LOGIN] Comparing passwords...');
    const isValid = await compare(password, user.password);
    console.log('[LOGIN] Password match:', isValid);

    if (!isValid) {
      return Response.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create session data
    const sessionData = {
      id: user._id.toString(),
      email: normalizedEmail,
      role: user.role
    };

    // Set secure cookie
    cookieStore.set('session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return Response.json({ 
      success: true,
      role: user.role,
      email: normalizedEmail
    });

  } catch (error) {
    console.error('[LOGIN] Server error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}