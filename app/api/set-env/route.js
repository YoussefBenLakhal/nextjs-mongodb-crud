import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request) {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        {
          success: false,
          error: "This endpoint is only available in development mode",
        },
        { status: 403 },
      )
    }

    // Get the environment variables from the request
    const data = await request.json()

    // Validate required fields
    const requiredFields = ["MONGODB_URI", "JWT_SECRET", "NEXTAUTH_SECRET"]
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required field: ${field}`,
          },
          { status: 400 },
        )
      }
    }

    // Create the .env.local file content
    let envContent = ""
    for (const [key, value] of Object.entries(data)) {
      if (value) {
        envContent += `${key}=${value}\n`
      }
    }

    // Write to .env.local file
    const envFilePath = path.join(process.cwd(), ".env.local")
    fs.writeFileSync(envFilePath, envContent)

    console.log("[API] Environment variables set successfully")

    return NextResponse.json({
      success: true,
      message: "Environment variables set successfully",
    })
  } catch (error) {
    console.error("[API] Error setting environment variables:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while setting environment variables",
      },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"
