import { NextResponse } from "next/server"

// This endpoint removes hardcoded subjects from the UI by setting a cookie
export async function DELETE(request) {
  try {
    console.log("[API] DELETE /api/delete-hardcoded-subjects - Removing hardcoded subjects")

    // Set a cookie to indicate that hardcoded subjects should be hidden
    // This cookie will be read by the client to avoid showing hardcoded subjects
    const response = NextResponse.json({
      success: true,
      message: "Hardcoded subjects will be hidden",
    })

    // Set a cookie that expires in 1 year
    response.cookies.set("hide_hardcoded_subjects", "true", {
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[API] Error removing hardcoded subjects:", error)
    return NextResponse.json(
      {
        error: "Failed to remove hardcoded subjects",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"
