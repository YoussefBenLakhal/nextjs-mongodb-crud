import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "./mongodb"
import { ObjectId } from "mongodb"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        try {
          const { db } = await connectToDatabase()
          
          // Find user in database
          const user = await db.collection("users").findOne({
            email: credentials.email.toLowerCase()
          })

          if (!user) {
            throw new Error("No user found with this email")
          }

          // Check password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          
          if (!isPasswordValid) {
            throw new Error("Invalid password")
          }

          // Return user object
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error("Auth error:", error)
          throw new Error("Authentication failed")
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
    signUp: "/register",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
