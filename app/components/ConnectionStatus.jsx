"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Code,
  Collapse,
  Spinner,
  Text,
  Badge,
  useToast,
} from "@chakra-ui/react"
import { FaSync } from "react-icons/fa"

const ConnectionStatus = () => {
  const [serverStatus, setServerStatus] = useState({
    isChecking: false,
    isConnected: null,
    lastChecked: null,
    error: null,
    details: null,
  })
  const [dbStatus, setDbStatus] = useState({
    isChecking: false,
    isConnected: null,
    lastChecked: null,
    error: null,
    details: null,
  })
  const [showDetails, setShowDetails] = useState(false)
  const toast = useToast()

  // Check server connection on component mount
  useEffect(() => {
    checkServerConnection()
  }, [])

  // Check server connection
  const checkServerConnection = async () => {
    setServerStatus((prev) => ({ ...prev, isChecking: true, error: null }))
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch("/api/health", {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setServerStatus({
          isChecking: false,
          isConnected: true,
          lastChecked: new Date(),
          error: null,
          details: data,
        })

        // If server is connected, check database
        checkDatabaseConnection()
      } else {
        const errorText = await response.text()
        throw new Error(`Server responded with status ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error("Server connection check failed:", error)
      setServerStatus({
        isChecking: false,
        isConnected: false,
        lastChecked: new Date(),
        error: error.message || "Failed to connect to server",
        details: { error: error.toString(), stack: error.stack },
      })
    }
  }

  // Check database connection
  const checkDatabaseConnection = async () => {
    setDbStatus((prev) => ({ ...prev, isChecking: true, error: null }))
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

      console.log("[ConnectionStatus] Checking database connection...")

      const response = await fetch("/api/test-db", {
        method: "GET",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })

      clearTimeout(timeoutId)

      // Check if the response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        // Try to get the text to see what's wrong
        const text = await response.text()
        console.error("[ConnectionStatus] Non-JSON response:", text.substring(0, 200))
        throw new Error(`Expected JSON response but got: ${contentType || "unknown"} (${text.substring(0, 100)}...)`)
      }

      const data = await response.json()
      console.log("[ConnectionStatus] Database check response:", data)

      if (response.ok && data.success) {
        setDbStatus({
          isChecking: false,
          isConnected: true,
          lastChecked: new Date(),
          error: null,
          details: data,
        })

        toast({
          title: "Database Connected",
          description: "Successfully connected to the database",
          status: "success",
          duration: 3000,
          isClosable: true,
        })
      } else {
        throw new Error(data.error || "Database connection failed")
      }
    } catch (error) {
      console.error("[ConnectionStatus] Database connection check failed:", error)
      setDbStatus({
        isChecking: false,
        isConnected: false,
        lastChecked: new Date(),
        error: error.message || "Failed to connect to database",
        details: { error: error.toString(), stack: error.stack },
      })

      toast({
        title: "Database Connection Failed",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // If we haven't checked yet, show a checking message
  if (serverStatus.isConnected === null) {
    return (
      <Alert status="info" mb={4}>
        <AlertIcon />
        <AlertTitle>Checking server connection...</AlertTitle>
        <Spinner size="sm" ml={2} />
      </Alert>
    )
  }

  // If server is not connected, show error
  if (!serverStatus.isConnected) {
    return (
      <Alert status="error" mb={4}>
        <AlertIcon />
        <Box flex="1">
          <AlertTitle>Server Connection Error</AlertTitle>
          <AlertDescription display="block">
            <Text>Cannot connect to the server. The application may not function correctly.</Text>
            <Text mt={2}>Error: {serverStatus.error}</Text>

            <Box mt={3}>
              <Button
                size="sm"
                leftIcon={<FaSync />}
                onClick={checkServerConnection}
                isLoading={serverStatus.isChecking}
              >
                Retry Connection
              </Button>
              <Button size="sm" ml={2} onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? "Hide Details" : "Show Details"}
              </Button>
            </Box>

            <Collapse in={showDetails} animateOpacity>
              <Box mt={3} p={2} bg="gray.50" borderRadius="md">
                <Text fontWeight="bold" mb={1}>
                  Troubleshooting Steps:
                </Text>
                <Text>1. Make sure the Next.js server is running (npm run dev)</Text>
                <Text>2. Check if the server is running on the correct port (3000)</Text>
                <Text>3. Verify there are no firewall or network issues</Text>
                <Text>4. Check the server console for any error messages</Text>
              </Box>
            </Collapse>
          </AlertDescription>
        </Box>
      </Alert>
    )
  }

  // If database is not connected, show warning
  if (!dbStatus.isConnected) {
    return (
      <Alert status="warning" mb={4}>
        <AlertIcon />
        <Box flex="1">
          <AlertTitle>
            <Badge colorScheme="green" mr={2}>
              Server: Connected
            </Badge>
            <Badge colorScheme="red">Database: Error</Badge>
          </AlertTitle>
          <AlertDescription display="block">
            <Text>Server is running, but database connection failed. Some features may not work.</Text>
            <Text mt={2}>Error: {dbStatus.error}</Text>

            <Box mt={3}>
              <Button size="sm" leftIcon={<FaSync />} onClick={checkDatabaseConnection} isLoading={dbStatus.isChecking}>
                Retry Database Connection
              </Button>
              <Button size="sm" ml={2} onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? "Hide Details" : "Show Details"}
              </Button>
            </Box>

            <Collapse in={showDetails} animateOpacity>
              <Box mt={3} p={2} bg="gray.50" borderRadius="md">
                <Text fontWeight="bold" mb={1}>
                  Troubleshooting Steps:
                </Text>
                <Text>1. Check if MongoDB is running</Text>
                <Text>2. Verify your MONGODB_URI environment variable is correct</Text>
                <Text>3. Check if the database name is correct</Text>
                <Text>4. Check server logs for database connection errors</Text>
              </Box>
            </Collapse>
          </AlertDescription>
        </Box>
      </Alert>
    )
  }

  // Both server and database are connected
  return (
    <Alert status="success" mb={4}>
      <AlertIcon />
      <Box flex="1">
        <AlertTitle>
          <Badge colorScheme="green" mr={2}>
            Server: Connected
          </Badge>
          <Badge colorScheme="green">Database: Connected</Badge>
        </AlertTitle>
        <AlertDescription display="block">
          <Text>All systems operational.</Text>

          <Box mt={3}>
            <Button
              size="sm"
              leftIcon={<FaSync />}
              onClick={() => {
                checkServerConnection()
                checkDatabaseConnection()
              }}
              isLoading={serverStatus.isChecking || dbStatus.isChecking}
            >
              Refresh Status
            </Button>
            <Button size="sm" ml={2} onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? "Hide Details" : "Show Details"}
            </Button>
          </Box>

          <Collapse in={showDetails} animateOpacity>
            <Box mt={3} p={2} bg="gray.50" borderRadius="md" fontSize="sm">
              <Text fontWeight="bold">Server Details:</Text>
              <Code p={1} display="block" whiteSpace="pre-wrap" fontSize="xs" mt={1}>
                {JSON.stringify(serverStatus.details, null, 2)}
              </Code>

              <Text fontWeight="bold" mt={2}>
                Database Details:
              </Text>
              <Code p={1} display="block" whiteSpace="pre-wrap" fontSize="xs" mt={1}>
                {JSON.stringify(dbStatus.details?.database || {}, null, 2)}
              </Code>
            </Box>
          </Collapse>
        </AlertDescription>
      </Box>
    </Alert>
  )
}

export default ConnectionStatus
