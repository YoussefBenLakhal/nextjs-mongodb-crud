import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { getCollection } from "../../../../lib/mongodb"

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log("NextAuth - Authorize attempt:", {
            email: credentials?.email,
          })

          if (!credentials?.email || !credentials?.password) {
            console.log("NextAuth - Missing credentials")
            return null
          }

          // Get users collection with error handling
          let usersCollection
          try {
            usersCollection = await getCollection("users")
            console.log("NextAuth - Successfully connected to users collection")
          } catch (dbError) {
            console.error("NextAuth - Database connection error:", dbError)
            throw new Error("Database connection failed")
          }

          // Find user by email
          const user = await usersCollection.findOne({
            email: credentials.email.toLowerCase(),
          })

          console.log("NextAuth - User found:", user ? "Yes" : "No")
          if (user) {
            console.log("NextAuth - User details:", {
              email: user.email,
              role: user.role,
              hasPassword: !!user.password,
            })
          }

          if (!user) {
            console.log("NextAuth - User not found")
            return null
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          console.log("NextAuth - Password valid:", isPasswordValid)

          if (!isPasswordValid) {
            console.log("NextAuth - Invalid password")
            return null
          }

          // Return user object
          const userObject = {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          }

          console.log("NextAuth - Authentication successful:", userObject)
          return userObject
        } catch (error) {
          console.error("NextAuth - Authorization error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
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
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST, authOptions }
