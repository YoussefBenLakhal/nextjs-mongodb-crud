import { getDB } from '@/lib/mongodb';

export const User = {
  async findOne(query) {
    const db = await getDB();
    return db.collection('users').findOne(query);
  },
  
  async create(userData) {
    const db = await getDB();
    return db.collection('users').insertOne({
      ...userData,
      createdAt: new Date(),
      role: userData.role || 'student' // Default to student
    });
  }
};