import { cookies } from "next/headers"
import { verifyToken } from "./auth-utils"
import { getCollection } from "./mongodb"

export async function getSession() {
  try {
    console.log("[SERVER-AUTH] Getting session from cookies...")

    const cookieStore = await cookies()
    const token = cookieStore.get("authToken")?.value

    if (!token) {
      console.log("[SERVER-AUTH] No auth token found in cookies")
      return null
    }

    console.log("[SERVER-AUTH] Token found, verifying...")

    // Verify JWT token
    const decoded = verifyToken(token)
    console.log("[SERVER-AUTH] Token valid for user:", decoded.email)

    // Get fresh user data from database
    const usersCollection = await getCollection("users")

    // Try ObjectId first, fallback to string query
    let userQuery
    try {
      if (decoded.id && typeof decoded.id === "string" && decoded.id.length === 24) {
        const { ObjectId } = await import("mongodb")
        userQuery = { _id: new ObjectId(decoded.id) }
      } else {
        userQuery = { _id: decoded.id }
      }
    } catch (error) {
      userQuery = { _id: decoded.id }
    }

    const user = await usersCollection.findOne(userQuery, { projection: { password: 0 } })

    if (!user) {
      console.log("[SERVER-AUTH] User not found in database")

      // Try by email as fallback
      const userByEmail = await usersCollection.findOne({ email: decoded.email }, { projection: { password: 0 } })

      if (userByEmail) {
        console.log("[SERVER-AUTH] Found user by email")
        return {
          id: userByEmail._id.toString(),
          email: userByEmail.email,
          name: userByEmail.name,
          role: userByEmail.role,
        }
      }

      return null
    }

    console.log("[SERVER-AUTH] Session retrieved successfully for:", user.email)

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    }
  } catch (error) {
    console.error("[SERVER-AUTH] Session error:", error)
    return null
  }
}

// Helper function to require authentication
export async function requireAuth(requiredRole = null) {
  const user = await getSession()

  if (!user) {
    throw new Error("Authentication required")
  }

  if (requiredRole && user.role !== requiredRole) {
    throw new Error(`Role ${requiredRole} required`)
  }

  return user
}
