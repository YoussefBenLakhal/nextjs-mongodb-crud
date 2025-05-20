import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

// Gets the user data from the JWT token
export async function getSession() {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get("session") // Use "session" to match middleware

    if (!sessionCookie || !sessionCookie.value) {
      return null
    }

    try {
      // Verify and decode the JWT token
      const decoded = jwt.verify(sessionCookie.value, process.env.JWT_SECRET)

      return {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
      }
    } catch (error) {
      return null
    }
  } catch (error) {
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
