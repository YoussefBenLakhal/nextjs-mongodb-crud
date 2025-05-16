import { cookies } from 'next/headers';
import { getDB } from './mongodb';
import { ObjectId } from 'mongodb';

export async function getSession() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie?.value) return null;

    const sessionData = JSON.parse(sessionCookie.value);
    
    if (!ObjectId.isValid(sessionData.id)) return null;

    const db = await getDB();
    const user = await db.collection('users').findOne({
      _id: new ObjectId(sessionData.id),
      email: sessionData.email
    });

    return user ? {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    } : null;
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
}