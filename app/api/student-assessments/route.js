import { NextResponse } from "next/server"
import { connectToDatabase } from "../../../lib/mongodb"
import { ObjectId } from "mongodb"
import { getSession } from "../../../lib/server-auth"

// Get all student assessments (with filtering options)
export async function GET(request) {
  try {
    console.log("[API] GET /api/student-assessments - Request received")

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

    console.log("[API] User session details:", {
      id: user.id,
      role: user.role,
      email: user.email,
    })

    console.log(`[API] User authenticated: ${user.role} (${userId})`)

    const { db } = await connectToDatabase()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const subjectId = searchParams.get("subjectId")
    const classId = searchParams.get("classId")
    const isBulk = searchParams.get("bulk") === "true"

    // Check if this is a request for a specific assessment by ID
    const assessmentId = searchParams.get("id")
    if (assessmentId) {
      try {
        const assessmentObjectId = new ObjectId(assessmentId)
        const assessment = await db.collection("student-assessments").findOne({ _id: assessmentObjectId })

        if (!assessment) {
          return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
        }

        // Convert ObjectIds to strings
        const serialized = { ...assessment }
        if (assessment._id) serialized._id = assessment._id.toString()
        if (assessment.studentId) serialized.studentId = assessment.studentId.toString()
        if (assessment.subjectId) serialized.subjectId = assessment.subjectId.toString()
        if (assessment.createdBy) serialized.createdBy = assessment.createdBy.toString()

        return NextResponse.json({ assessment: serialized })
      } catch (error) {
        return NextResponse.json({ error: "Invalid assessment ID format" }, { status: 400 })
      }
    }

    // Build query
    const query = {}

    // If user is a student, only show their own grades
    if (user.role === "student") {
      try {
        query.studentId = new ObjectId(userId)
        console.log(`[API] Filtering for student: ${userId}`)
      } catch (error) {
        console.error("[API] Error converting student ID to ObjectId:", error)
        return NextResponse.json({ error: "Invalid student ID format" }, { status: 400 })
      }
    } else if (studentId) {
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
    if (user.role === "teacher") {
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

    console.log("[API] Query for assessments:", JSON.stringify(query))

    // Get assessments from both collections (student-assessments and grades)
    let assessments = []

    // First try the student-assessments collection
    try {
      const studentAssessments = await db
        .collection("student-assessments")
        .find(query)
        .sort({ createdAt: -1 })
        .toArray()
      console.log(`[API] Found ${studentAssessments.length} assessments in student-assessments collection`)
      assessments = [...studentAssessments]
    } catch (error) {
      console.error("[API] Error fetching from student-assessments collection:", error)
    }

    // Then try the grades collection for backward compatibility
    try {
      const grades = await db.collection("grades").find(query).sort({ createdAt: -1 }).toArray()
      console.log(`[API] Found ${grades.length} assessments in grades collection`)

      if (grades.length > 0) {
        console.log("[API] Sample grade from grades collection:", {
          id: grades[0]._id.toString(),
          studentId: grades[0].studentId.toString(),
          subjectId: grades[0].subjectId.toString(),
          title: grades[0].title || "No title",
          score: grades[0].score,
          maxScore: grades[0].maxScore,
        })
      }

      assessments = [...assessments, ...grades]
    } catch (error) {
      console.error("[API] Error fetching from grades collection:", error)
    }

    // Convert ObjectIds to strings for JSON serialization
    const serializedAssessments = assessments.map((assessment) => {
      // Create a new object with all properties
      const serialized = { ...assessment }

      // Convert known ObjectId fields to strings
      if (assessment._id) serialized._id = assessment._id.toString()
      if (assessment.studentId) serialized.studentId = assessment.studentId.toString()
      if (assessment.subjectId) serialized.subjectId = assessment.subjectId.toString()
      if (assessment.createdBy) serialized.createdBy = assessment.createdBy.toString()
      if (assessment.updatedBy) serialized.updatedBy = assessment.updatedBy.toString()
      if (assessment.classId) serialized.classId = assessment.classId.toString()

      return serialized
    })

    console.log(`[API] Returning ${serializedAssessments.length} total assessments`)

    // Log a sample of the serialized data if available
    if (serializedAssessments.length > 0) {
      console.log("[API] Sample serialized assessment:", {
        id: serializedAssessments[0]._id,
        studentId: serializedAssessments[0].studentId,
        subjectId: serializedAssessments[0].subjectId,
        title: serializedAssessments[0].title || "No title",
      })
    }

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

    // Check if this is a bulk operation
    if (body.assessments && Array.isArray(body.assessments)) {
      return handleBulkAssessments(request, body, user, userId)
    }

    // Regular single assessment creation
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
    if (user.role === "teacher" && subject.teacherId.toString() !== userId) {
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

// Handle bulk assessment creation
async function handleBulkAssessments(request, body, user, userId) {
  try {
    console.log("[API] Handling bulk assessment creation")

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
          results.failed.push({
            studentId: assessment.studentId || "unknown",
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
          studentId: assessment.studentId || "unknown",
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
    console.error("[API] Bulk assessments error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

// Delete an assessment
export async function DELETE(request) {
  try {
    console.log("[API] DELETE /api/student-assessments - Deleting assessment")

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
        { error: "Unauthorized - Only teachers and admins can delete assessments" },
        { status: 401 },
      )
    }

    // Get assessment ID from query parameters
    const { searchParams } = new URL(request.url)
    const assessmentId = searchParams.get("id")

    if (!assessmentId) {
      return NextResponse.json({ error: "Assessment ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Validate assessment ID
    let assessmentObjectId
    try {
      assessmentObjectId = new ObjectId(assessmentId)
    } catch (error) {
      return NextResponse.json({ error: "Invalid assessment ID format" }, { status: 400 })
    }

    // Check if assessment exists
    const assessment = await db.collection("student-assessments").findOne({ _id: assessmentObjectId })
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    }

    // If user is a teacher, verify they created this assessment or teach the subject
    if (user.role === "teacher") {
      const subject = await db.collection("subjects").findOne({ _id: assessment.subjectId })

      if (!subject || subject.teacherId.toString() !== userId) {
        return NextResponse.json(
          { error: "Unauthorized - You can only delete assessments for subjects you teach" },
          { status: 401 },
        )
      }
    }

    // Delete the assessment
    await db.collection("student-assessments").deleteOne({ _id: assessmentObjectId })

    return NextResponse.json({
      success: true,
      message: "Assessment deleted successfully",
    })
  } catch (error) {
    console.error("[API] Student assessment DELETE error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
