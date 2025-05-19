import { NextResponse } from "next/server"
import { connectToDatabase } from "../../../lib/mongodb"
import { ObjectId } from "mongodb"
import { getSession } from "../../../lib/server-auth"

// Get all classes
export async function GET(request) {
  try {
    console.log("[API] GET /api/classes - Fetching classes")

    // Get user from session
    const user = await getSession()

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 })
    }

    const userId = user.id
    const userRole = user.role

    const { db } = await connectToDatabase()
    const query = {}

    // If user is a teacher, only show their classes
    if (userRole === "teacher") {
      query.teacherId = new ObjectId(userId)
    }

    // Get classes
    const classes = await db.collection("classes").find(query).sort({ name: 1 }).toArray()

    // Convert ObjectIds to strings for JSON serialization
    const serializedClasses = classes.map((cls) => ({
      ...cls,
      _id: cls._id.toString(),
      teacherId: cls.teacherId.toString(),
      ...(cls.createdBy && { createdBy: cls.createdBy.toString() }),
      ...(cls.updatedBy && { updatedBy: cls.updatedBy.toString() }),
    }))

    return NextResponse.json({ classes: serializedClasses })
  } catch (error) {
    console.error("[API] Get classes error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

// Create a new class
export async function POST(request) {
  try {
    console.log("[API] POST /api/classes - Creating new class")

    // Get user from session
    const user = await getSession()

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 })
    }

    const userId = user.id
    const userRole = user.role

    if (userRole !== "teacher" && userRole !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Only teachers and admins can create classes" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, academicYear } = body

    if (!name) {
      return NextResponse.json({ error: "Class name is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if class with same name already exists for this teacher
    const existingClass = await db.collection("classes").findOne({
      name,
      teacherId: new ObjectId(userId),
    })

    if (existingClass) {
      return NextResponse.json({ error: "You already have a class with this name" }, { status: 400 })
    }

    // Create new class
    const newClass = {
      name,
      description: description || "",
      academicYear: academicYear || new Date().getFullYear().toString(),
      teacherId: new ObjectId(userId),
      studentCount: 0,
      createdAt: new Date(),
      createdBy: new ObjectId(userId),
      updatedAt: new Date(),
      updatedBy: new ObjectId(userId),
    }

    const result = await db.collection("classes").insertOne(newClass)

    return NextResponse.json({
      success: true,
      message: "Class created successfully",
      class: {
        _id: result.insertedId.toString(),
        ...newClass,
        teacherId: newClass.teacherId.toString(),
        createdBy: newClass.createdBy.toString(),
        updatedBy: newClass.updatedBy.toString(),
      },
    })
  } catch (error) {
    console.error("[API] Create class error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
