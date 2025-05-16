export async function checkSession() {
  try {
    console.log("ClientAuth - Checking session");
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`ClientAuth - Session check failed with status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log("ClientAuth - Session data:", data);
    
    if (!data || data.error) {
      console.log("ClientAuth - Invalid session data:", data?.error || "No data");
      return null;
    }

    return data;
  } catch (error) {
    console.error("ClientAuth - Error checking session:", error);
    return null;
  }
}

// Login function
export async function clientLogin(email, password) {
  try {
    console.log("ClientAuth - Attempting login for:", email);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log("ClientAuth - Login response:", {
      status: response.status,
      ok: response.ok,
      data: { ...data, token: data.token ? '[REDACTED]' : undefined }
    });

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Extract and normalize role
    const role = data.role ? data.role.toLowerCase() : 'student';
    console.log("ClientAuth - Extracted role:", role);

    return {
      ...data,
      role: role // Ensure role is normalized
    };
  } catch (error) {
    console.error("ClientAuth - Login error:", error);
    throw error;
  }
}

// Logout function
export async function clientLogout() {
  try {
    console.log("ClientAuth - Logging out");
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`ClientAuth - Logout failed with status: ${response.status}`);
      return false;
    }

    console.log("ClientAuth - Logout successful");
    return true;
  } catch (error) {
    console.error("ClientAuth - Logout error:", error);
    return false;
  }
}

// Register function
export async function clientRegister(userData) {
  try {
    console.log("ClientAuth - Registering new user:", {
      ...userData,
      password: '[REDACTED]'
    });
    
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    console.log("ClientAuth - Registration response:", {
      status: response.status,
      ok: response.ok,
      data: { ...data, token: data.token ? '[REDACTED]' : undefined }
    });

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    return data;
  } catch (error) {
    console.error("ClientAuth - Registration error:", error);
    throw error;
  }
}