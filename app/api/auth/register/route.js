import { NextResponse } from "next/server"
import { authenticateUser } from "../../../../lib/auth-utils"

export async function POST(request) {
  try {
    const userData = await request.json()

    console.log("[AUTH] Registration attempt for:", userData.email)

    if (!userData.email || !userData.password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (!userData.role || !["student", "teacher"].includes(userData.role)) {
      return NextResponse.json({ error: "Valid role is required" }, { status: 400 })
    }

    const result = await createUser(userData)

    console.log("[AUTH] Registration successful for:", userData.email)

    return NextResponse.json({
      message: "Registration successful",
      user: result,
    })
  } catch (error) {
    console.error("[AUTH] Registration error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
