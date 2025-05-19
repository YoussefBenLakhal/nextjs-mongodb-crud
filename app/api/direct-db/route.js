import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "../../../lib/server-auth"
import { ObjectId } from "mongodb"

export async function POST(request) {
  try {
    console.log("[API] POST /api/direct-db - Executing direct database operation")

    // Get session using your custom auth
    const session = await getServerSession()
    console.log("[API] Session:", session)

    // Check if user is authenticated
    if (!session) {
      console.log("[API] No session found, unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only allow teachers and admins to access direct database operations
    if (session.role !== "teacher" && session.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Only teachers and admins can perform direct database operations" },
        { status: 401 },
      )
    }

    // Get request body
    const body = await request.json()
    const { collection, operation, query } = body

    // Validate required fields
    if (!collection || !operation) {
      return NextResponse.json({ error: "Collection and operation are required" }, { status: 400 })
    }

    // Validate collection name
    const allowedCollections = ["subjects", "classes", "students", "attendance", "assessments"]
    if (!allowedCollections.includes(collection)) {
      return NextResponse.json({ error: "Invalid collection name" }, { status: 400 })
    }

    // Validate operation
    const allowedOperations = ["find", "findOne", "count", "deleteOne", "deleteMany"]
    if (!allowedOperations.includes(operation)) {
      return NextResponse.json({ error: "Invalid operation" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Process query to convert string IDs to ObjectIds where possible
    const processedQuery = processQuery(query)

    // Execute operation
    let result
    switch (operation) {
      case "find":
        result = await db.collection(collection).find(processedQuery).toArray()
        // Convert ObjectIds to strings for JSON serialization
        result = result.map((doc) => serializeDocument(doc))
        break
      case "findOne":
        result = await db.collection(collection).findOne(processedQuery)
        if (result) {
          result = serializeDocument(result)
        }
        break
      case "count":
        result = { count: await db.collection(collection).countDocuments(processedQuery) }
        break
      case "deleteOne":
        result = await db.collection(collection).deleteOne(processedQuery)
        break
      case "deleteMany":
        result = await db.collection(collection).deleteMany(processedQuery)
        break
      default:
        return NextResponse.json({ error: "Unsupported operation" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      operation,
      collection,
      result,
    })
  } catch (error) {
    console.error("[API] Error executing direct database operation:", error)
    return NextResponse.json({ error: `Failed to execute operation: ${error.message}` }, { status: 500 })
  }
}

// Helper function to process query and convert string IDs to ObjectIds where possible
function processQuery(query) {
  if (!query || typeof query !== "object") {
    return query
  }

  const result = {}
  for (const [key, value] of Object.entries(query)) {
    if (key === "_id" && typeof value === "string" && value.length === 24) {
      try {
        result[key] = new ObjectId(value)
      } catch (error) {
        result[key] = value
      }
    } else if (typeof value === "object" && value !== null) {
      result[key] = processQuery(value)
    } else {
      result[key] = value
    }
  }
  return result
}

// Helper function to serialize document for JSON response
function serializeDocument(doc) {
  if (!doc) return doc

  const result = { ...doc }

  // Convert ObjectIds to strings
  if (result._id && typeof result._id.toString === "function") {
    result._id = result._id.toString()
  }

  if (result.classId && typeof result.classId.toString === "function") {
    result.classId = result.classId.toString()
  }

  if (result.teacherId && typeof result.teacherId.toString === "function") {
    result.teacherId = result.teacherId.toString()
  }

  if (result.createdBy && typeof result.createdBy.toString === "function") {
    result.createdBy = result.createdBy.toString()
  }

  if (result.updatedBy && typeof result.updatedBy.toString === "function") {
    result.updatedBy = result.updatedBy.toString()
  }

  return result
}

export const dynamic = "force-dynamic"
