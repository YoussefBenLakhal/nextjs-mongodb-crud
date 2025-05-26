import { NextResponse } from "next/server"
import { connectToDatabase, getConnectionStatus } from "../../../lib/mongodb"
import { getSession } from "../../../../lib/server-auth"

export async function GET(request) {
  try {
    console.log("[API] GET /api/student/subjects - Fetching subjects for student")

    // First, check MongoDB connection status
    const connectionStatus = getConnectionStatus()
    console.log("[API] MongoDB connection status:", connectionStatus)

    if (!connectionStatus.isConnected) {
      console.log("[API] MongoDB is not connected")
      return NextResponse.json({
        success: false,
        error: `MongoDB connection issue: ${connectionStatus.error}`,
        connectionStatus,
        subjects: [], // No fallback subjects
      })
    }

    // Get user from session
    const user = await getSession()

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json({
        success: false,
        error: "Unauthorized - No user in session",
        subjects: [], // No fallback subjects
      })
    }

    const userId = user.id
    const userRole = user.role

    console.log(`[API] User info: id=${userId}, role=${userRole}`)

    // Connect to database
    const { db, isConnected, error } = await connectToDatabase()

    if (!isConnected || !db) {
      console.log(`[API] Database connection failed: ${error}`)
      return NextResponse.json({
        success: false,
        error: `Database connection failed: ${error}`,
        subjects: [], // No fallback subjects
      })
    }

    // For simplicity, just return all subjects
    try {
      // Simplified query to avoid potential issues
      const subjects = await db.collection("subjects").find({}).limit(10).toArray()
      console.log(`[API] Found ${subjects.length} subjects in database`)

      if (subjects.length === 0) {
        console.log("[API] No subjects found in database")
        return NextResponse.json({
          success: true,
          message: "No subjects found in database",
          subjects: [], // No fallback subjects
        })
      }

      // Convert ObjectIds to strings for JSON serialization
      const serializedSubjects = subjects.map((subject) => ({
        ...subject,
        _id: subject._id.toString(),
        // Only convert IDs that exist
        ...(subject.classId && { classId: subject.classId.toString() }),
        ...(subject.teacherId && { teacherId: subject.teacherId.toString() }),
        ...(subject.createdBy && { createdBy: subject.createdBy.toString() }),
      }))

      return NextResponse.json({
        success: true,
        subjects: serializedSubjects,
      })
    } catch (queryError) {
      console.error("[API] Error querying subjects collection:", queryError)
      return NextResponse.json({
        success: false,
        error: `Error querying subjects: ${queryError.message}`,
        subjects: [], // No fallback subjects
      })
    }
  } catch (error) {
    console.error("[API] Student subjects GET error:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error: " + error.message,
      subjects: [], // No fallback subjects
    })
  }
}

export const dynamic = "force-dynamic"
