import { NextResponse } from "next/server"
import { verifyToken } from "../../../../lib/auth-utils"
import { getCollection } from "../../../../lib/mongodb"

// Add a simple cache to prevent repeated database queries for the same user
const userCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function GET(request) {
  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get("authorization")
    const cookieToken = request.cookies.get("authToken")?.value

    const token = authHeader?.replace("Bearer ", "") || cookieToken

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    console.log("[AUTH-VERIFY] Verifying token...")

    // Verify JWT token
    const decoded = verifyToken(token)

    console.log("[AUTH-VERIFY] Token valid for user:", decoded.email)

    // Check cache first to avoid repeated database queries
    const cacheKey = `${decoded.id}-${decoded.email}`
    const cachedUser = userCache.get(cacheKey)

    if (cachedUser && Date.now() - cachedUser.timestamp < CACHE_TTL) {
      console.log("[AUTH-VERIFY] Using cached user data")
      return NextResponse.json({
        user: cachedUser.user,
      })
    }

    console.log("[AUTH-VERIFY] Fetching fresh user data from database")

    // Get fresh user data from database
    const usersCollection = await getCollection("users")

    // Use string-based query instead of ObjectId to avoid import issues
    let userQuery

    // Try ObjectId first, fallback to string query
    try {
      if (decoded.id && typeof decoded.id === "string" && decoded.id.length === 24) {
        // Try to create ObjectId
        const { ObjectId: MongoObjectId } = await import("mongodb")
        userQuery = { _id: new MongoObjectId(decoded.id) }
        console.log("[AUTH-VERIFY] Using ObjectId query")
      } else {
        // Fallback to string query
        userQuery = { _id: decoded.id }
        console.log("[AUTH-VERIFY] Using string ID query")
      }
    } catch (error) {
      console.log("[AUTH-VERIFY] ObjectId creation failed, using string query:", error.message)
      userQuery = { _id: decoded.id }
    }

    console.log("[AUTH-VERIFY] Querying user with:", userQuery)

    const user = await usersCollection.findOne(userQuery, { projection: { password: 0 } })

    if (!user) {
      console.log("[AUTH-VERIFY] User not found in database for ID:", decoded.id)

      // Try alternative query methods
      console.log("[AUTH-VERIFY] Trying alternative queries...")

      // Try by email as fallback
      const userByEmail = await usersCollection.findOne({ email: decoded.email }, { projection: { password: 0 } })

      if (userByEmail) {
        console.log("[AUTH-VERIFY] Found user by email instead")

        const userData = {
          id: userByEmail._id.toString(),
          email: userByEmail.email,
          name: userByEmail.name,
          role: userByEmail.role,
        }

        // Cache the result
        userCache.set(cacheKey, {
          user: userData,
          timestamp: Date.now(),
        })

        return NextResponse.json({ user: userData })
      }

      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    console.log("[AUTH-VERIFY] User verification successful:", user.email)

    const userData = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    }

    // Cache the result
    userCache.set(cacheKey, {
      user: userData,
      timestamp: Date.now(),
    })

    return NextResponse.json({ user: userData })
  } catch (error) {
    console.error("[AUTH-VERIFY] Token verification error:", error)
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
}
