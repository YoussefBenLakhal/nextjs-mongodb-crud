import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export async function GET(request) {
  try {
    console.log("[SESSION-API] Checking session")

    // Get the session cookie
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      console.log("[SESSION-API] No session cookie found")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    try {
      // Verify the JWT token
      const decoded = jwt.verify(sessionCookie.value, process.env.JWT_SECRET)

      console.log("[SESSION-API] JWT verified for user:", decoded.email)

      // Return user data
      return NextResponse.json({
        user: {
          id: decoded.id,
          name: decoded.name,
          email: decoded.email,
          role: decoded.role,
        },
      })
    } catch (error) {
      console.error("[SESSION-API] JWT verification error:", error)
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }
  } catch (error) {
    console.error("[SESSION-API] Session API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Ensure this route is not cached
export const dynamic = "force-dynamic"
