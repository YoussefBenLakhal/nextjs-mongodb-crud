import { NextResponse } from "next/server"
import { connectToDatabase } from "../../../lib/mongodb"
import { ObjectId } from "mongodb"
import { getSession } from "../../../lib/server-auth"

export async function POST(request) {
  try {
    console.log("[API] POST /api/seed-attendance - Creating sample attendance records")

    // Get user from session
    const user = await getSession()

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 })
    }

    // Only teachers and admins can seed attendance
    if (user.role !== "teacher" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Only teachers and admins can seed attendance" },
        { status: 401 },
      )
    }

    const { db } = await connectToDatabase()

    // Get all students
    const students = await db.collection("users").find({ role: "student" }).toArray()

    if (students.length === 0) {
      return NextResponse.json({ error: "No students found to create attendance for" }, { status: 400 })
    }

    console.log(`[API] Found ${students.length} students`)

    // Get all subjects
    const subjects = await db.collection("subjects").find({}).toArray()

    if (subjects.length === 0) {
      return NextResponse.json({ error: "No subjects found to create attendance for" }, { status: 400 })
    }

    console.log(`[API] Found ${subjects.length} subjects`)

    // Create sample attendance records
    const attendanceRecords = []
    const statuses = ["present", "absent", "late"]

    // Create records for the past 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)

      // Skip weekends
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) continue

      // For each subject
      for (const subject of subjects) {
        // For each student
        for (const student of students) {
          // Random status
          const status = statuses[Math.floor(Math.random() * statuses.length)]

          attendanceRecords.push({
            studentId: student._id,
            subjectId: subject._id,
            date: date,
            status: status,
            notes: `Auto-generated attendance record for ${status}`,
            createdAt: new Date(),
            createdBy: user.id ? new ObjectId(user.id) : null,
          })
        }
      }
    }

    console.log(`[API] Created ${attendanceRecords.length} sample attendance records`)

    // Insert attendance records
    const result = await db.collection("attendance").insertMany(attendanceRecords)

    console.log(`[API] Inserted ${result.insertedCount} attendance records`)

    return NextResponse.json({
      success: true,
      message: `Created ${result.insertedCount} sample attendance records`,
      insertedCount: result.insertedCount,
    })
  } catch (error) {
    console.error("[API] Seed attendance error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
