import { MongoClient } from "mongodb"

// MongoDB connection utility
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/school-management"
let client = null
let dbConnection = null
let isConnecting = false

// This function creates a new client and connects to the server
export async function connectToDatabase() {
  try {
    // If we already have a connection, return it
    if (dbConnection) {
      return { db: dbConnection, client }
    }

    // If we're in the process of connecting, wait until it's done
    if (isConnecting) {
      console.log("[MongoDB] Connection already in progress, waiting...")
      // Wait a bit and check again
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return connectToDatabase()
    }

    console.log("[MongoDB] Establishing new connection to MongoDB...")
    isConnecting = true

    // Create a new client
    client = new MongoClient(uri, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Server selection timeout
      socketTimeoutMS: 45000, // Socket timeout
    })

    // Connect to the MongoDB server
    await client.connect()
    console.log("[MongoDB] Successfully connected to MongoDB server")

    // Get the database
    const dbName = new URL(uri).pathname.substring(1) || "school-management"
    dbConnection = client.db(dbName)

    // Test the connection with a ping
    await dbConnection.command({ ping: 1 })
    console.log("[MongoDB] Database connection verified with ping")

    isConnecting = false
    return { db: dbConnection, client }
  } catch (error) {
    console.error("[MongoDB] Connection error:", error)
    isConnecting = false
    dbConnection = null

    if (client) {
      try {
        await client.close()
      } catch (closeError) {
        console.error("[MongoDB] Error closing client after failed connection:", closeError)
      }
      client = null
    }

    throw new Error(`Failed to connect to MongoDB: ${error.message}`)
  }
}

// Add a function to check the connection
export async function checkDatabaseConnection() {
  try {
    if (!dbConnection) {
      console.log("[MongoDB] No existing connection, establishing new connection for check...")
      await connectToDatabase()
    }

    // Try a simple operation to verify the connection
    await dbConnection.command({ ping: 1 })
    return { connected: true, message: "Database connection is healthy" }
  } catch (error) {
    console.error("[MongoDB] Connection check failed:", error)
    return { connected: false, error: error.message }
  }
}

// Add a function to check the database connection status:
export async function getDatabaseStatus() {
  try {
    if (!dbConnection) {
      return {
        connected: false,
        message: "No active database connection",
      }
    }

    // Try a simple operation to verify the connection
    await dbConnection.command({ ping: 1 })

    return {
      connected: true,
      message: "Database connection is healthy",
      dbName: dbConnection.databaseName,
    }
  } catch (error) {
    console.error("[MongoDB] Connection status check failed:", error)
    return {
      connected: false,
      error: error.message,
      stack: error.stack,
    }
  }
}

// Add a graceful shutdown function
export async function closeDatabaseConnection() {
  try {
    if (client) {
      await client.close()
      dbConnection = null
      client = null
      console.log("[MongoDB] Connection closed")
    }
  } catch (error) {
    console.error("[MongoDB] Error closing connection:", error)
  }
}

// Handle process termination
if (typeof process !== "undefined") {
  const cleanup = async () => {
    console.log("[MongoDB] Process terminating, closing connection...")
    await closeDatabaseConnection()
  }

  process.on("SIGINT", async () => {
    await cleanup()
    process.exit(0)
  })

  process.on("SIGTERM", async () => {
    await cleanup()
    process.exit(0)
  })

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    console.error("[MongoDB] Unhandled Rejection at:", promise, "reason:", reason)
  })
}
