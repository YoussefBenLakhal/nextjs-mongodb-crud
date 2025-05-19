import { NextResponse } from "next/server"
import { connectToDatabase } from "../../../lib/mongodb"
import { getServerSession } from "../../../lib/server-auth"
import { ObjectId } from "mongodb"

// Get all subjects - public version that doesn't require authentication
export async function GET(request) {
  try {
    console.log("[API] GET /api/subjects - Fetching subjects")

    // Get cache-busting parameter if present
    const { searchParams } = new URL(request.url)
    const cacheBuster = searchParams.get("t") || Date.now()
    console.log(`[API] Cache buster: ${cacheBuster}`)

    // Get session using your custom auth
    const session = await getServerSession()
    console.log("[API] Session:", session)

    // Connect to database
    const { db } = await connectToDatabase()

    // Fetch all subjects - use a direct query to bypass any caching
    const subjects = await db
      .collection("subjects")
      .find({}, { readPreference: "primary" }) // Force read from primary to avoid replication lag
      .toArray()

    console.log(`[API] Found ${subjects.length} subjects`)

    // Convert ObjectIds to strings for JSON serialization
    const serializedSubjects = subjects.map((subject) => ({
      ...subject,
      _id: subject._id.toString ? subject._id.toString() : subject._id,
      classId: subject.classId?.toString ? subject.classId.toString() : subject.classId,
      ...(subject.teacherId && {
        teacherId: subject.teacherId.toString ? subject.teacherId.toString() : subject.teacherId,
      }),
      ...(subject.createdBy && {
        createdBy: subject.createdBy.toString ? subject.createdBy.toString() : subject.createdBy,
      }),
    }))

    // Set cache control headers to prevent caching
    return NextResponse.json(
      { subjects: serializedSubjects },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      },
    )
  } catch (error) {
    console.error("[API] Error fetching subjects:", error)
    return NextResponse.json({ error: `Failed to fetch subjects: ${error.message}` }, { status: 500 })
  }
}

// Create a new subject
export async function POST(request) {
  try {
    console.log("[API] POST /api/subjects - Creating subject")

    // Get session using your custom auth
    const session = await getServerSession()
    console.log("[API] Session:", session)

    // Check if user is authenticated
    if (!session) {
      console.log("[API] No session found, unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.code || !body.classId) {
      return NextResponse.json({ error: "Name, code, and classId are required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Check if subject code already exists for this class
    const existingSubject = await db.collection("subjects").findOne({
      classId: body.classId,
      code: body.code,
    })

    if (existingSubject) {
      return NextResponse.json({ error: "Subject code already exists for this class" }, { status: 409 })
    }

    // Prepare subject data
    const subjectData = {
      ...body,
      teacherId: new ObjectId(session.id),
      createdAt: new Date(),
      createdBy: new ObjectId(session.id),
    }

    // Convert classId to ObjectId if it's a valid ObjectId
    try {
      subjectData.classId = new ObjectId(body.classId)
    } catch (error) {
      console.log(`[API] ClassId ${body.classId} is not a valid ObjectId, using as string`)
    }

    // Insert subject
    const result = await db.collection("subjects").insertOne(subjectData)

    console.log("[API] Subject created:", result.insertedId)

    // Return the created subject with ID
    return NextResponse.json({
      success: true,
      subjectId: result.insertedId.toString(),
      subject: {
        ...subjectData,
        _id: result.insertedId.toString(),
        teacherId: subjectData.teacherId.toString(),
        createdBy: subjectData.createdBy.toString(),
        classId: subjectData.classId.toString ? subjectData.classId.toString() : subjectData.classId,
      },
    })
  } catch (error) {
    console.error("[API] Error creating subject:", error)
    return NextResponse.json({ error: `Failed to create subject: ${error.message}` }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
