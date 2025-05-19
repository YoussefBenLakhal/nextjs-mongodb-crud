"use client"

import { useState } from "react"
import {
  Box,
  Button,
  Heading,
  Text,
  Input,
  FormControl,
  FormLabel,
  Code,
  VStack,
  HStack,
  Divider,
  Alert,
  AlertIcon,
  Spinner,
  Textarea,
  Badge,
  Switch,
  useToast,
  Select,
} from "@chakra-ui/react"

export default function SubjectsDebugger() {
  const [subjectId, setSubjectId] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [forceDelete, setForceDelete] = useState(false)
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState("")
  const toast = useToast()

  const fetchAllSubjects = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/subjects", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch subjects")
      }

      const data = await response.json()
      setSubjects(data.subjects || [])

      toast({
        title: "Subjects loaded",
        description: `Loaded ${data.subjects?.length || 0} subjects`,
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      console.error("Error fetching subjects:", err)
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

  const handleSubjectSelect = (e) => {
    const id = e.target.value
    setSelectedSubject(id)
    setSubjectId(id)
  }

  const fetchSubject = async () => {
    if (!subjectId) return

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch subject")
      }

      setResult(data)
    } catch (err) {
      console.error("Error fetching subject:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteSubject = async () => {
    if (!subjectId) return

    if (!confirm("Are you sure you want to delete this subject? This action cannot be undone.")) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const url = forceDelete ? `/api/subjects/${subjectId}?force=true` : `/api/subjects/${subjectId}`
      const response = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete subject")
      }

      setResult({
        operation: "delete",
        status: "success",
        message: data.message || "Subject deleted successfully",
        details: data,
      })

      // Remove from subjects list
      setSubjects(subjects.filter((s) => s._id !== subjectId))
      setSelectedSubject("")

      toast({
        title: "Subject deleted",
        description: "Subject was successfully deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      console.error("Error deleting subject:", err)
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

  const directDelete = async () => {
    if (!subjectId) return

    if (!confirm("WARNING: This will attempt to delete the subject directly, bypassing most checks. Are you sure?")) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // This is a special debug endpoint that will attempt to delete the subject directly
      const response = await fetch(`/api/debug-subjects?id=${subjectId}&action=delete&force=${forceDelete}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete subject")
      }

      setResult({
        operation: "delete",
        status: "success",
        message: data.message || "Subject deleted successfully (direct delete)",
        details: data,
      })

      // Remove from subjects list
      setSubjects(subjects.filter((s) => s._id !== subjectId))
      setSelectedSubject("")

      toast({
        title: "Subject deleted",
        description: "Subject was successfully deleted using direct delete",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      console.error("Error with direct delete:", err)
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
        Subjects Debugger
      </Heading>

      <Button colorScheme="blue" onClick={fetchAllSubjects} isLoading={loading && !result} mb={4}>
        Load All Subjects
      </Button>

      {subjects.length > 0 && (
        <FormControl mb={4}>
          <FormLabel>Select Subject</FormLabel>
          <Select value={selectedSubject} onChange={handleSubjectSelect} placeholder="Select a subject">
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name} ({subject.code}) - {subject._id}
              </option>
            ))}
          </Select>
        </FormControl>
      )}

      <FormControl mb={4}>
        <FormLabel>Subject ID</FormLabel>
        <HStack>
          <Input value={subjectId} onChange={(e) => setSubjectId(e.target.value)} placeholder="Enter subject ID" />
          <Button colorScheme="blue" onClick={fetchSubject} isLoading={loading && !result}>
            Fetch
          </Button>
        </HStack>
      </FormControl>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {loading && !result && (
        <Box textAlign="center" py={4}>
          <Spinner size="xl" />
        </Box>
      )}

      {result && (
        <Box>
          <Divider my={4} />

          {result.operation === "delete" ? (
            <Alert status="success">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">{result.message}</Text>
                {result.details.attendanceDeleted > 0 && (
                  <Text>Deleted {result.details.attendanceDeleted} attendance records</Text>
                )}
                {result.details.assessmentsDeleted > 0 && (
                  <Text>Deleted {result.details.assessmentsDeleted} assessment records</Text>
                )}
              </Box>
            </Alert>
          ) : (
            <>
              <Heading size="sm" mb={2}>
                Subject Details
              </Heading>
              <Box p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
                <VStack align="stretch" spacing={2}>
                  <HStack>
                    <Text fontWeight="bold" width="100px">
                      ID:
                    </Text>
                    <Code>{result.subject._id}</Code>
                  </HStack>
                  <HStack>
                    <Text fontWeight="bold" width="100px">
                      Name:
                    </Text>
                    <Text>{result.subject.name}</Text>
                  </HStack>
                  <HStack>
                    <Text fontWeight="bold" width="100px">
                      Code:
                    </Text>
                    <Badge colorScheme="blue">{result.subject.code}</Badge>
                  </HStack>
                  <HStack>
                    <Text fontWeight="bold" width="100px">
                      Class ID:
                    </Text>
                    <Code>{result.subject.classId || "N/A"}</Code>
                  </HStack>
                  {result.subject.teacherId && (
                    <HStack>
                      <Text fontWeight="bold" width="100px">
                        Teacher ID:
                      </Text>
                      <Code>{result.subject.teacherId}</Code>
                    </HStack>
                  )}
                  {result.subject.teacher && (
                    <HStack>
                      <Text fontWeight="bold" width="100px">
                        Teacher:
                      </Text>
                      <Text>{result.subject.teacher}</Text>
                    </HStack>
                  )}
                  <Text fontWeight="bold">Description:</Text>
                  <Textarea value={result.subject.description || "No description"} isReadOnly size="sm" />
                </VStack>
              </Box>

              <Heading size="sm" mt={4} mb={2}>
                Raw Data
              </Heading>
              <Box p={3} borderWidth="1px" borderRadius="md" bg="gray.50" overflowX="auto">
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </Box>
            </>
          )}

          <Divider my={4} />

          <Heading size="sm" mb={2}>
            Delete Subject
          </Heading>

          <FormControl display="flex" alignItems="center" mb={4}>
            <FormLabel htmlFor="force-delete" mb="0">
              Force Delete
            </FormLabel>
            <Switch id="force-delete" isChecked={forceDelete} onChange={(e) => setForceDelete(e.target.checked)} />
          </FormControl>

          <HStack spacing={4}>
            <Button colorScheme="red" onClick={deleteSubject} isLoading={loading && result?.operation === "delete"}>
              Delete Subject
            </Button>

            <Button colorScheme="orange" onClick={directDelete} isLoading={loading && result?.operation === "delete"}>
              Direct Delete (Debug)
            </Button>
          </HStack>

          <Text fontSize="sm" color="gray.500" mt={2}>
            Direct Delete bypasses most checks and validations. Use with caution.
          </Text>
        </Box>
      )}
    </Box>
  )
}
