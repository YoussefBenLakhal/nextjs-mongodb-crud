import { NextResponse } from "next/server"
import { connectToDatabase } from "../../../lib/mongodb"
import { ObjectId } from "mongodb"
import { getSession } from "../../../lib/server-auth"

// Get all student assessments (with filtering options)
export async function GET(request) {
  try {
    console.log("[API] GET /api/student-assessments - Fetching assessments")

    // Get user from session
    const user = await getSession()

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 })
    }

    const userId = user.id
    const userRole = user.role

    const { db } = await connectToDatabase()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const subjectId = searchParams.get("subjectId")
    const classId = searchParams.get("classId")

    // Build query
    const query = {}

    if (studentId) {
      try {
        query.studentId = new ObjectId(studentId)
      } catch (error) {
        return NextResponse.json({ error: "Invalid student ID format" }, { status: 400 })
      }
    }

    if (subjectId) {
      try {
        query.subjectId = new ObjectId(subjectId)
      } catch (error) {
        return NextResponse.json({ error: "Invalid subject ID format" }, { status: 400 })
      }
    }

    // If user is a teacher, only show assessments for their subjects
    if (userRole === "teacher") {
      // Get subjects taught by this teacher
      const subjects = await db
        .collection("subjects")
        .find({ teacherId: new ObjectId(userId) })
        .toArray()
      const subjectIds = subjects.map((subject) => subject._id)

      if (subjectIds.length === 0) {
        return NextResponse.json({ assessments: [] })
      }

      query.subjectId = { $in: subjectIds }
    }

    // If classId is provided, filter by students in that class
    if (classId) {
      try {
        const classObjectId = new ObjectId(classId)

        // Get all students in this class
        const students = await db.collection("students").find({ classId: classObjectId }).toArray()
        const studentIds = students.map((student) => student._id)

        if (studentIds.length === 0) {
          return NextResponse.json({ assessments: [] })
        }

        query.studentId = { $in: studentIds }
      } catch (error) {
        return NextResponse.json({ error: "Invalid class ID format" }, { status: 400 })
      }
    }

    // Get assessments from both collections (student-assessments and grades)
    let assessments = []

    // First try the student-assessments collection
    try {
      const studentAssessments = await db
        .collection("student-assessments")
        .find(query)
        .sort({ createdAt: -1 })
        .toArray()
      assessments = [...studentAssessments]
    } catch (error) {
      console.error("[API] Error fetching from student-assessments collection:", error)
    }

    // Then try the grades collection for backward compatibility
    try {
      const grades = await db.collection("grades").find(query).sort({ createdAt: -1 }).toArray()
      assessments = [...assessments, ...grades]
    } catch (error) {
      console.error("[API] Error fetching from grades collection:", error)
    }

    // Convert ObjectIds to strings for JSON serialization
    const serializedAssessments = assessments.map((assessment) => ({
      ...assessment,
      _id: assessment._id.toString(),
      studentId: assessment.studentId.toString(),
      subjectId: assessment.subjectId.toString(),
      ...(assessment.createdBy && { createdBy: assessment.createdBy.toString() }),
      ...(assessment.updatedBy && { updatedBy: assessment.updatedBy.toString() }),
    }))

    return NextResponse.json({ assessments: serializedAssessments })
  } catch (error) {
    console.error("[API] Student assessments GET error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

// Create a new student assessment
export async function POST(request) {
  try {
    console.log("[API] POST /api/student-assessments - Creating new assessment")

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
    const { studentId, subjectId, title, score, maxScore, weight, date, comment } = body

    if (!studentId || !subjectId || !title || score === undefined || maxScore === undefined) {
      return NextResponse.json(
        { error: "Student ID, subject ID, title, score, and max score are required" },
        { status: 400 },
      )
    }

    const { db } = await connectToDatabase()

    // Validate studentId
    let studentObjectId
    try {
      studentObjectId = new ObjectId(studentId)
    } catch (error) {
      return NextResponse.json({ error: "Invalid student ID format" }, { status: 400 })
    }

    // Validate subjectId
    let subjectObjectId
    try {
      subjectObjectId = new ObjectId(subjectId)
    } catch (error) {
      return NextResponse.json({ error: "Invalid subject ID format" }, { status: 400 })
    }

    // Check if student exists
    const student = await db.collection("students").findOne({ _id: studentObjectId })
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
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

    // Create assessment
    const assessment = {
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

    const result = await db.collection("student-assessments").insertOne(assessment)

    return NextResponse.json({
      success: true,
      message: "Assessment created successfully",
      assessmentId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("[API] Student assessment POST error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
