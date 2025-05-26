import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../[...nextauth]/route"

export async function GET() {
  try {
    console.log("Session API - Checking session...")

    const session = await getServerSession(authOptions)

    if (!session) {
      console.log("Session API - No session found")
      return NextResponse.json({ user: null }, { status: 200 })
    }

    console.log("Session API - Session found:", {
      email: session.user?.email,
      role: session.user?.role,
    })

    return NextResponse.json(
      {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Session API - Error:", error)
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 })
  }
}
