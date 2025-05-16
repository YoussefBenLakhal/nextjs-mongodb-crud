import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth-utils';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Create user in database
    const userId = await registerUser(email, password);
    
    return NextResponse.json(
      { 
        success: true,
        userId,
        message: "Registration successful" 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('already exists') ? 409 : 500 }
    );
  }
}