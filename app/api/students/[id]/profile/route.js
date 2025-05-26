import { NextResponse } from "next/server"
import { getSession } from "../../../../../lib/server-auth"
import { connectToDatabase } from "../../../../../lib/mongodb"
import { ObjectId } from "mongodb"

// Get a student's profile
export async function GET(request, { params }) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Students can only view their own profile
    if (user.role === "student" && user.id !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const profile = await db.collection("studentProfiles").findOne({ userId: new ObjectId(id) })

    if (!profile) {
      return NextResponse.json({
        profile: {
          userId: id,
          firstName: "",
          lastName: "",
          dateOfBirth: null,
          address: "",
          phoneNumber: "",
          parentName: "",
          parentContact: "",
          enrolledClasses: [],
        },
      })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("[API] Student Profile GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Update a student's profile
export async function PUT(request, { params }) {
  try {
    const user = await getSession()
    const { id } = params

    // Only teachers or the student themselves can update
    if (!user || (user.role !== "teacher" && (user.role !== "student" || user.id !== id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName, dateOfBirth, address, phoneNumber, parentName, parentContact } = body

    const { db } = await connectToDatabase()

    // Update profile
    await db.collection("studentProfiles").updateOne(
      { userId: new ObjectId(id) },
      {
        $set: {
          firstName: firstName || "",
          lastName: lastName || "",
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          address: address || "",
          phoneNumber: phoneNumber || "",
          parentName: parentName || "",
          parentContact: parentContact || "",
          updatedAt: new Date(),
        },
        $setOnInsert: {
          userId: new ObjectId(id),
          enrolledClasses: [],
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Student Profile PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
