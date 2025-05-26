import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[DEBUG-ENV] Checking environment variables...")

    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI ? "SET" : "NOT SET",
      MONGODB_URI_LENGTH: process.env.MONGODB_URI?.length || 0,
      MONGODB_URI_PREVIEW: process.env.MONGODB_URI?.substring(0, 30) + "...",
      MONGODB_DB: process.env.MONGODB_DB,
      JWT_SECRET: process.env.JWT_SECRET ? "SET" : "NOT SET",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET" : "NOT SET",
      ALL_MONGO_VARS: Object.keys(process.env).filter((key) => key.includes("MONGO")),
    }

    console.log("[DEBUG-ENV] Environment info:", envInfo)

    return NextResponse.json(envInfo)
  } catch (error) {
    console.error("[DEBUG-ENV] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
