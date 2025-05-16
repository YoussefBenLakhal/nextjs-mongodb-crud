// lib/auth-utils.js
import { getDB } from './mongodb';
import { hash, compare } from 'bcryptjs';

export async function authenticateUser(email, password) {
  try {
    const db = await getDB();
    console.log('[AUTH] Login attempt for:', email);

    // 1. Find user by email
    const user = await db.collection('users').findOne({ email });
    console.log('[AUTH] Found user:', user ? { ...user, password: '***' } : null);

    if (!user) {
      console.log('[AUTH] No user found for email:', email);
      throw new Error('Invalid credentials');
    }

    // 2. Verify password format
    if (!user.password?.startsWith('$2a$')) {
      console.error('[AUTH] Invalid password hash format:', user.password);
      throw new Error('Authentication system error');
    }

    // 3. Compare passwords
    console.log('[AUTH] Comparing passwords...');
    const isValid = await compare(password, user.password);
    console.log('[AUTH] Password match result:', isValid);

    if (!isValid) {
      console.log('[AUTH] Password mismatch for user:', email);
      throw new Error('Invalid credentials');
    }

    // 4. Return sanitized user data
    return {
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };

  } catch (error) {
    console.error('[AUTH] Authentication error:', error);
    throw new Error(error.message || 'Authentication failed');
  }
}

// Helper function for registration
export async function registerUser(email, password, role = 'student') {
  try {
    const db = await getDB();
    
    // 1. Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // 2. Check existing user
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // 3. Hash password
    console.log('[REG] Hashing password...');
    const hashedPassword = await hash(password, 12);
    console.log('[REG] Hashed password:', hashedPassword);

    // 4. Create user
    const result = await db.collection('users').insertOne({
      email,
      password: hashedPassword,
      role,
      createdAt: new Date()
    });

    console.log('[REG] User created with ID:', result.insertedId);
    
    return result.insertedId;

  } catch (error) {
    console.error('[REG] Registration error:', error);
    throw error;
  }
}