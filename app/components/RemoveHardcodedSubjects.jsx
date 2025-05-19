"use client"

import { useState } from "react"
import { Button, Text, Box, Alert, AlertIcon } from "@chakra-ui/react"

export default function RemoveHardcodedSubjects({ onSuccess }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleRemove = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Call the API to remove hardcoded subjects
      const response = await fetch("/api/delete-hardcoded-subjects", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove hardcoded subjects")
      }

      setSuccess(true)

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1500)

      // Call the onSuccess callback if provided
      if (typeof onSuccess === "function") {
        onSuccess()
      }
    } catch (error) {
      console.error("Error removing hardcoded subjects:", error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box mb={4} p={4} borderWidth="1px" borderRadius="md" bg="red.50">
      <Text mb={3} fontWeight="bold">
        Remove Test Subjects
      </Text>
      <Text mb={4}>
        This will remove the hardcoded test subjects (Mathematics, Science, History) from your dashboard.
      </Text>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {success ? (
        <Alert status="success">
          <AlertIcon />
          Hardcoded subjects removed successfully! Refreshing page...
        </Alert>
      ) : (
        <Button colorScheme="red" onClick={handleRemove} isLoading={isLoading} loadingText="Removing...">
          Remove Test Subjects
        </Button>
      )}
    </Box>
  )
}
