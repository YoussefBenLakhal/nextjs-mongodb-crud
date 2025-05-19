import { NextResponse } from "next/server"
import { getSession } from "../../../../lib/server-auth"
import { connectToDatabase } from "../../../../lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

// Get a specific student
export async function GET(request, { params }) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const { db } = await connectToDatabase()

    // Students can only view their own profile
    if (user.role === "student" && user.id !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get student user data
    const student = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id), role: "student" }, { projection: { password: 0 } })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Get student profile
    const profile = await db.collection("studentProfiles").findOne({ userId: new ObjectId(id) })

    // Get enrolled classes
    const classes = await db
      .collection("classes")
      .find({ students: new ObjectId(id) })
      .toArray()

    return NextResponse.json({
      student: {
        ...student,
        profile: profile || null,
        classes: classes || [],
      },
    })
  } catch (error) {
    console.error("[API] Student GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Update a student
export async function PUT(request, { params }) {
  try {
    const user = await getSession()
    const { id } = params

    // Only teachers or the student themselves can update
    if (!user || (user.role !== "teacher" && (user.role !== "student" || user.id !== id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, profile } = body

    const { db } = await connectToDatabase()

    // Check if student exists
    const existingStudent = await db.collection("users").findOne({
      _id: new ObjectId(id),
      role: "student",
    })

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Update user data
    const updateData = {}

    if (name) updateData.name = name
    if (email) {
      // Check if email is already in use by another user
      const emailExists = await db.collection("users").findOne({
        _id: { $ne: new ObjectId(id) },
        email,
      })

      if (emailExists) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 })
      }

      updateData.email = email
    }

    if (password) {
      // Only teachers can change passwords, or students can change their own
      if (user.role === "teacher" || user.id === id) {
        updateData.password = await bcrypt.hash(password, 10)
      }
    }

    updateData.updatedAt = new Date()

    if (Object.keys(updateData).length > 0) {
      await db.collection("users").updateOne({ _id: new ObjectId(id) }, { $set: updateData })
    }

    // Update profile if provided
    if (profile) {
      const profileUpdateData = {
        ...profile,
        updatedAt: new Date(),
      }

      await db.collection("studentProfiles").updateOne(
        { userId: new ObjectId(id) },
        {
          $set: profileUpdateData,
          $setOnInsert: {
            userId: new ObjectId(id),
            createdAt: new Date(),
          },
        },
        { upsert: true },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Student PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Delete a student
export async function DELETE(request, { params }) {
  try {
    const user = await getSession()

    if (!user || user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const { db } = await connectToDatabase()

    // Check if student exists
    const existingStudent = await db.collection("users").findOne({
      _id: new ObjectId(id),
      role: "student",
    })

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Remove student from all classes
    await db.collection("classes").updateMany({ students: new ObjectId(id) }, { $pull: { students: new ObjectId(id) } })

    // Delete student's grades
    await db.collection("grades").deleteMany({ studentId: new ObjectId(id) })

    // Delete student profile
    await db.collection("studentProfiles").deleteOne({ userId: new ObjectId(id) })

    // Delete student user
    await db.collection("users").deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Student DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
