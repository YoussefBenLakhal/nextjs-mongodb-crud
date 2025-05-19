import { MongoClient } from "mongodb"

// Connection URI
const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || "school-management"

// Connection options
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
}

// Cache client promise
let clientPromise
let isConnected = false
let connectionError = null

// Log connection status
console.log(`[MongoDB] URI: ${uri ? "Set (hidden for security)" : "Not set"}`)
console.log(`[MongoDB] Database: ${dbName || "Not set"}`)

if (!uri) {
  connectionError = new Error("MongoDB URI is not defined in environment variables")
  console.error("[MongoDB] Error:", connectionError.message)
}

// Create a new MongoClient
const client = uri ? new MongoClient(uri, options) : null

// Create and cache the client promise
if (process.env.NODE_ENV === "development" && client) {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = client
      .connect()
      .then((client) => {
        console.log("[MongoDB] Connected to MongoDB in development mode")
        isConnected = true
        return client
      })
      .catch((err) => {
        console.error("[MongoDB] Failed to connect in development mode:", err)
        connectionError = err
        throw err
      })
  }
  clientPromise = global._mongoClientPromise
} else if (client) {
  // In production mode, it's best to not use a global variable.
  clientPromise = client
    .connect()
    .then((client) => {
      console.log("[MongoDB] Connected to MongoDB in production mode")
      isConnected = true
      return client
    })
    .catch((err) => {
      console.error("[MongoDB] Failed to connect in production mode:", err)
      connectionError = err
      throw err
    })
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export async function connectToDatabase() {
  try {
    if (!uri) {
      throw new Error("MongoDB URI is not defined in environment variables")
    }

    if (connectionError) {
      console.error("[MongoDB] Using connectToDatabase with existing error:", connectionError.message)
      throw connectionError
    }

    const client = await clientPromise
    const db = client.db(dbName)

    return { client, db, isConnected: true }
  } catch (error) {
    console.error("[MongoDB] Connection error in connectToDatabase:", error)

    // Return a special object that indicates connection failure
    // This allows the calling code to handle the error gracefully
    return {
      client: null,
      db: null,
      isConnected: false,
      error: error.message || "Failed to connect to MongoDB",
    }
  }
}

// Export connection status
export function getConnectionStatus() {
  return {
    isConnected,
    error: connectionError ? connectionError.message : null,
    uri: uri ? "Set (hidden for security)" : "Not set",
    dbName,
  }
}

// Export direct client promise for advanced use cases
export { clientPromise }
