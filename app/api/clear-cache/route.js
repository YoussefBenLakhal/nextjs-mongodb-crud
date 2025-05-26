import { NextResponse } from "next/server"
import { getSession } from "../../../lib/server-auth"

export async function POST(request) {
  try {
    console.log("[API] POST /api/clear-cache - Clearing server cache")

    // Get user from session
    const user = await getSession()

    if (!user) {
      console.log("[API] No user in session")
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 })
    }

    const userRole = user.role

    // Only teachers and admins can clear cache
    if (userRole !== "teacher" && userRole !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Only teachers and admins can clear cache" }, { status: 401 })
    }

    // In a real application, you would clear any server-side caches here
    // For example, Redis cache, in-memory cache, etc.

    // For this example, we'll just return success
    return NextResponse.json({
      success: true,
      message: "Server cache cleared successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[API] Clear cache error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
