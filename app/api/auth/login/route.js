import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { authenticateUser } from "../../../../lib/auth-utils" // Use your existing auth utility

export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json()
    console.log("[AUTH] Login attempt for:", body.email)

    const { email, password } = body

    try {
      // Use your existing authentication function
      const user = await authenticateUser(email, password)

      // Normalize role
      const role = (user.role || "student").toLowerCase()

      // Create JWT token payload
      const tokenPayload = {
        id: user._id,
        name: user.name || email.split("@")[0],
        email: user.email,
        role: role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
      }

      // Generate JWT token
      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET)

      console.log("[AUTH] JWT token generated for user:", {
        email: user.email,
        role: role,
      })

      // Set session cookie with JWT token
      const cookieStore = cookies()
      cookieStore.set({
        name: "session", // IMPORTANT: Use "session" to match your middleware
        value: token,
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        sameSite: "lax", // Important for cross-site requests
      })

      console.log("[AUTH] Session cookie set successfully")

      // Also set a non-httpOnly cookie for client-side access
      cookieStore.set({
        name: "user_info",
        value: JSON.stringify({
          isLoggedIn: true,
          role: role,
          name: user.name || email.split("@")[0],
        }),
        httpOnly: false,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        sameSite: "lax",
      })

      console.log("[AUTH] Login successful for:", email, "with role:", role)

      // Return user data
      return NextResponse.json({
        user: {
          id: user._id,
          email: user.email,
          role: role,
        },
        token: token, // Include token in response for client-side storage
      })
    } catch (authError) {
      console.error("[AUTH] Authentication error:", authError.message)
      return NextResponse.json({ error: authError.message }, { status: 401 })
    }
  } catch (error) {
    console.error("[AUTH] Login API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Ensure this route is not cached
export const dynamic = "force-dynamic"
