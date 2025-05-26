import { NextResponse } from "next/server"
import { getDatabase } from "../../../lib/mongodb"

export async function GET() {
  try {
    console.log("Test DB API - Testing database connection...")

    const db = await getDatabase()

    // Test the connection by listing collections
    const collections = await db.listCollections().toArray()

    console.log("Test DB API - Connection successful")

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      database: {
        name: db.databaseName,
        collections: collections.map((col) => col.name),
      },
    })
  } catch (error) {
    console.error("Test DB API - Connection failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: {
          mongoUri: process.env.MONGODB_URI ? "Set" : "Not set",
          mongoDb: process.env.MONGODB_DB || "Not set",
        },
      },
      { status: 500 },
    )
  }
}
