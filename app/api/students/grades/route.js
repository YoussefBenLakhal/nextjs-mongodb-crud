import { NextResponse } from "next/server"
import { connectToDatabase } from "../../../lib/mongodb"
import { ObjectId } from "mongodb"
import { getSession } from "../../../../lib/server-auth"

export async function GET(request) {
  try {
    console.log("[API] GET /api/student/grades - Fetching grades from student-assessments")

    // Get user from session
    const user = await getSession()

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 })
    }

    const userId = user.id
    const userRole = user.role
    const userEmail = user.email

    if (userRole !== "student") {
      return NextResponse.json({ error: "Unauthorized - Only students can access their grades" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    console.log(`[API] Fetching grades for student ID: ${userId}`)
    console.log(`[API] Student email: ${userEmail}`)

    // CRITICAL FIX: First, find the actual student record for this user
    let studentId = userId
    let studentRecord = null

    try {
      // Try to find student by userId
      studentRecord = await db.collection("students").findOne({
        userId: new ObjectId(userId),
      })

      if (studentRecord) {
        studentId = studentRecord._id.toString()
        console.log(`[API] Found student record by userId: ${studentId}`)
      } else if (userEmail) {
        // Try to find student by email
        studentRecord = await db.collection("students").findOne({
          email: userEmail,
        })

        if (studentRecord) {
          studentId = studentRecord._id.toString()
          console.log(`[API] Found student record by email: ${studentId}`)
        }
      }

      // If we still don't have a student record, try to find by direct ID match
      if (!studentRecord) {
        try {
          studentRecord = await db.collection("students").findOne({
            _id: new ObjectId(userId),
          })

          if (studentRecord) {
            console.log(`[API] Found student record by direct ID match: ${userId}`)
          }
        } catch (error) {
          console.log(`[API] Error finding student by direct ID: ${error.message}`)
        }
      }

      console.log(`[API] Final student ID to use: ${studentId}`)
      console.log(
        `[API] Student record:`,
        studentRecord
          ? {
              _id: studentRecord._id.toString(),
              name: studentRecord.name,
              email: studentRecord.email,
              userId: studentRecord.userId ? studentRecord.userId.toString() : null,
            }
          : "Not found",
      )
    } catch (error) {
      console.error(`[API] Error finding student record: ${error.message}`)
    }

    // Get all grades for this student from student-assessments collection ONLY
    const grades = await db
      .collection("student-assessments")
      .find({
        studentId: new ObjectId(studentId),
      })
      .sort({ date: -1 })
      .toArray()

    console.log(`[API] Found ${grades.length} grades for student ${studentId} in student-assessments collection`)

    // Log the first grade for debugging
    if (grades.length > 0) {
      console.log(
        `[API] First grade sample: ${JSON.stringify({
          _id: grades[0]._id,
          title: grades[0].title,
          score: grades[0].score,
          maxScore: grades[0].maxScore,
          date: grades[0].date,
          studentId: grades[0].studentId,
          subjectId: grades[0].subjectId,
        })}`,
      )
    }

    // Convert ObjectIds to strings for JSON serialization
    const serializedGrades = grades.map((grade) => ({
      ...grade,
      _id: grade._id.toString(),
      studentId: grade.studentId.toString(),
      subjectId: grade.subjectId.toString(),
      ...(grade.createdBy && { createdBy: grade.createdBy.toString() }),
    }))

    return NextResponse.json({
      grades: serializedGrades,
      source: "student-assessments",
      count: serializedGrades.length,
      studentId: studentId,
      userInfo: {
        id: userId,
        role: userRole,
        email: userEmail,
      },
    })
  } catch (error) {
    console.error("[API] Grades GET error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
