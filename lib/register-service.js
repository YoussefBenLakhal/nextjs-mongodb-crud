// lib/register-service.js
export async function clientRegister(credentials) {
    try {
      console.log("[REGISTER-SERVICE] Registering new user:", {
        ...credentials,
        password: credentials.password ? "[REDACTED]" : undefined,
      });
  
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        cache: "no-store",
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }
  
      console.log("[REGISTER-SERVICE] Registration successful");
      return data;
    } catch (error) {
      console.error("[REGISTER-SERVICE] Registration error:", error);
      throw error;
    }
  }