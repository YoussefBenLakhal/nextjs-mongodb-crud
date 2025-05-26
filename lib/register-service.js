export async function clientRegister(credentials) {
  try {
    console.log("[REGISTER-SERVICE] Attempting registration for:", credentials.email)

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Registration failed")
    }

    console.log("[REGISTER-SERVICE] Registration successful for:", credentials.email)
    return data
  } catch (error) {
    console.error("[REGISTER-SERVICE] Registration error:", error)
    throw error
  }
}
