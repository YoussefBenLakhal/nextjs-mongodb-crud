import { NextResponse } from "next/server"
import { connectToDatabase, getConnectionStatus } from "../../../app/lib/mongodb"

export async function GET() {
  console.log("[API] GET /api/test-db - Testing database connection")

  try {
    // Get the connection status first
    const connectionStatus = getConnectionStatus()
    console.log("[API] Current connection status:", connectionStatus)

    // Try to connect to the database
    const { db, isConnected, error } = await connectToDatabase()

    if (!isConnected) {
      console.error("[API] Database connection failed:", error)
      return NextResponse.json(
        {
          success: false,
          error: error || "Failed to connect to MongoDB",
          timestamp: new Date().toISOString(),
          database: {
            status: "disconnected",
            error: error || "Unknown error",
          },
        },
        { status: 500 },
      )
    }

    // Get database information
    const databaseName = db.databaseName

    // Get collection names
    let collections = []
    try {
      collections = await db.listCollections().toArray()
      collections = collections.map((col) => col.name)
    } catch (err) {
      console.error("[API] Error listing collections:", err)
    }

    // Get a sample document from a collection if available
    let sampleDocument = null
    if (collections.length > 0) {
      try {
        // Try to get a sample from users collection first, or use the first available collection
        const collectionName = collections.includes("users") ? "users" : collections[0]
        sampleDocument = await db.collection(collectionName).findOne({})
      } catch (err) {
        console.error("[API] Error getting sample document:", err)
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        name: databaseName,
        status: "connected",
        collections,
        sampleDocument,
      },
    })
  } catch (error) {
    console.error("[API] Database test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while testing the database connection",
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"
