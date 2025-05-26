import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { getSession } from "../../../lib/server-auth";

export async function GET() {
  try {
    console.log("[API] GET /api/student/grades - Fetching grades");

    // Get user from session
    const user = await getSession();

    if (!user) {
      console.log("[API] No user in session");
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 });
    }

    const userId = user.id;
    const userRole = user.role;

    if (userRole !== "student") {
      return NextResponse.json({ error: "Unauthorized - Only students can access their grades" }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    // Get all grades for this student
    const grades = await db
      .collection("grades")
      .find({ studentId: new ObjectId(userId) })
      .sort({ date: -1 })
      .toArray();

    // Convert ObjectIds to strings for JSON serialization
    const serializedGrades = grades.map((grade) => ({
      ...grade,
      _id: grade._id.toString(),
      studentId: grade.studentId.toString(),
      subjectId: grade.subjectId.toString(),
      ...(grade.createdBy && { createdBy: grade.createdBy.toString() }),
    }));

    return NextResponse.json({ grades: serializedGrades });
  } catch (error) {
    console.error("[API] Grades GET error:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
