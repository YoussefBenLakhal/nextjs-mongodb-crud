// Login function
export async function clientLogin(email, password) {
  try {
    console.log("[CLIENT-AUTH] Attempting login for:", email)

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store", // Important: Prevent caching
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || "Login failed")
    }

    const data = await response.json()
    console.log("[CLIENT-AUTH] Login response:", {
      status: response.status,
      ok: response.ok,
      hasToken: !!data.token,
      user: data.user
        ? {
            ...data.user,
            role: data.user.role,
          }
        : null,
    })

    // Store token in localStorage
    if (data.token) {
      localStorage.setItem("authToken", data.token)
      console.log("[CLIENT-AUTH] Token stored in localStorage")
    }

    // Extract and normalize role
    const role = data.user?.role ? data.user.role.toLowerCase() : "student"
    console.log("[CLIENT-AUTH] Extracted role:", role)

    return {
      ...data,
      user: {
        ...data.user,
        role: role, // Ensure role is normalized
      },
    }
  } catch (error) {
    console.error("[CLIENT-AUTH] Login error:", error)
    throw error
  }
}

// Check session function
export async function checkSession() {
  try {
    console.log("[CLIENT-AUTH] Checking session")

    // Get token from localStorage
    const token = localStorage.getItem("authToken")
    if (!token) {
      console.log("[CLIENT-AUTH] No token found in localStorage")
      return null
    }

    console.log("[CLIENT-AUTH] Found token in localStorage, verifying...")

    const response = await fetch("/api/auth/verify", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store", // Important: Prevent caching
    })

    if (!response.ok) {
      console.log(`[CLIENT-AUTH] Session check failed with status: ${response.status}`)
      localStorage.removeItem("authToken") // Clear invalid token
      return null
    }

    const data = await response.json()
    console.log("[CLIENT-AUTH] Session data:", {
      hasUser: !!data.user,
      role: data.user?.role,
    })

    if (!data || data.error) {
      console.log("[CLIENT-AUTH] Invalid session data:", data?.error || "No data")
      return null
    }

    return data
  } catch (error) {
    console.error("[CLIENT-AUTH] Error checking session:", error)
    return null
  }
}

// Logout function
export async function clientLogout() {
  try {
    console.log("[CLIENT-AUTH] Logging out")

    // Clear localStorage
    localStorage.removeItem("authToken")

    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // Important: Prevent caching
    })

    if (!response.ok) {
      console.log(`[CLIENT-AUTH] Logout failed with status: ${response.status}`)
      return false
    }

    console.log("[CLIENT-AUTH] Logout successful")
    return true
  } catch (error) {
    console.error("[CLIENT-AUTH] Logout error:", error)
    return false
  }
}

// Register function
export async function clientRegister(credentials) {
  try {
    console.log("[CLIENT-AUTH] Registering new user:", {
      ...credentials,
      password: credentials.password ? "[REDACTED]" : undefined,
    })

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      cache: "no-store", // Important: Prevent caching
    })

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type")
    if (!contentType?.includes("application/json")) {
      const text = await response.text()
      throw new Error(text || "Invalid server response")
    }

    const data = await response.json()

    if (!response.ok) {
      // Handle specific status codes
      const errorMap = {
        409: "This email is already registered",
        400: "Invalid registration data",
        500: "Server error - please try later",
      }

      throw new Error(errorMap[response.status] || data.error || "Registration failed")
    }

    console.log("[CLIENT-AUTH] Registration successful")
    return data
  } catch (error) {
    console.error("[CLIENT-AUTH] Registration error:", error)
    throw new Error(error.message) // Propagate meaningful error
  }
}
