import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("[AUTH-LOGOUT] Processing logout...")

    const response = NextResponse.json({ message: "Logged out successfully" })

    // Clear the auth cookie
    response.cookies.set("authToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    console.log("[AUTH-LOGOUT] Logout successful")
    return response
  } catch (error) {
    console.error("[AUTH-LOGOUT] Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
