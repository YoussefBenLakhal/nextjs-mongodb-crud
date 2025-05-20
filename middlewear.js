import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Log all API requests for debugging
  if (pathname.startsWith("/api/")) {
    console.log(`[Middleware] ${request.method} ${pathname}`)
  }

  // Add debugging
  console.log("[Middleware] Processing path:", pathname)

  const publicPaths = [
    "/login",
    "/register",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/session",
    "/api/test-session",
    "/api/subjects", // Add public subjects endpoint to public paths
    "/api/seed-subjects", // Add seed subjects endpoint to public paths
    "/unauthorized", // Add this to prevent redirect loops
  ]

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    console.log("[Middleware] Public path, skipping auth check")
    return NextResponse.next()
  }

  try {
    // For API routes, check Authorization header or cookies
    if (pathname.startsWith("/api")) {
      console.log("[Middleware] API route detected:", pathname)

      // Get cookies from request
      const cookieHeader = request.headers.get("cookie")
      if (!cookieHeader) {
        console.log("[Middleware] No cookies found in request")
        throw new Error("No cookies found")
      }

      // Parse cookies manually
      const cookies = parseCookies(cookieHeader)
      const token = cookies.session

      if (!token) {
        console.log("[Middleware] No session cookie found")
        throw new Error("Missing session cookie")
      }

      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // Add user info to headers
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set("x-user-id", decoded.id)
        requestHeaders.set("x-user-role", decoded.role)
        requestHeaders.set("x-user-email", decoded.email)

        // Return the modified request
        return NextResponse.next({
          request: {
            ...request,
            headers: requestHeaders,
          },
        })
      } catch (jwtError) {
        console.error("[Middleware] JWT verification error:", jwtError.message)
        throw new Error(`Invalid token: ${jwtError.message}`)
      }
    }

    // For page routes
    return NextResponse.next()
  } catch (error) {
    console.error("[Middleware] Auth middleware error:", error.message)

    // Don't redirect API routes, just return 401
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized", details: error.message }, { status: 401 })
    }

    // Only redirect to /unauthorized if not already there
    if (!pathname.startsWith("/unauthorized")) {
      const url = new URL("/unauthorized", request.url)
      url.searchParams.set("reason", error.message)
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  }
}

// Helper function to parse cookies
function parseCookies(cookieHeader) {
  const list = {}
  if (!cookieHeader) return list

  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=")
    const name = parts.shift().trim()
    const value = decodeURIComponent(parts.join("="))
    list[name] = value
  })

  return list
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
