"use client"

import { useState } from "react"
import {
  Box,
  Button,
  Heading,
  Text,
  Alert,
  AlertIcon,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Code,
} from "@chakra-ui/react"
import { FaTrash, FaSync } from "react-icons/fa"

export default function GhostSubjectCleaner({ onCleanComplete }) {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [ghostSubjects, setGhostSubjects] = useState([])
  const [error, setError] = useState(null)
  const toast = useToast()

  // Function to check for ghost subjects
  const checkForGhostSubjects = async () => {
    setChecking(true)
    setError(null)
    setGhostSubjects([])

    try {
      // First, get all subjects from the frontend cache
      const frontendResponse = await fetch("/api/subjects", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })

      if (!frontendResponse.ok) {
        throw new Error(`Failed to fetch subjects: ${frontendResponse.status}`)
      }

      const frontendData = await frontendResponse.json()
      const frontendSubjects = frontendData.subjects || []

      if (frontendSubjects.length === 0) {
        toast({
          title: "No subjects found",
          description: "There are no subjects in the system to check.",
          status: "info",
          duration: 3000,
          isClosable: true,
        })
        setChecking(false)
        return
      }

      // Check each subject to see if it exists in the database
      const ghosts = []

      for (const subject of frontendSubjects) {
        try {
          const checkResponse = await fetch(`/api/debug-subjects?id=${subject._id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          })

          // If we get a 404, it's a ghost subject
          if (checkResponse.status === 404) {
            ghosts.push(subject)
          }
        } catch (err) {
          console.error(`Error checking subject ${subject._id}:`, err)
        }
      }

      setGhostSubjects(ghosts)

      if (ghosts.length === 0) {
        toast({
          title: "No ghost subjects found",
          description: "All subjects in the frontend cache exist in the database.",
          status: "success",
          duration: 3000,
          isClosable: true,
        })
      } else {
        toast({
          title: "Ghost subjects found",
          description: `Found ${ghosts.length} subjects that exist in the frontend but not in the database.`,
          status: "warning",
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (err) {
      console.error("Error checking for ghost subjects:", err)
      setError(err.message)

      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setChecking(false)
    }
  }

  // Function to clean ghost subjects
  const cleanGhostSubjects = async () => {
    if (ghostSubjects.length === 0) return

    if (!confirm(`Are you sure you want to remove ${ghostSubjects.length} ghost subjects from the frontend cache?`)) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create a copy of the ghost subjects array to track progress
      const remainingGhosts = [...ghostSubjects]
      const removedGhosts = []

      for (const subject of ghostSubjects) {
        try {
          // Use the debug endpoint to mark the subject for removal from cache
          const response = await fetch(`/api/debug-subjects?id=${subject._id}&action=delete`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          })

          if (response.ok) {
            // Remove from the remaining ghosts list
            const index = remainingGhosts.findIndex((s) => s._id === subject._id)
            if (index !== -1) {
              remainingGhosts.splice(index, 1)
              removedGhosts.push(subject)
            }
          }
        } catch (err) {
          console.error(`Error removing ghost subject ${subject._id}:`, err)
        }
      }

      // Update the ghost subjects list
      setGhostSubjects(remainingGhosts)

      if (removedGhosts.length > 0) {
        toast({
          title: "Ghost subjects removed",
          description: `Successfully removed ${removedGhosts.length} ghost subjects from the frontend cache.`,
          status: "success",
          duration: 5000,
          isClosable: true,
        })

        // Call the callback if provided
        if (typeof onCleanComplete === "function") {
          onCleanComplete(removedGhosts)
        }
      }

      if (remainingGhosts.length > 0) {
        toast({
          title: "Warning",
          description: `Failed to remove ${remainingGhosts.length} ghost subjects. You may need to refresh the page.`,
          status: "warning",
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (err) {
      console.error("Error cleaning ghost subjects:", err)
      setError(err.message)

      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
      <Heading size="md" mb={4}>
        Ghost Subject Cleaner
      </Heading>

      <Text mb={4}>
        This tool checks for "ghost" subjects that exist in the frontend cache but not in the database. These can cause
        errors when trying to edit or delete them.
      </Text>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      <Box mb={4}>
        <Button leftIcon={<FaSync />} colorScheme="blue" onClick={checkForGhostSubjects} isLoading={checking} mr={4}>
          Check for Ghost Subjects
        </Button>

        <Button
          leftIcon={<FaTrash />}
          colorScheme="red"
          onClick={cleanGhostSubjects}
          isLoading={loading}
          isDisabled={ghostSubjects.length === 0}
        >
          Clean Ghost Subjects ({ghostSubjects.length})
        </Button>
      </Box>

      {checking && (
        <Box textAlign="center" py={4}>
          <Spinner size="xl" />
          <Text mt={2}>Checking for ghost subjects...</Text>
        </Box>
      )}

      {ghostSubjects.length > 0 && (
        <Box mt={4}>
          <Heading size="sm" mb={2}>
            Ghost Subjects Found ({ghostSubjects.length})
          </Heading>

          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Code</Th>
                  <Th>Class ID</Th>
                  <Th>ID</Th>
                </Tr>
              </Thead>
              <Tbody>
                {ghostSubjects.map((subject) => (
                  <Tr key={subject._id}>
                    <Td>{subject.name}</Td>
                    <Td>
                      <Badge colorScheme="purple">{subject.code}</Badge>
                    </Td>
                    <Td>
                      <Code fontSize="xs">{subject.classId}</Code>
                    </Td>
                    <Td>
                      <Code fontSize="xs">{subject._id}</Code>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Box>
      )}
    </Box>
  )
}
