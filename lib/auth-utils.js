// Authentication utilities
import bcrypt from "bcryptjs"
import { connectToDatabase } from "./mongodb"
import { ObjectId } from "mongodb"

// Authenticate a user with email and password
export async function authenticateUser(email, password) {
  try {
    const { db } = await connectToDatabase()

    // Find user by email
    const user = await db.collection("users").findOne({ email })

    if (!user) {
      throw new Error("Invalid email or password")
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      throw new Error("Invalid email or password")
    }

    return user
  } catch (error) {
    console.error("Authentication error:", error)
    throw error
  }
}

// Register a new user
export async function registerUser(email, password, role = "student") {
  try {
    const { db } = await connectToDatabase()

    // Check if email already exists
    const existingUser = await db.collection("users").findOne({ email })

    if (existingUser) {
      throw new Error("Email already in use")
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const result = await db.collection("users").insertOne({
      email,
      password: hashedPassword,
      role: role.toLowerCase(),
      name: email.split("@")[0], // Use email prefix as name
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return result.insertedId
  } catch (error) {
    console.error("Registration error:", error)
    throw error
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
    console.error("Get user error:", error)
    throw error
  }
}
