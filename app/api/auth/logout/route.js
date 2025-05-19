import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    console.log("[LOGOUT-API] Processing logout request")

    // Clear the session cookie
    const cookieStore = cookies()
    cookieStore.set({
      name: "session",
      value: "",
      expires: new Date(0),
      path: "/",
    })

    // Clear the user_info cookie
    cookieStore.set({
      name: "user_info",
      value: "",
      expires: new Date(0),
      path: "/",
    })

    console.log("[LOGOUT-API] Cookies cleared successfully")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[LOGOUT-API] Logout API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Ensure this route is not cached
export const dynamic = "force-dynamic"
