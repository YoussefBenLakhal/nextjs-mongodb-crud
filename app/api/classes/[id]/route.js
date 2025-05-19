import { NextResponse } from "next/server"
import { connectToDatabase } from "../../../lib/mongodb1"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// Get a specific class
export async function GET(request, { params }) {
  try {
    console.log(`[API] GET /api/classes/${params.id} - Fetching class`)

    // Connect to the database
    const { db, isConnected, error } = await connectToDatabase()

    if (!isConnected) {
      console.error("[API] Database connection failed:", error)
      return NextResponse.json({ error: "Failed to connect to the database" }, { status: 500 })
    }

    // Validate the ID
    let classId
    try {
      classId = new ObjectId(params.id)
    } catch (error) {
      console.error("[API] Invalid class ID:", params.id)
      return NextResponse.json({ error: "Invalid class ID format" }, { status: 400 })
    }

    // Find the class in the database
    const classData = await db.collection("classes").findOne({ _id: classId })

    if (!classData) {
      console.log(`[API] Class not found: ${params.id}`)
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    console.log(`[API] Class found: ${classData.name}`)
    return NextResponse.json({ class: classData })
  } catch (error) {
    console.error("[API] Error fetching class:", error)
    return NextResponse.json({ error: "Failed to fetch class" }, { status: 500 })
  }
}

// Update a class
export async function PUT(request, { params }) {
  try {
    console.log(`[API] PUT /api/classes/${params.id} - Updating class`)

    // Get the session to check authentication
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "teacher") {
      console.error("[API] Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized. Only teachers can update classes." }, { status: 401 })
    }

    // Connect to the database
    const { db, isConnected, error } = await connectToDatabase()

    if (!isConnected) {
      console.error("[API] Database connection failed:", error)
      return NextResponse.json({ error: "Failed to connect to the database" }, { status: 500 })
    }

    // Validate the ID
    let classId
    try {
      classId = new ObjectId(params.id)
    } catch (error) {
      console.error("[API] Invalid class ID:", params.id)
      return NextResponse.json({ error: "Invalid class ID format" }, { status: 400 })
    }

    // Get the request body
    let classData
    try {
      classData = await request.json()
      console.log("[API] Update data received:", classData)
    } catch (error) {
      console.error("[API] Error parsing request body:", error)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // Validate required fields
    if (!classData.name) {
      console.error("[API] Missing required field: name")
      return NextResponse.json({ error: "Class name is required" }, { status: 400 })
    }

    // Prepare the update data
    const updateData = {
      name: classData.name,
      description: classData.description || "",
      subject: classData.subject || "",
      schedule: classData.schedule || "",
      room: classData.room || "",
      updatedAt: new Date(),
    }

    // If teacherId is provided and valid, include it
    if (classData.teacherId) {
      try {
        // Validate if it's a valid ObjectId
        new ObjectId(classData.teacherId)
        updateData.teacherId = classData.teacherId
      } catch (error) {
        console.warn("[API] Invalid teacherId format, using as string:", classData.teacherId)
        // Still use it as a string if it's not a valid ObjectId
        updateData.teacherId = classData.teacherId
      }
    }

    console.log("[API] Final update data:", updateData)

    // Update the class in the database
    const result = await db.collection("classes").updateOne({ _id: classId }, { $set: updateData })

    if (result.matchedCount === 0) {
      console.log(`[API] Class not found: ${params.id}`)
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    if (result.modifiedCount === 0) {
      console.log(`[API] No changes made to class: ${params.id}`)
      return NextResponse.json({
        message: "No changes made to the class",
        updated: false,
      })
    }

    console.log(`[API] Class updated successfully: ${params.id}`)

    // Fetch the updated class
    const updatedClass = await db.collection("classes").findOne({ _id: classId })

    return NextResponse.json({
      message: "Class updated successfully",
      updated: true,
      class: updatedClass,
    })
  } catch (error) {
    console.error("[API] Error updating class:", error)
    return NextResponse.json(
      {
        error: "Failed to update class",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

// Delete a class
export async function DELETE(request, { params }) {
  try {
    console.log(`[API] DELETE /api/classes/${params.id} - Deleting class`)

    // Get the session to check authentication
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "teacher") {
      console.error("[API] Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized. Only teachers can delete classes." }, { status: 401 })
    }

    // Connect to the database
    const { db, isConnected, error } = await connectToDatabase()

    if (!isConnected) {
      console.error("[API] Database connection failed:", error)
      return NextResponse.json({ error: "Failed to connect to the database" }, { status: 500 })
    }

    // Validate the ID
    let classId
    try {
      classId = new ObjectId(params.id)
    } catch (error) {
      console.error("[API] Invalid class ID:", params.id)
      return NextResponse.json({ error: "Invalid class ID format" }, { status: 400 })
    }

    // Find the class first to check if it exists
    const classData = await db.collection("classes").findOne({ _id: classId })

    if (!classData) {
      console.log(`[API] Class not found: ${params.id}`)
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Delete the class
    const result = await db.collection("classes").deleteOne({ _id: classId })

    if (result.deletedCount === 0) {
      console.error(`[API] Failed to delete class: ${params.id}`)
      return NextResponse.json({ error: "Failed to delete class" }, { status: 500 })
    }

    console.log(`[API] Class deleted successfully: ${params.id}`)
    return NextResponse.json({
      message: "Class deleted successfully",
      deleted: true,
    })
  } catch (error) {
    console.error("[API] Error deleting class:", error)
    return NextResponse.json({ error: "Failed to delete class" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
