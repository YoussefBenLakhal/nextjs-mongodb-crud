import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/server-auth';

export async function GET(request) {
  try {
    console.log('Grades API - GET request received');
    
    // Verify authentication
    const auth = await verifyAuth();
    
    console.log('Grades API - Auth result:', auth);
    
    if (!auth.success) {
      console.log('Grades API - Authentication failed:', auth.error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { db } = await connectToDB();
    const { user } = auth;
    
    console.log('Grades API - User role:', user.role);
    
    let grades = [];
    
    // If teacher, get all grades
    if (user.role.toLowerCase() === 'teacher') {
      console.log('Grades API - Teacher fetching all grades');
      grades = await db.collection('grades')
        .aggregate([
          {
            $lookup: {
              from: 'users',
              localField: 'studentId',
              foreignField: '_id',
              as: 'student'
            }
          },
          {
            $unwind: {
              path: '$student',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $project: {
              _id: 1,
              subject: 1,
              score: 1,
              date: 1,
              studentId: 1,
              'student.name': 1,
              'student.email': 1
            }
          }
        ])
        .toArray();
    } 
    // If student, get only their grades
    else if (user.role.toLowerCase() === 'student') {
      console.log('Grades API - Student fetching their grades, ID:', user.id);
      
      // Convert string ID to ObjectId
      let studentId;
      try {
        studentId = new ObjectId(user.id);
      } catch (error) {
        console.error('Grades API - Invalid ObjectId:', error);
        return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
      }
      
      grades = await db.collection('grades')
        .find({ studentId })
        .toArray();
        
      console.log(`Grades API - Found ${grades.length} grades for student`);
    }
    
    // Convert ObjectId to string for each grade
    grades = grades.map(grade => ({
      ...grade,
      _id: grade._id.toString(),
      studentId: grade.studentId.toString()
    }));
    
    return NextResponse.json(grades);
  } catch (error) {
    console.error('Grades API - Error fetching grades:', error);
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
  }
}