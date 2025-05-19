import { NextResponse } from "next/server"

export async function GET(request) {
  console.log("[API] GET /api/subjects-test - Simple test endpoint")

  // Return a minimal response to test JSON parsing
  return NextResponse.json({
    success: true,
    test: "ok",
    subjects: [
      { _id: "test1", name: "Test Subject 1" },
      { _id: "test2", name: "Test Subject 2" },
    ],
  })
}

export const dynamic = "force-dynamic"
