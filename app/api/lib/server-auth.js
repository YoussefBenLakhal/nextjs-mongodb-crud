import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

// Gets the user data from the JWT token
export async function getSession() {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get("session") // Use "session" to match middleware

    console.log("[SERVER-AUTH] Checking for session cookie:", !!sessionCookie)

    if (!sessionCookie) {
      return null
    }

    try {
      // Verify and decode the JWT token
      const decoded = jwt.verify(sessionCookie.value, process.env.JWT_SECRET)

      console.log("[SERVER-AUTH] JWT token verified:", {
        id: decoded.id,
        role: decoded.role,
      })

      return {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
      }
    } catch (error) {
      console.error("[SERVER-AUTH] Error verifying JWT token:", error)
      return null
    }
  } catch (error) {
    console.error("[SERVER-AUTH] Error accessing cookies:", error)
    return null
  }
}

// For compatibility with libraries expecting getServerSession
export async function getServerSession() {
  const user = await getSession()

  if (!user) {
    console.log("[SERVER-AUTH] No valid user in getServerSession")
    return null
  }

  console.log("[SERVER-AUTH] Returning formatted session:", {
    role: user.role,
  })

  return {
    user: user,
  }
}
