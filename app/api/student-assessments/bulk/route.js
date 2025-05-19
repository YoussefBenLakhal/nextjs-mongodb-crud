import { NextResponse } from "next/server"
import { connectToDatabase } from "../../../../lib/mongodb"
import { ObjectId } from "mongodb"
import { getSession } from "../../../../lib/server-auth"

// Bulk create student assessments
export async function POST(request) {
  try {
    console.log("[API] POST /api/student-assessments/bulk - Creating multiple assessments")

    // Get user from session
    const user = await getSession()

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 })
    }

    const userId = user.id
    const userRole = user.role

    if (userRole !== "teacher" && userRole !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Only teachers and admins can create assessments" },
        { status: 401 },
      )
    }

    const body = await request.json()
    const { subjectId, title, maxScore, weight, date, assessments } = body

    if (!subjectId || !title || maxScore === undefined || !Array.isArray(assessments) || assessments.length === 0) {
      return NextResponse.json(
        { error: "Subject ID, title, max score, and assessments array are required" },
        { status: 400 },
      )
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
    if (userRole === "teacher" && subject.teacherId.toString() !== userId) {
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
          results.failed.push({
            studentId,
            error: "Student ID and score are required",
          })
          continue
        }

        // Validate studentId
        let studentObjectId
        try {
          studentObjectId = new ObjectId(studentId)
        } catch (error) {
          results.failed.push({
            studentId,
            error: "Invalid student ID format",
          })
          continue
        }

        // Check if student exists
        const student = await db.collection("students").findOne({ _id: studentObjectId })
        if (!student) {
          results.failed.push({
            studentId,
            error: "Student not found",
          })
          continue
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
        console.error("[API] Bulk assessment creation error for student:", assessment.studentId, error)
        results.failed.push({
          studentId: assessment.studentId,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${results.success.length} assessments successfully. Failed: ${results.failed.length}`,
      results,
    })
  } catch (error) {
    console.error("[API] Bulk assessments POST error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
