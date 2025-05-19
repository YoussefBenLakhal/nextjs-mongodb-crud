import { NextResponse } from "next/server"
import { connectToDatabase } from "../../lib/mongodb"
import { ObjectId } from "mongodb"
import { getSession } from "../../../lib/server-auth"

export async function GET(request) {
  try {
    console.log("[API] GET /api/student-attendance - Fetching attendance")

    // Get user from session
    const user = await getSession()

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 })
    }

    const userId = user.id
    const userRole = user.role

    if (userRole !== "student") {
      return NextResponse.json({ error: "Unauthorized - Only students can access their attendance" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get all attendance records for this student
    const attendance = await db
      .collection("attendance")
      .find({ studentId: new ObjectId(userId) })
      .sort({ date: -1 })
      .toArray()

    // Convert ObjectIds to strings for JSON serialization
    const serializedAttendance = attendance.map((record) => ({
      ...record,
      _id: record._id.toString(),
      studentId: record.studentId.toString(),
      subjectId: record.subjectId.toString(),
      ...(record.createdBy && { createdBy: record.createdBy.toString() }),
    }))

    return NextResponse.json({ attendance: serializedAttendance })
  } catch (error) {
    console.error("[API] Attendance GET error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
