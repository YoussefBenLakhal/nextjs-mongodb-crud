import { NextResponse } from "next/server"
import { connectToDatabase } from "../../../lib/mongodb"
import { ObjectId } from "mongodb"
import { getSession } from "../../../../lib/server-auth"

// Create multiple student assessments in bulk
export async function POST(request) {
  try {
    console.log("[API] POST /api/student-assessments/bulk - Creating assessments in bulk")

    // Get user from session or request headers
    let user = null

    // First try to get user from request headers (set by middleware)
    let userId = request.headers.get("x-user-id")
    const userRole = request.headers.get("x-user-role")
    const userEmail = request.headers.get("x-user-email")

    if (userId && userRole) {
      user = {
        id: userId,
        role: userRole,
        email: userEmail || "unknown",
      }
    } else {
      // Fallback to session-based auth
      user = await getSession()
    }

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    userId = user.id

    if (user.role !== "teacher" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Only teachers and admins can create assessments" },
        { status: 401 },
      )
    }

    const body = await request.json()
    const { subjectId, title, maxScore, weight, date, assessments } = body

    if (!subjectId || !title || maxScore === undefined || !assessments || !Array.isArray(assessments)) {
      return NextResponse.json(
        { error: "Subject ID, title, max score, and assessments array are required" },
        { status: 400 },
      )
    }

    if (assessments.length === 0) {
      return NextResponse.json({ error: "Assessments array cannot be empty" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Validate subjectId
    let subjectObjectId
    try {
      subjectObjectId = new ObjectId(subjectId)
    } catch (error) {
      return NextResponse.json({ error: "Invalid subject ID format" }, { status: 400 })
    }

    // Check if subject exists
    const subject = await db.collection("subjects").findOne({ _id: subjectObjectId })
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    // If user is a teacher, verify they teach this subject
    if (user.role === "teacher" && subject.teacherId.toString() !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - You can only create assessments for subjects you teach" },
        { status: 401 },
      )
    }

    // Process each assessment
    const results = {
      success: [],
      failed: [],
    }

    for (const assessment of assessments) {
      try {
        const { studentId, score, comment } = assessment

        if (!studentId || score === undefined) {
          throw new Error("Student ID and score are required for each assessment")
        }

        // Validate studentId
        let studentObjectId
        try {
          studentObjectId = new ObjectId(studentId)
        } catch (error) {
          throw new Error(`Invalid student ID format: ${studentId}`)
        }

        // Check if student exists
        const student = await db.collection("students").findOne({ _id: studentObjectId })
        if (!student) {
          throw new Error(`Student not found: ${studentId}`)
        }

        // Create assessment
        const assessmentDoc = {
          studentId: studentObjectId,
          subjectId: subjectObjectId,
          title,
          score: Number.parseFloat(score),
          maxScore: Number.parseFloat(maxScore),
          weight: weight ? Number.parseFloat(weight) : 1,
          date: date ? new Date(date) : new Date(),
          comment: comment || "",
          createdAt: new Date(),
          createdBy: new ObjectId(userId),
        }

        const result = await db.collection("student-assessments").insertOne(assessmentDoc)

        results.success.push({
          studentId,
          assessmentId: result.insertedId.toString(),
        })
      } catch (error) {
        console.error(`[API] Error creating assessment for student ${assessment.studentId}:`, error)
        results.failed.push({
          studentId: assessment.studentId,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${results.success.length} assessments, failed ${results.failed.length}`,
      results,
    })
  } catch (error) {
    console.error("[API] Bulk student assessment POST error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
