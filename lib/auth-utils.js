// Authentication utilities
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { connectToDatabase } from "./mongodb"
import { ObjectId } from "mongodb"

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key"

// Authenticate a user with email and password
export async function authenticateUser(email, password) {
  try {
    console.log("[AUTH-UTILS] Authenticating user:", email)

    const { db } = await connectToDatabase()

    // Find user by email
    const user = await db.collection("users").findOne({ email: email.toLowerCase() })

    if (!user) {
      console.log("[AUTH-UTILS] User not found:", email)
      throw new Error("Invalid email or password")
    }

    console.log("[AUTH-UTILS] User found:", { email: user.email, role: user.role })

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      console.log("[AUTH-UTILS] Invalid password for:", email)
      throw new Error("Invalid email or password")
    }

    console.log("[AUTH-UTILS] Password valid for:", email)

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    )

    // Return user data without password
    const userData = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    }

    console.log("[AUTH-UTILS] Authentication successful for:", email)

    return {
      user: userData,
      token,
    }
  } catch (error) {
    console.error("[AUTH-UTILS] Authentication error:", error)
    throw error
  }
}

// Register a new user
export async function createUser(userData) {
  try {
    console.log("[AUTH-UTILS] Creating user:", userData.email)

    const { db } = await connectToDatabase()

    // Check if email already exists
    const existingUser = await db.collection("users").findOne({ email: userData.email.toLowerCase() })

    if (existingUser) {
      throw new Error("Email already in use")
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10)

    // Create user
    const result = await db.collection("users").insertOne({
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      role: userData.role?.toLowerCase() || "student",
      name: userData.name || userData.email.split("@")[0], // Use email prefix as name
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    console.log("[AUTH-UTILS] User created successfully:", result.insertedId)

    return {
      id: result.insertedId.toString(),
      email: userData.email.toLowerCase(),
      name: userData.name || userData.email.split("@")[0],
      role: userData.role?.toLowerCase() || "student",
    }
  } catch (error) {
    console.error("[AUTH-UTILS] User creation error:", error)
    throw error
  }
}

// Verify JWT token
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded
  } catch (error) {
    console.error("[AUTH-UTILS] Token verification error:", error)
    throw new Error("Invalid token")
  }
}

// Get user by ID
export async function getUserById(id) {
  try {
    const { db } = await connectToDatabase()

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }, // Exclude password
    )

    return user
  } catch (error) {
    console.error("[AUTH-UTILS] Get user error:", error)
    throw error
  }
}
