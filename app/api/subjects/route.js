import { NextResponse } from "next/server"
import { getCollection } from "../../../lib/mongodb"
import { verifyToken } from "../../../lib/auth-utils"

export async function GET(request) {
  try {
    console.log("[API] GET /api/subjects - Fetching subjects")

    // Get cache buster from URL
    const { searchParams } = new URL(request.url)
    const cacheBuster = searchParams.get("t")
    console.log("[API] Cache buster:", cacheBuster)

    // Check authentication using JWT token from cookies
    const cookieHeader = request.headers.get("cookie")
    let authToken = null

    if (cookieHeader) {
      const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=")
        acc[key] = value
        return acc
      }, {})
      authToken = cookies.authToken
    }

    if (!authToken) {
      console.log("[API] No auth token found in cookies")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    let user
    try {
      const decoded = verifyToken(authToken)
      user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      }
      console.log("[API] Authenticated user:", user.email, "Role:", user.role)
    } catch (error) {
      console.log("[API] Invalid token:", error.message)
      return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 })
    }

    // Get subjects collection
    const subjectsCollection = await getCollection("subjects")

    // Fetch all subjects
    const subjects = await subjectsCollection.find({}).toArray()

    console.log(`[API] Found ${subjects.length} subjects in database`)

    // Convert ObjectId to string for JSON serialization
    const serializedSubjects = subjects.map((subject) => ({
      ...subject,
      _id: subject._id.toString(),
    }))

    return NextResponse.json({
      subjects: serializedSubjects,
      count: serializedSubjects.length,
    })
  } catch (error) {
    console.error("[API] Error fetching subjects:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch subjects",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(request) {
  try {
    console.log("[API] POST /api/subjects - Creating subject")

    // Check authentication using JWT token from cookies
    const cookieHeader = request.headers.get("cookie")
    let authToken = null

    if (cookieHeader) {
      const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=")
        acc[key] = value
        return acc
      }, {})
      authToken = cookies.authToken
    }

    if (!authToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    let user
    try {
      const decoded = verifyToken(authToken)
      user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      }

      if (user.role !== "teacher") {
        return NextResponse.json({ error: "Teacher authentication required" }, { status: 401 })
      }
    } catch (error) {
      return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 })
    }

    const subjectData = await request.json()
    console.log("[API] Creating subject:", subjectData)

    // Validate required fields
    if (!subjectData.name || !subjectData.code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 })
    }

    // Get subjects collection
    const subjectsCollection = await getCollection("subjects")

    // Check if subject code already exists
    const existingSubject = await subjectsCollection.findOne({ code: subjectData.code })
    if (existingSubject) {
      return NextResponse.json({ error: "Subject code already exists" }, { status: 400 })
    }

    // Create new subject
    const newSubject = {
      ...subjectData,
      teacherId: user.id,
      teacherName: user.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await subjectsCollection.insertOne(newSubject)

    const createdSubject = {
      ...newSubject,
      _id: result.insertedId.toString(),
    }

    console.log("[API] Subject created successfully:", createdSubject._id)

    return NextResponse.json(
      {
        message: "Subject created successfully",
        subject: createdSubject,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[API] Error creating subject:", error)
    return NextResponse.json(
      {
        error: "Failed to create subject",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
