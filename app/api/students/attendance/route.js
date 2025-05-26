import { NextResponse } from "next/server"
import { connectToDatabase } from "../../../../lib/mongodb"
import { ObjectId } from "mongodb"
import { getSession } from "../../../../lib/server-auth"

export async function GET(request) {
  try {
    console.log("[API] GET /api/student/attendance - Fetching student attendance")

    // Get user from session
    const user = await getSession()

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 })
    }

    const userId = user.id
    const userRole = user.role

    console.log("[API] User role:", userRole)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const subjectId = searchParams.get("subjectId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    console.log("[API] Query params:", { studentId, subjectId, startDate, endDate })

    const { db } = await connectToDatabase()

    // Build query
    const query = {}

    // If specific student ID is provided and user is teacher/admin, use it
    if (studentId && (userRole === "teacher" || userRole === "admin")) {
      try {
        query.studentId = new ObjectId(studentId)
      } catch (error) {
        return NextResponse.json({ error: "Invalid student ID format" }, { status: 400 })
      }
    } else {
      // If user is a student, only show their own attendance
      // If user is teacher/admin without specific student, show all attendance
      if (userRole === "student") {
        query.studentId = new ObjectId(userId)
      }
    }

    // Filter by subject if provided
    if (subjectId) {
      try {
        query.subjectId = new ObjectId(subjectId)
      } catch (error) {
        return NextResponse.json({ error: "Invalid subject ID format" }, { status: 400 })
      }
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      query.date = {}
      if (startDate) {
        query.date.$gte = new Date(startDate)
      }
      if (endDate) {
        query.date.$lte = new Date(endDate)
      }
    }

    console.log("[API] Final query:", JSON.stringify(query))

    // Get attendance records
    const attendance = await db.collection("attendance").find(query).sort({ date: -1 }).toArray()

    console.log(`[API] Found ${attendance.length} attendance records`)

    // Convert ObjectIds to strings for JSON serialization
    const serializedAttendance = attendance.map((record) => ({
      ...record,
      _id: record._id.toString(),
      studentId: record.studentId.toString(),
      subjectId: record.subjectId.toString(),
      ...(record.classId && { classId: record.classId.toString() }),
      ...(record.createdBy && { createdBy: record.createdBy.toString() }),
    }))

    return NextResponse.json({ attendance: serializedAttendance })
  } catch (error) {
    console.error("[API] Student attendance GET error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
