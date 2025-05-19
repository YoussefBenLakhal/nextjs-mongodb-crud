import { NextResponse } from "next/server"
import { connectToDatabase } from "../../../../lib/mongodb"
import { ObjectId } from "mongodb"
import { getSession } from "../../../../lib/server-auth"

// Get a specific class
export async function GET(request, { params }) {
  try {
    console.log("[API] GET /api/classes/[id] - Fetching class:", params.id)

    // Get user from session
    const user = await getSession()

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 })
    }

    const userId = user.id
    const userRole = user.role

    const { id } = params
    const { db } = await connectToDatabase()

    // Verify class exists
    let classObjectId
    try {
      classObjectId = new ObjectId(id)
    } catch (error) {
      return NextResponse.json({ error: "Invalid class ID format" }, { status: 400 })
    }

    const classData = await db.collection("classes").findOne({ _id: classObjectId })
    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // If user is a teacher, verify they own this class
    if (userRole === "teacher" && classData.teacherId.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized - You can only view your own classes" }, { status: 401 })
    }

    // Convert ObjectIds to strings for JSON serialization
    const serializedClass = {
      ...classData,
      _id: classData._id.toString(),
      teacherId: classData.teacherId.toString(),
      ...(classData.createdBy && { createdBy: classData.createdBy.toString() }),
      ...(classData.updatedBy && { updatedBy: classData.updatedBy.toString() }),
    }

    return NextResponse.json({ class: serializedClass })
  } catch (error) {
    console.error("[API] Get class error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

// Update a class
export async function PUT(request, { params }) {
  try {
    console.log("[API] PUT /api/classes/[id] - Updating class:", params.id)

    // Get user from session
    const user = await getSession()

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 })
    }

    const userId = user.id
    const userRole = user.role

    if (userRole !== "teacher" && userRole !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Only teachers and admins can update classes" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { name, description, academicYear } = body

    if (!name) {
      return NextResponse.json({ error: "Class name is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Verify class exists
    let classObjectId
    try {
      classObjectId = new ObjectId(id)
    } catch (error) {
      return NextResponse.json({ error: "Invalid class ID format" }, { status: 400 })
    }

    const classExists = await db.collection("classes").findOne({ _id: classObjectId })
    if (!classExists) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Verify teacher owns this class or is an admin
    if (userRole === "teacher" && classExists.teacherId.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized - You can only update your own classes" }, { status: 401 })
    }

    // Check if class with same name already exists for this teacher (excluding this class)
    const existingClass = await db.collection("classes").findOne({
      _id: { $ne: classObjectId },
      name,
      teacherId: new ObjectId(userId),
    })

    if (existingClass) {
      return NextResponse.json({ error: "You already have another class with this name" }, { status: 400 })
    }

    // Update class
    const updateData = {
      name,
      description: description || "",
      academicYear: academicYear || classExists.academicYear,
      updatedAt: new Date(),
      updatedBy: new ObjectId(userId),
    }

    await db.collection("classes").updateOne({ _id: classObjectId }, { $set: updateData })

    return NextResponse.json({
      success: true,
      message: "Class updated successfully",
      class: {
        ...classExists,
        ...updateData,
        _id: classExists._id.toString(),
        teacherId: classExists.teacherId.toString(),
        createdBy: classExists.createdBy.toString(),
        updatedBy: updateData.updatedBy.toString(),
      },
    })
  } catch (error) {
    console.error("[API] Update class error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

// Delete a class
export async function DELETE(request, { params }) {
  try {
    console.log("[API] DELETE /api/classes/[id] - Deleting class:", params.id)

    // Get user from session
    const user = await getSession()

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 })
    }

    const userId = user.id
    const userRole = user.role

    if (userRole !== "teacher" && userRole !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Only teachers and admins can delete classes" }, { status: 401 })
    }

    const { id } = params
    const { searchParams } = new URL(request.url)
    const force = searchParams.get("force") === "true"

    const { db } = await connectToDatabase()

    // Verify class exists
    let classObjectId
    try {
      classObjectId = new ObjectId(id)
    } catch (error) {
      return NextResponse.json({ error: "Invalid class ID format" }, { status: 400 })
    }

    const classExists = await db.collection("classes").findOne({ _id: classObjectId })
    if (!classExists) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Verify teacher owns this class or is an admin
    if (userRole === "teacher" && classExists.teacherId.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized - You can only delete your own classes" }, { status: 401 })
    }

    // Check if class has students
    const studentCount = await db.collection("students").countDocuments({ classId: classObjectId })

    if (studentCount > 0 && !force) {
      return NextResponse.json(
        {
          error: "Cannot delete class with students",
          studentCount,
          requiresForce: true,
        },
        { status: 400 },
      )
    }

    // If force delete, update students to remove class reference
    if (force && studentCount > 0) {
      await db.collection("students").updateMany(
        { classId: classObjectId },
        {
          $unset: { classId: "" },
          $set: {
            updatedAt: new Date(),
            updatedBy: new ObjectId(userId),
          },
        },
      )
    }

    // Delete class
    await db.collection("classes").deleteOne({ _id: classObjectId })

    return NextResponse.json({
      success: true,
      message: force ? `Class deleted and ${studentCount} students removed from class` : "Class deleted successfully",
    })
  } catch (error) {
    console.error("[API] Delete class error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
