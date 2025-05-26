import { NextResponse } from "next/server"
import { authenticateUser } from "../../../../lib/auth-utils"

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    console.log("[AUTH] Login attempt for:", email)

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const result = await authenticateUser(email, password)

    console.log("[AUTH] Login successful for:", email)

    // Create response with token in cookie
    const response = NextResponse.json({
      message: "Login successful",
      user: result.user,
      token: result.token,
    })

    // Set HTTP-only cookie for server-side auth
    response.cookies.set("authToken", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[AUTH] Authentication error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}
