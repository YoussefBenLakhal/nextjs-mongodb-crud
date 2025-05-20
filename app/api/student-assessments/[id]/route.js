import { NextResponse } from "next/server"
import { connectToDatabase } from "../../../lib/mongodb"
import { ObjectId } from "mongodb"
import { getSession } from "../../../../lib/server-auth"

// Get a specific assessment by ID
export async function GET(request, { params }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "Assessment ID is required" }, { status: 400 })
    }

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
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    userId = user.id

    const { db } = await connectToDatabase()

    // Convert ID to ObjectId
    let assessmentId
    try {
      assessmentId = new ObjectId(id)
    } catch (error) {
      return NextResponse.json({ error: "Invalid assessment ID format" }, { status: 400 })
    }

    // Find the assessment
    const assessment = await db.collection("student-assessments").findOne({ _id: assessmentId })

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    }

    // Check permissions
    if (user.role === "student" && assessment.studentId.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized - You can only view your own assessments" }, { status: 401 })
    }

    if (user.role === "teacher") {
      // Check if teacher teaches this subject
      const subject = await db.collection("subjects").findOne({
        _id: assessment.subjectId,
        teacherId: new ObjectId(userId),
      })

      if (!subject) {
        return NextResponse.json(
          {
            error: "Unauthorized - You can only view assessments for subjects you teach",
          },
          { status: 401 },
        )
      }
    }

    // Convert ObjectIds to strings
    const serialized = { ...assessment }
    if (assessment._id) serialized._id = assessment._id.toString()
    if (assessment.studentId) serialized.studentId = assessment.studentId.toString()
    if (assessment.subjectId) serialized.subjectId = assessment.subjectId.toString()
    if (assessment.createdBy) serialized.createdBy = assessment.createdBy.toString()

    return NextResponse.json({ assessment: serialized })
  } catch (error) {
    console.error("[API] Get assessment by ID error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

// Update an assessment
export async function PUT(request, { params }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "Assessment ID is required" }, { status: 400 })
    }

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
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    userId = user.id

    if (user.role !== "teacher" && user.role !== "admin") {
      return NextResponse.json(
        {
          error: "Unauthorized - Only teachers and admins can update assessments",
        },
        { status: 401 },
      )
    }

    const body = await request.json()
    const { score, maxScore, title, weight, date, comment } = body

    const { db } = await connectToDatabase()

    // Convert ID to ObjectId
    let assessmentId
    try {
      assessmentId = new ObjectId(id)
    } catch (error) {
      return NextResponse.json({ error: "Invalid assessment ID format" }, { status: 400 })
    }

    // Find the assessment
    const assessment = await db.collection("student-assessments").findOne({ _id: assessmentId })

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    }

    if (user.role === "teacher") {
      // Check if teacher teaches this subject
      const subject = await db.collection("subjects").findOne({
        _id: assessment.subjectId,
        teacherId: new ObjectId(userId),
      })

      if (!subject) {
        return NextResponse.json(
          {
            error: "Unauthorized - You can only update assessments for subjects you teach",
          },
          { status: 401 },
        )
      }
    }

    // Build update object
    const updateData = {}
    if (score !== undefined) updateData.score = Number(score)
    if (maxScore !== undefined) updateData.maxScore = Number(maxScore)
    if (title) updateData.title = title
    if (weight !== undefined) updateData.weight = Number(weight)
    if (date) updateData.date = new Date(date)
    if (comment !== undefined) updateData.comment = comment

    // Add update metadata
    updateData.updatedAt = new Date()
    updateData.updatedBy = new ObjectId(userId)

    // Update the assessment
    const result = await db.collection("student-assessments").updateOne({ _id: assessmentId }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Assessment updated successfully",
      modifiedCount: result.modifiedCount,
    })
  } catch (error) {
    console.error("[API] Update assessment error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

// Delete an assessment
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "Assessment ID is required" }, { status: 400 })
    }

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
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    userId = user.id

    if (user.role !== "teacher" && user.role !== "admin") {
      return NextResponse.json(
        {
          error: "Unauthorized - Only teachers and admins can delete assessments",
        },
        { status: 401 },
      )
    }

    const { db } = await connectToDatabase()

    // Convert ID to ObjectId
    let assessmentId
    try {
      assessmentId = new ObjectId(id)
    } catch (error) {
      return NextResponse.json({ error: "Invalid assessment ID format" }, { status: 400 })
    }

    // Find the assessment first to check permissions
    const assessment = await db.collection("student-assessments").findOne({ _id: assessmentId })

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    }

    if (user.role === "teacher") {
      // Check if teacher teaches this subject
      const subject = await db.collection("subjects").findOne({
        _id: assessment.subjectId,
        teacherId: new ObjectId(userId),
      })

      if (!subject) {
        return NextResponse.json(
          {
            error: "Unauthorized - You can only delete assessments for subjects you teach",
          },
          { status: 401 },
        )
      }
    }

    // Delete the assessment
    const result = await db.collection("student-assessments").deleteOne({ _id: assessmentId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Assessment not found or already deleted" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Assessment deleted successfully",
    })
  } catch (error) {
    console.error("[API] Delete assessment error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
