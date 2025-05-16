import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId || !ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { error: "Valid student ID required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDB();
    
    const absences = await db.collection('absences')
      .find({ studentId: new ObjectId(studentId) })
      .sort({ date: -1 })
      .toArray();

    const transformed = absences.map(a => ({
      ...a,
      _id: a._id.toString(),
      studentId: a.studentId.toString(),
      date: a.date.toISOString()
    }));

    return NextResponse.json(transformed);

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch absences", details: error.message },
      { status: 500 }
    );
  }
}