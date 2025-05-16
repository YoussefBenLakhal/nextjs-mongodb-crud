import { connectToDB } from '@/lib/mongodb';

export const User = {
  async findOne(query) {
    const { db } = await connectToDB();
    return db.collection('users').findOne(query);
  },

  async create(userData) {
    const { db } = await connectToDB();
    return db.collection('users').insertOne({
      ...userData,
      createdAt: new Date(),
      role: userData.role || 'student'
    });
  }
};