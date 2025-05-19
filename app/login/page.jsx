"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  useToast,
} from "@chakra-ui/react"
import { clientLogin } from "@/lib/client-auth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()

  // Get redirect path from URL if present
  const redirectPath = searchParams.get("redirect")

  // Reset redirect counter when login page loads
  useEffect(() => {
    sessionStorage.removeItem("auth_redirect_count")
    console.log("[LOGIN] Page loaded, redirect path:", redirectPath || "none")
  }, [redirectPath])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    // Validate inputs
    if (!email || !password) {
      setError("Email and password are required")
      return
    }

    try {
      setLoading(true)
      console.log("[LOGIN] Submitting login with:", { email, password: "***" })

      const userData = await clientLogin(email, password)

      console.log("[LOGIN] Login successful:", {
        ...userData,
        token: userData.token ? "[REDACTED]" : undefined,
      })

      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.user?.name || email}!`,
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      // Store token in localStorage if needed for client-side auth
      if (userData.token) {
        localStorage.setItem("authToken", userData.token)
      }

      // Determine where to redirect
      let targetPath = ""

      if (redirectPath) {
        console.log("[LOGIN] Redirecting to:", redirectPath)
        targetPath = redirectPath
      } else {
        // Otherwise, redirect based on role
        const role = userData.user?.role?.toLowerCase()
        console.log("[LOGIN] User role for redirect:", role)

        if (role === "teacher") {
          console.log("[LOGIN] Redirecting to teacher dashboard")
          targetPath = "/teacher-dashboard"
        } else if (role === "student") {
          console.log("[LOGIN] Redirecting to student dashboard")
          targetPath = "/student-dashboard"
        } else {
          console.log("[LOGIN] Redirecting to general dashboard")
          targetPath = "/dashboard"
        }
      }

      // Add a small delay to ensure cookie is set before redirect
      setTimeout(() => {
        console.log("[LOGIN] Executing redirect to:", targetPath)
        window.location.href = targetPath
      }, 300)
    } catch (err) {
      console.error("[LOGIN] Login error:", err)
      setError(err.message || "Failed to login. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box maxW="md" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="lg" boxShadow="lg">
      <VStack spacing={6}>
        <Heading as="h1" size="xl">
          Login
        </Heading>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <VStack spacing={4} align="flex-start" width="100%">
            <FormControl isRequired>
              <FormLabel htmlFor="email">Email</FormLabel>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel htmlFor="password">Password</FormLabel>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              width="100%"
              mt={4}
              isLoading={loading}
              loadingText="Logging in..."
            >
              Login
            </Button>
          </VStack>
        </form>

        <Text>
          Don't have an account?{" "}
          <Button variant="link" colorScheme="blue" onClick={() => router.push("/register")}>
            Register
          </Button>
        </Text>
      </VStack>
    </Box>
  )
}
