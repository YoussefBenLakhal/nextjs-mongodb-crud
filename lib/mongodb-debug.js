import { MongoClient } from "mongodb"

// Connection URI
const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || ""

// Connection options with debug logging
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  loggerLevel: "debug", // Enable detailed logging
}

console.log(`[MongoDB Debug] Attempting to connect to: ${uri ? uri.substring(0, 15) + "..." : "Not set"}`)
console.log(`[MongoDB Debug] Database name: ${dbName}`)

// Create a new MongoClient
const client = new MongoClient(uri, options)

export async function testMongoConnection() {
  try {
    console.log("[MongoDB Debug] Connecting to MongoDB...")
    await client.connect()
    console.log("[MongoDB Debug] Successfully connected to MongoDB server")

    const db = client.db(dbName)
    console.log(`[MongoDB Debug] Successfully connected to database: ${dbName}`)

    // Test a simple query
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map((c) => c.name)
    console.log(`[MongoDB Debug] Available collections: ${collectionNames.join(", ") || "No collections found"}`)

    // Close the connection
    await client.close()
    console.log("[MongoDB Debug] Connection closed")

    return {
      success: true,
      database: {
        name: dbName,
        collections: collectionNames,
        connected: true,
      },
    }
  } catch (error) {
    console.error("[MongoDB Debug] Connection error:", error)
    return {
      success: false,
      error: error.message,
      stack: error.stack,
      details: {
        name: error.name,
        code: error.code,
        codeName: error.codeName,
      },
    }
  }
}

// Create a debug endpoint to test the connection
export async function debugMongoDB() {
  const result = await testMongoConnection()
  return result
}
