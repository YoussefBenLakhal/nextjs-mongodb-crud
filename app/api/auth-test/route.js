import { NextResponse } from "next/server"
import { getSession } from "../../lib/server-auth.js"

export async function GET() {
  try {
    console.log("[API] GET /api/auth-test - Testing authentication")

    // Get user from session
    const user = await getSession()

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json({
        authenticated: false,
        message: "Not authenticated",
        error: "No user in session",
      })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        role: user.role,
        // Don't include sensitive information
      },
      message: "Authentication successful",
    })
  } catch (error) {
    console.error("[API] Auth test error:", error)
    return NextResponse.json({
      authenticated: false,
      error: "Authentication error",
      details: error.message,
    })
  }
}

export const dynamic = "force-dynamic"
