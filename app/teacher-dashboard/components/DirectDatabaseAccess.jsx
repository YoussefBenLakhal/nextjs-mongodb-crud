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
  useToast,
  Code,
  Textarea,
  FormControl,
  FormLabel,
  Select,
  Stack,
} from "@chakra-ui/react"
import { FaPlay, FaTrash } from "react-icons/fa"

export default function DirectDatabaseAccess() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [collection, setCollection] = useState("subjects")
  const [operation, setOperation] = useState("find")
  const [query, setQuery] = useState("{}") // Default empty query
  const toast = useToast()

  // Function to execute database operation
  const executeOperation = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Validate JSON
      let parsedQuery
      try {
        parsedQuery = JSON.parse(query)
      } catch (err) {
        throw new Error(`Invalid JSON query: ${err.message}`)
      }

      // Make API request to execute operation
      const response = await fetch("/api/direct-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify({
          collection,
          operation,
          query: parsedQuery,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server returned ${response.status}`)
      }

      const data = await response.json()
      setResult(data)

      toast({
        title: "Operation executed",
        description: `${operation} operation on ${collection} completed successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      console.error("Error executing database operation:", err)
      setError(err.message)

      toast({
        title: "Error",
        description: `Failed to execute operation: ${err.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // Function to delete all documents in a collection
  const deleteAllDocuments = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ALL documents in the ${collection} collection? This action cannot be undone.`,
      )
    ) {
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Make API request to delete all documents
      const response = await fetch("/api/direct-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify({
          collection,
          operation: "deleteMany",
          query: {},
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server returned ${response.status}`)
      }

      const data = await response.json()
      setResult(data)

      toast({
        title: "Collection cleared",
        description: `All documents in ${collection} have been deleted.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      console.error("Error deleting all documents:", err)
      setError(err.message)

      toast({
        title: "Error",
        description: `Failed to delete documents: ${err.message}`,
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
      <Heading size="md" mb={2}>
        Direct Database Access
      </Heading>

      <Text mb={4} color="red.500" fontWeight="bold">
        Warning: This tool provides direct access to the database. Use with extreme caution.
      </Text>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      <FormControl mb={4}>
        <FormLabel>Collection</FormLabel>
        <Select value={collection} onChange={(e) => setCollection(e.target.value)}>
          <option value="subjects">subjects</option>
          <option value="classes">classes</option>
          <option value="students">students</option>
          <option value="attendance">attendance</option>
          <option value="assessments">assessments</option>
        </Select>
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Operation</FormLabel>
        <Select value={operation} onChange={(e) => setOperation(e.target.value)}>
          <option value="find">find</option>
          <option value="findOne">findOne</option>
          <option value="count">count</option>
          <option value="deleteOne">deleteOne</option>
          <option value="deleteMany">deleteMany</option>
        </Select>
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Query (JSON)</FormLabel>
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='{"_id": "682a731fa974770379e77384"}'
          rows={5}
          fontFamily="monospace"
        />
      </FormControl>

      <Stack direction={{ base: "column", md: "row" }} spacing={4} mb={4}>
        <Button leftIcon={<FaPlay />} colorScheme="blue" onClick={executeOperation} isLoading={loading}>
          Execute Operation
        </Button>

        <Button leftIcon={<FaTrash />} colorScheme="red" onClick={deleteAllDocuments} isLoading={loading}>
          Delete All Documents
        </Button>
      </Stack>

      {loading && (
        <Box textAlign="center" py={4}>
          <Spinner size="xl" />
          <Text mt={2}>Executing operation...</Text>
        </Box>
      )}

      {result && (
        <Box mt={4}>
          <Heading size="sm" mb={2}>
            Operation Result
          </Heading>
          <Box p={3} bg="gray.50" borderRadius="md" maxH="400px" overflowY="auto">
            <Code p={2} display="block" whiteSpace="pre" overflowX="auto">
              {JSON.stringify(result, null, 2)}
            </Code>
          </Box>
        </Box>
      )}
    </Box>
  )
}
