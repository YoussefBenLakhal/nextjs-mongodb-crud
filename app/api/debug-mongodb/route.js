import { NextResponse } from "next/server"
import { connectToDatabase, getConnectionStatus } from "@/app/lib/mongodb"

export async function GET() {
  console.log("[API] GET /api/debug-mongodb - Debugging MongoDB connection")

  try {
    // Get the current connection status
    const connectionStatus = getConnectionStatus()
    console.log("[API] Current connection status:", connectionStatus)

    // Try to connect to the database
    const { db, isConnected, error } = await connectToDatabase()

    if (!isConnected) {
      console.error("[API] Database connection failed:", error)
      return NextResponse.json({
        connected: false,
        error: error || "Failed to connect to MongoDB",
        timestamp: new Date().toISOString(),
        connectionStatus,
      })
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

    // Get sample documents from collections
    const sampleDocuments = {}
    if (collections.length > 0) {
      try {
        // Get a sample document from each collection (limit to 5 collections)
        const samplesToGet = collections.slice(0, 5)
        for (const collection of samplesToGet) {
          const doc = await db.collection(collection).findOne({})
          if (doc) {
            sampleDocuments[collection] = doc
          }
        }
      } catch (err) {
        console.error("[API] Error getting sample documents:", err)
      }
    }

    // Get environment variables (redacted)
    const envVars = {
      MONGODB_URI: process.env.MONGODB_URI ? "Set (hidden for security)" : "Not set",
      MONGODB_DB: process.env.MONGODB_DB || "Not set",
      NODE_ENV: process.env.NODE_ENV || "Not set",
    }

    return NextResponse.json({
      connected: true,
      timestamp: new Date().toISOString(),
      databaseName,
      collections,
      sampleDocuments,
      connectionStatus,
      environment: envVars,
    })
  } catch (error) {
    console.error("[API] MongoDB debug error:", error)
    return NextResponse.json({
      connected: false,
      error: error.message || "An error occurred while debugging MongoDB connection",
      timestamp: new Date().toISOString(),
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })
  }
}

export const dynamic = "force-dynamic"
