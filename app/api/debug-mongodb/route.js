import { NextResponse } from "next/server"
import { connectToDatabase, getConnectionStatus } from "../../lib/mongodb"

export async function GET(request) {
  try {
    console.log("[API] GET /api/debug-mongodb - Debugging MongoDB connection")

    // Get connection status
    const connectionStatus = getConnectionStatus()

    // Connect to database
    const { db, isConnected, error } = await connectToDatabase()

    if (!isConnected || !db) {
      return NextResponse.json({
        success: false,
        isConnected: false,
        error: error || "Failed to connect to database",
        dbName: connectionStatus.dbName,
        uri: connectionStatus.uri,
        collections: [],
      })
    }

    // Get collections
    const collections = await db.listCollections().toArray()
    const collectionDetails = []

    // Get sample documents from each collection
    for (const collection of collections) {
      try {
        const count = await db.collection(collection.name).countDocuments()
        const sample = await db.collection(collection.name).findOne({})

        // Convert ObjectIds to strings for JSON serialization
        const serializedSample = sample
          ? JSON.parse(
              JSON.stringify(sample, (key, value) => {
                if (key === "_id" || key.endsWith("Id")) {
                  return value.toString()
                }
                return value
              }),
            )
          : null

        collectionDetails.push({
          name: collection.name,
          count,
          sample: serializedSample,
        })
      } catch (err) {
        collectionDetails.push({
          name: collection.name,
          error: err.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      isConnected: true,
      dbName: connectionStatus.dbName,
      uri: connectionStatus.uri,
      collections: collectionDetails,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[API] Debug MongoDB error:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error: " + error.message,
    })
  }
}

export const dynamic = "force-dynamic"
