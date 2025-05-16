import { User } from '@/models/User';
import { hash } from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password, role } = await request.json();
    
    // Validate required fields
    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (role && !['student', 'teacher'].includes(role)) {
      return Response.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return Response.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password and create user
    
    const hashedPassword = await hash(password, 12);
    if (!hashedPassword.startsWith('$2a$') && !hashedPassword.startsWith('$2b$')) {
      console.error('Invalid hash generated:', hashedPassword);
      throw new Error('Password hashing failed');
    }
    const result = await User.create({
      email,
      password: hashedPassword,
      role: role || 'student', // Default to student if not specified
      createdAt: new Date(),
    });

    return Response.json({ 
      success: true,
      userId: result.insertedId,
      role: role || 'student'
    });

  } catch (error) {
    console.error('Registration error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}