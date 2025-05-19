import { NextResponse } from "next/server"
import { getSession } from "../../../lib/server-auth"
import { connectToDatabase } from "../../../lib/mongodb"


// Get users (filtered by role if specified)
export async function GET(request) {
  try {
    const user = await getSession()

    if (!user || user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")

    try {
      const { db } = await connectToDatabase()

      const query = role ? { role } : {}

      const users = await db
        .collection("users")
        .find(query)
        .project({ password: 0 }) // Exclude password
        .toArray()

      return NextResponse.json({ students: users })
    } catch (dbError) {
      console.error("[API] Users DB error:", dbError)
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }
  } catch (error) {
    console.error("[API] Users GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
