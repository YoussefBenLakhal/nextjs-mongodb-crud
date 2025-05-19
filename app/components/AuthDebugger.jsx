"use client"

import { useState, useEffect } from "react"
import { Box, Heading, Text, Button, Code, Alert, AlertIcon, Spinner, Flex, Badge, Divider } from "@chakra-ui/react"

const AuthDebugger = () => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/auth/session", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch session: ${response.status}`)
        }

        const data = await response.json()
        console.log("[AuthDebugger] Session data:", data)
        setSession(data)
      } catch (err) {
        console.error("[AuthDebugger] Error fetching session:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [])

  const refreshSession = () => {
    setLoading(true)
    setError(null)
    fetch("/api/auth/session", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch session: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        console.log("[AuthDebugger] Refreshed session data:", data)
        setSession(data)
      })
      .catch((err) => {
        console.error("[AuthDebugger] Error refreshing session:", err)
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
      <Heading size="md" mb={4}>
        Authentication Debugger
      </Heading>

      {loading ? (
        <Flex justify="center" align="center" p={4}>
          <Spinner size="xl" color="blue.500" />
        </Flex>
      ) : error ? (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      ) : (
        <Box>
          <Flex align="center" mb={2}>
            <Text fontWeight="bold" mr={2}>
              Authentication Status:
            </Text>
            <Badge colorScheme={session?.user ? "green" : "red"} fontSize="0.8em" p={1}>
              {session?.user ? "Authenticated" : "Not Authenticated"}
            </Badge>
          </Flex>

          {session?.user ? (
            <>
              <Text mb={1}>
                <strong>User ID:</strong> {session.user.id}
              </Text>
              <Text mb={1}>
                <strong>Name:</strong> {session.user.name || "Not set"}
              </Text>
              <Text mb={1}>
                <strong>Email:</strong> {session.user.email || "Not set"}
              </Text>
              <Text mb={1}>
                <strong>Role:</strong>{" "}
                <Badge
                  colorScheme={
                    session.user.role === "admin" ? "purple" : session.user.role === "teacher" ? "blue" : "green"
                  }
                >
                  {session.user.role || "Not set"}
                </Badge>
              </Text>

              <Divider my={3} />

              <Text fontWeight="bold" mb={2}>
                Full Session Data:
              </Text>
              <Box maxH="200px" overflowY="auto">
                <Code p={2} display="block" whiteSpace="pre" overflowX="auto">
                  {JSON.stringify(session, null, 2)}
                </Code>
              </Box>
            </>
          ) : (
            <Text>No user session found. Please log in.</Text>
          )}

          <Button mt={4} colorScheme="blue" size="sm" onClick={refreshSession}>
            Refresh Session
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default AuthDebugger
