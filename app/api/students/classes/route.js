import { NextResponse } from "next/server"
import { connectToDatabase } from "../../../lib/mongodb"
import { ObjectId } from "mongodb"
import { getSession } from "../../../../lib/server-auth.js"

export async function GET(request) {
  try {
    console.log("[API] GET /api/student/classes - Fetching classes")

    // Get user from session
    const user = await getSession()

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 })
    }

    const userId = user.id
    const userRole = user.role

    if (userRole !== "student") {
      return NextResponse.json({ error: "Unauthorized - Only students can access their classes" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get student document to find their classId
    const student = await db.collection("students").findOne({ _id: new ObjectId(userId) })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Get the class the student is enrolled in
    const studentClass = await db.collection("classes").findOne({ _id: new ObjectId(student.classId) })

    if (!studentClass) {
      return NextResponse.json({ classes: [] })
    }

    // Convert ObjectIds to strings for JSON serialization
    const serializedClass = {
      ...studentClass,
      _id: studentClass._id.toString(),
      ...(studentClass.teacherId && { teacherId: studentClass.teacherId.toString() }),
      ...(studentClass.createdBy && { createdBy: studentClass.createdBy.toString() }),
    }

    return NextResponse.json({ classes: [serializedClass] })
  } catch (error) {
    console.error("[API] Classes GET error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
