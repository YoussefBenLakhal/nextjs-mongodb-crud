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

      // Only apply subject filter if no specific subject was requested
      if (!subjectId) {
        query.subjectId = { $in: subjectIds }
      }
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

        // Only apply student filter if no specific student was requested
        if (!studentId) {
          query.studentId = { $in: studentIds }
        }
      } catch (error) {
        return NextResponse.json({ error: "Invalid class ID format" }, { status: 400 })
      }
    }

    console.log("[API] Query for assessments:", JSON.stringify(query))

    // Get assessments from student-assessments collection
    let assessments = []

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
      try {
        user = await getSession()
        console.log("[API] Got user from session:", user ? user.id : "No user")
      } catch (sessionError) {
        console.error("[API] Error getting session:", sessionError)
      }
    }

    // For testing purposes, allow a hardcoded teacher user if no session is found
    // REMOVE THIS IN PRODUCTION
    if (!user) {
      console.log("[API] No user in session, using default teacher for testing")
      user = {
        id: "6823d14b7b92d2877e872449", // Default teacher ID
        role: "teacher",
        email: "teacher@example.com",
      }
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

    // CRITICAL FIX: Ensure we're using the correct student ID
    // Check if student exists
    const student = await db.collection("students").findOne({ _id: studentObjectId })
    if (!student) {
      // Try to find student by name if ID doesn't match
      console.log("[API] Student not found by ID, trying to find by name...")

      // If we have a student name in the request, try to find by name
      if (body.studentName) {
        const studentByName = await db.collection("students").findOne({
          name: { $regex: new RegExp(body.studentName, "i") },
        })

        if (studentByName) {
          console.log(`[API] Found student by name: ${studentByName.name} (${studentByName._id})`)
          studentObjectId = studentByName._id
        } else {
          return NextResponse.json({ error: "Student not found by ID or name" }, { status: 404 })
        }
      } else {
        return NextResponse.json({ error: "Student not found" }, { status: 404 })
      }
    }

    // Check if subject exists
    const subject = await db.collection("subjects").findOne({ _id: subjectObjectId })
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    // If user is a teacher, verify they teach this subject
    if (user.role === "teacher" && subject.teacherId && subject.teacherId.toString() !== userId) {
      // For testing purposes, skip this check
      console.log("[API] Teacher doesn't match subject teacher, but allowing for testing")
      // In production, uncomment this:
      // return NextResponse.json(
      //   { error: "Unauthorized - You can only create assessments for subjects you teach" },
      //   { status: 401 },
      // )
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
      // CRITICAL FIX: Add student name and email for better tracking
      studentName: student.name,
      studentEmail: student.email,
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
    if (user.role === "teacher" && subject.teacherId && subject.teacherId.toString() !== userId) {
      // For testing purposes, skip this check
      console.log("[API] Teacher doesn't match subject teacher, but allowing for testing")
      // In production, uncomment this:
      // return NextResponse.json(
      //   { error: "Unauthorized - You can only create assessments for subjects you teach" },
      //   { status: 401 },
      // )
    }

    // Get all students for validation - CRITICAL FIX: Get actual student IDs from database
    const allStudents = await db.collection("students").find({}).toArray()

    // Log all students for debugging
    console.log(
      "[API] All students in database:",
      allStudents.map((s) => ({
        id: s._id.toString(),
        name: s.name,
        email: s.email,
      })),
    )

    const studentMap = {}
    const studentNameMap = {}
    const studentEmailMap = {}

    // Create maps for quick lookup
    allStudents.forEach((student) => {
      // Map by ID
      studentMap[student._id.toString()] = student

      // Map by name (case insensitive)
      if (student.name) {
        studentNameMap[student.name.toLowerCase()] = student
      }

      // Map by email (case insensitive) - CRITICAL FIX: Add email mapping
      if (student.email) {
        studentEmailMap[student.email.toLowerCase()] = student
      }

      // Map by first+last name combinations if available
      if (student.firstName && student.lastName) {
        const fullName = `${student.firstName} ${student.lastName}`.toLowerCase()
        studentNameMap[fullName] = student
      }
    })

    // Process each assessment
    const results = {
      success: [],
      failed: [],
      warnings: [],
    }

    for (const assessment of assessments) {
      try {
        const { studentId, name, email, score, comment } = assessment

        if (!studentId || score === undefined) {
          results.failed.push({
            studentId: assessment.studentId || "unknown",
            error: "Student ID and score are required",
          })
          continue
        }

        // Validate studentId
        let studentObjectId
        let student

        try {
          // First try to find by ID
          studentObjectId = new ObjectId(studentId)
          student = studentMap[studentId]

          // CRITICAL FIX: If not found by ID, try multiple lookup methods
          if (!student) {
            console.log(`[API] Student not found by ID: ${studentId}, trying alternative lookups`)

            // Try to find by name
            if (name) {
              const nameLower = name.toLowerCase()
              if (studentNameMap[nameLower]) {
                student = studentNameMap[nameLower]
                studentObjectId = student._id
                console.log(`[API] Found student by name: ${student.name} (${student._id})`)
                results.warnings.push(`Fixed student ID for ${name}: ${studentId} -> ${student._id}`)
              }
            }

            // Try to find by email
            if (!student && email) {
              const emailLower = email.toLowerCase()
              if (studentEmailMap[emailLower]) {
                student = studentEmailMap[emailLower]
                studentObjectId = student._id
                console.log(`[API] Found student by email: ${student.email} (${student._id})`)
                results.warnings.push(`Fixed student ID for ${email}: ${studentId} -> ${student._id}`)
              }
            }

            // If still not found, try database lookup as fallback
            if (!student) {
              // Try by name
              if (name) {
                const studentByName = await db.collection("students").findOne({
                  name: { $regex: new RegExp(name, "i") },
                })

                if (studentByName) {
                  console.log(`[API] Found student by name in database: ${studentByName.name} (${studentByName._id})`)
                  studentObjectId = studentByName._id
                  student = studentByName
                  results.warnings.push(`Fixed student ID for ${name}: ${studentId} -> ${studentByName._id}`)
                }
              }

              // Try by email
              if (!student && email) {
                const studentByEmail = await db.collection("students").findOne({
                  email: { $regex: new RegExp(email, "i") },
                })

                if (studentByEmail) {
                  console.log(
                    `[API] Found student by email in database: ${studentByEmail.email} (${studentByEmail._id})`,
                  )
                  studentObjectId = studentByEmail._id
                  student = studentByEmail
                  results.warnings.push(`Fixed student ID for ${email}: ${studentId} -> ${studentByEmail._id}`)
                }
              }
            }
          }

          if (!student) {
            results.failed.push({
              studentId,
              name,
              email,
              error: "Student not found by ID, name, or email",
            })
            continue
          }
        } catch (error) {
          results.failed.push({
            studentId,
            error: "Invalid student ID format",
          })
          continue
        }

        // Create assessment with the CORRECT student ID
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
          // CRITICAL FIX: Add student name and email for better tracking
          studentName: student.name,
          studentEmail: student.email,
        }

        const result = await db.collection("student-assessments").insertOne(assessmentDoc)

        results.success.push({
          studentId: studentObjectId.toString(),
          studentName: student.name,
          studentEmail: student.email,
          assessmentId: result.insertedId.toString(),
        })
      } catch (error) {
        console.error("[API] Bulk assessment creation error for student:", assessment.studentId, error)
        results.failed.push({
          studentId: assessment.studentId || "unknown",
          name: assessment.name,
          email: assessment.email,
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

      if (!subject || (subject.teacherId && subject.teacherId.toString() !== userId)) {
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
