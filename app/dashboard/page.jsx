"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Box, Heading, Text, Button, Spinner, Center, Alert, AlertIcon } from "@chakra-ui/react"
import { checkSession } from "@/lib/client-auth"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    // Check for redirect loop
    const redirectCount = Number.parseInt(sessionStorage.getItem("auth_redirect_count") || "0")
    if (redirectCount > 2) {
      console.log("Dashboard - Detected redirect loop, breaking cycle")
      sessionStorage.removeItem("auth_redirect_count")
      setError("Authentication error. Please clear your cookies and try again.")
      setLoading(false)
      return
    }

    async function loadUserData() {
      try {
        console.log("Dashboard - Checking session")
        const session = await checkSession()

        if (!session || !session.user) {
          console.log("Dashboard - No valid session found")
          setError("Please log in to access the dashboard")
          setLoading(false)
          return
        }

        console.log("Dashboard - User data loaded:", session.user)
        setUser(session.user)
        setLoading(false)
      } catch (err) {
        console.error("Dashboard - Error loading user data:", err)
        setError("Failed to load user data")
        setLoading(false)
      }
    }

    loadUserData()
  }, [router])

  const handleReturnToLogin = () => {
    // Track redirects to detect loops
    const redirectCount = Number.parseInt(sessionStorage.getItem("auth_redirect_count") || "0")
    sessionStorage.setItem("auth_redirect_count", (redirectCount + 1).toString())

    router.push("/login")
  }

  const redirectToDashboard = () => {
    const role = user?.role?.toLowerCase()

    if (role === "teacher") {
      router.push("/teacher-dashboard")
    } else if (role === "student") {
      router.push("/student-dashboard")
    }
  }

  if (loading) {
    return (
      <Center h="100vh">
        <Box textAlign="center">
          <Spinner size="xl" color="blue.500" mb={4} />
          <Text>Loading dashboard...</Text>
        </Box>
      </Center>
    )
  }

  if (error) {
    return (
      <Center h="100vh">
        <Box textAlign="center" maxW="md" p={6} borderWidth={1} borderRadius="lg" boxShadow="lg">
          <Alert status="error" mb={4}>
            <AlertIcon />
            {error}
          </Alert>
          <Button colorScheme="blue" onClick={handleReturnToLogin}>
            Return to Login
          </Button>
        </Box>
      </Center>
    )
  }

  return (
    <Box maxW="container.xl" mx="auto" p={6}>
      <Heading as="h1" mb={6}>
        Dashboard
      </Heading>

      <Box p={6} borderWidth={1} borderRadius="lg" boxShadow="md" bg="white" mb={6}>
        <Heading as="h2" size="lg" mb={4}>
          Welcome, {user.name || user.email}!
        </Heading>
        <Text mb={4}>Role: {user.role || "User"}</Text>

        {(user.role === "teacher" || user.role === "student") && (
          <Button colorScheme="blue" onClick={redirectToDashboard}>
            Go to {user.role} Dashboard
          </Button>
        )}
      </Box>
    </Box>
  )
}
