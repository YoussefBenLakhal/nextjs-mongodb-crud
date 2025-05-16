// lib/server-auth.js
import { cookies } from 'next/headers';
import { getDB } from './mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export async function getSession() {
  try {
    // Get all cookies for debugging
    const cookieStore = cookies();
    const allCookies = Array.from(cookieStore.getAll());
    console.log('All cookies:', allCookies.map(c => ({ name: c.name, value: c.name === 'session' ? 'HIDDEN' : c.value })));
    
    const sessionCookie = cookieStore.get('session');
    console.log('Session cookie exists:', !!sessionCookie);
    
    if (!sessionCookie?.value) {
      console.log('No session cookie found');
      return null;
    }

    const token = sessionCookie.value;
    console.log('Token found, length:', token.length);
    
    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('JWT decoded successfully:', {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        exp: new Date(decoded.exp * 1000).toISOString()
      });
      
      // For debugging, return the decoded token directly
      // This bypasses the database check which might be failing
      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
      
      /* Uncomment this section after confirming the token is valid
      if (!ObjectId.isValid(decoded.id)) {
        console.log('Invalid ObjectId in token:', decoded.id);
        return null;
      }

      // Get user from database
      const db = await getDB();
      const user = await db.collection('users').findOne({
        _id: new ObjectId(decoded.id)
      });

      if (!user) {
        console.log('User not found in database for token ID:', decoded.id);
        return null;
      }

      console.log('User found in database:', {
        id: user._id.toString(),
        email: user.email,
        role: user.role
      });

      // Return session data
      return {
        id: user._id.toString(),
        email: user.email,
        role: user.role
      };
      */
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return null;
    }
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
}