import { NextResponse } from "next/server"
import { connectToDatabase } from "../../../../lib/mongodb"
import { ObjectId } from "mongodb"
import { getSession } from "../../../../lib/server-auth"

// Get a specific student assessment by ID
export async function GET(request, { params }) {
  try {
    console.log(`[API] GET /api/student-assessments/${params.id} - Fetching assessment`)

    // Get user from session
    const user = await getSession()

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 })
    }

    const userId = user.id
    const userRole = user.role

    const { db } = await connectToDatabase()

    // Validate assessmentId
    let assessmentId
    try {
      assessmentId = new ObjectId(params.id)
    } catch (error) {
      return NextResponse.json({ error: "Invalid assessment ID format" }, { status: 400 })
    }

    // Try to get assessment from student-assessments collection
    let assessment = await db.collection("student-assessments").findOne({ _id: assessmentId })

    // If not found, try the grades collection for backward compatibility
    if (!assessment) {
      assessment = await db.collection("grades").findOne({ _id: assessmentId })
    }

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    }

    // If user is a teacher, verify they teach this subject
    if (userRole === "teacher") {
      const subject = await db.collection("subjects").findOne({ _id: assessment.subjectId })

      if (!subject || subject.teacherId.toString() !== userId) {
        return NextResponse.json(
          { error: "Unauthorized - You can only view assessments for subjects you teach" },
          { status: 401 },
        )
      }
    }

    // If user is a student, verify the assessment belongs to them
    if (userRole === "student" && assessment.studentId.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized - You can only view your own assessments" }, { status: 401 })
    }

    // Convert ObjectIds to strings for JSON serialization
    const serializedAssessment = {
      ...assessment,
      _id: assessment._id.toString(),
      studentId: assessment.studentId.toString(),
      subjectId: assessment.subjectId.toString(),
      ...(assessment.createdBy && { createdBy: assessment.createdBy.toString() }),
      ...(assessment.updatedBy && { updatedBy: assessment.updatedBy.toString() }),
    }

    return NextResponse.json({ assessment: serializedAssessment })
  } catch (error) {
    console.error("[API] Student assessment GET error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

// Update a student assessment
export async function PUT(request, { params }) {
  try {
    console.log(`[API] PUT /api/student-assessments/${params.id} - Updating assessment`)

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
        { error: "Unauthorized - Only teachers and admins can update assessments" },
        { status: 401 },
      )
    }

    const { db } = await connectToDatabase()

    // Validate assessmentId
    let assessmentId
    try {
      assessmentId = new ObjectId(params.id)
    } catch (error) {
      return NextResponse.json({ error: "Invalid assessment ID format" }, { status: 400 })
    }

    // Try to get assessment from student-assessments collection
    let existingAssessment = await db.collection("student-assessments").findOne({ _id: assessmentId })
    let collectionName = "student-assessments"

    // If not found, try the grades collection for backward compatibility
    if (!existingAssessment) {
      existingAssessment = await db.collection("grades").findOne({ _id: assessmentId })
      collectionName = "grades"
    }

    if (!existingAssessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    }

    // If user is a teacher, verify they teach this subject
    if (userRole === "teacher") {
      const subject = await db.collection("subjects").findOne({ _id: existingAssessment.subjectId })

      if (!subject || subject.teacherId.toString() !== userId) {
        return NextResponse.json(
          { error: "Unauthorized - You can only update assessments for subjects you teach" },
          { status: 401 },
        )
      }
    }

    const body = await request.json()
    const { title, score, maxScore, weight, date, comment } = body

    // Create update object with only provided fields
    const updateData = {}

    if (title !== undefined) updateData.title = title
    if (score !== undefined) updateData.score = Number.parseFloat(score)
    if (maxScore !== undefined) updateData.maxScore = Number.parseFloat(maxScore)
    if (weight !== undefined) updateData.weight = Number.parseFloat(weight)
    if (date !== undefined) updateData.date = new Date(date)
    if (comment !== undefined) updateData.comment = comment

    // Add metadata
    updateData.updatedAt = new Date()
    updateData.updatedBy = new ObjectId(userId)

    // Update assessment
    await db.collection(collectionName).updateOne({ _id: assessmentId }, { $set: updateData })

    return NextResponse.json({
      success: true,
      message: "Assessment updated successfully",
    })
  } catch (error) {
    console.error("[API] Student assessment PUT error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

// Delete a student assessment
export async function DELETE(request, { params }) {
  try {
    console.log(`[API] DELETE /api/student-assessments/${params.id} - Deleting assessment`)

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
        { error: "Unauthorized - Only teachers and admins can delete assessments" },
        { status: 401 },
      )
    }

    const { db } = await connectToDatabase()

    // Validate assessmentId
    let assessmentId
    try {
      assessmentId = new ObjectId(params.id)
    } catch (error) {
      return NextResponse.json({ error: "Invalid assessment ID format" }, { status: 400 })
    }

    // Try to get assessment from student-assessments collection
    let existingAssessment = await db.collection("student-assessments").findOne({ _id: assessmentId })
    let collectionName = "student-assessments"

    // If not found, try the grades collection for backward compatibility
    if (!existingAssessment) {
      existingAssessment = await db.collection("grades").findOne({ _id: assessmentId })
      collectionName = "grades"
    }

    if (!existingAssessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    }

    // If user is a teacher, verify they teach this subject
    if (userRole === "teacher") {
      const subject = await db.collection("subjects").findOne({ _id: existingAssessment.subjectId })

      if (!subject || subject.teacherId.toString() !== userId) {
        return NextResponse.json(
          { error: "Unauthorized - You can only delete assessments for subjects you teach" },
          { status: 401 },
        )
      }
    }

    // Delete assessment
    await db.collection(collectionName).deleteOne({ _id: assessmentId })

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
