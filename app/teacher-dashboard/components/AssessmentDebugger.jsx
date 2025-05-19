"use client"

import { useState } from "react"
import {
  Box,
  Button,
  Heading,
  Text,
  Input,
  Select,
  FormControl,
  FormLabel,
  Spinner,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Code,
  Flex,
  Divider,
  Alert,
  AlertIcon,
  Badge,
} from "@chakra-ui/react"
import { FaSync, FaBug } from "react-icons/fa"

const AssessmentDebugger = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [testType, setTestType] = useState("fetch")
  const [studentId, setStudentId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [classId, setClassId] = useState("")
  const toast = useToast()

  const runTest = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      let url, method, body

      switch (testType) {
        case "fetch":
          url = `/api/student-assessments?${studentId ? `studentId=${studentId}&` : ""}${
            subjectId ? `subjectId=${subjectId}&` : ""
          }${classId ? `classId=${classId}&` : ""}`
          method = "GET"
          break
        case "create":
          url = "/api/student-assessments"
          method = "POST"
          body = {
            studentId: studentId || "invalid-id",
            subjectId: subjectId || "invalid-id",
            title: "Debug Test Assessment",
            score: 85,
            maxScore: 100,
            weight: 1,
            date: new Date().toISOString(),
            comment: "Created by AssessmentDebugger",
          }
          break
        case "grades":
          url = `/api/grades?${studentId ? `studentId=${studentId}&` : ""}${
            subjectId ? `subjectId=${subjectId}&` : ""
          }${classId ? `classId=${classId}&` : ""}`
          method = "GET"
          break
        case "create-grade":
          url = "/api/grades"
          method = "POST"
          body = {
            studentId: studentId || "invalid-id",
            subjectId: subjectId || "invalid-id",
            title: "Debug Test Grade",
            score: 90,
            maxScore: 100,
            weight: 1,
            date: new Date().toISOString(),
            comment: "Created by AssessmentDebugger",
          }
          break
        case "check-student":
          url = `/api/students/${studentId || "invalid-id"}`
          method = "GET"
          break
        case "check-subject":
          url = `/api/subjects/${subjectId || "invalid-id"}`
          method = "GET"
          break
        case "check-class":
          url = `/api/classes/${classId || "invalid-id"}`
          method = "GET"
          break
        case "check-class-students":
          url = `/api/classes/${classId || "invalid-id"}/students`
          method = "GET"
          break
        default:
          throw new Error("Invalid test type")
      }

      console.log(`[AssessmentDebugger] Running ${testType} test with URL: ${url}`)

      const options = {
        method,
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }

      if (body) {
        options.body = JSON.stringify(body)
        console.log("[AssessmentDebugger] Request body:", body)
      }

      const response = await fetch(url, options)
      const responseText = await response.text()

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error("[AssessmentDebugger] Failed to parse response:", e)
        setError(`Failed to parse response: ${e.message}. Raw response: ${responseText.substring(0, 200)}...`)
        setResult({
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          raw: responseText,
        })
        setLoading(false)
        return
      }

      setResult({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      })

      if (!response.ok) {
        setError(`API returned error status: ${response.status} ${response.statusText}`)
      } else {
        toast({
          title: "Test completed",
          description: `${testType} test completed successfully`,
          status: "success",
          duration: 3000,
          isClosable: true,
        })
      }
    } catch (error) {
      console.error("[AssessmentDebugger] Error running test:", error)
      setError(`Error running test: ${error.message}`)
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const checkSession = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      })

      const data = await response.json()

      setResult({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      })

      if (!response.ok) {
        setError(`API returned error status: ${response.status} ${response.statusText}`)
      } else {
        toast({
          title: "Session check completed",
          description: data.user ? `Logged in as ${data.user.email} (${data.user.role})` : "Not logged in",
          status: "info",
          duration: 3000,
          isClosable: true,
        })
      }
    } catch (error) {
      console.error("[AssessmentDebugger] Error checking session:", error)
      setError(`Error checking session: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const clearCache = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/clear-cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      })

      const data = await response.json()

      setResult({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      })

      if (!response.ok) {
        setError(`API returned error status: ${response.status} ${response.statusText}`)
      } else {
        toast({
          title: "Cache cleared",
          description: "Server cache has been cleared successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        })
      }
    } catch (error) {
      console.error("[AssessmentDebugger] Error clearing cache:", error)
      setError(`Error clearing cache: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box p={4} borderWidth={1} borderRadius="md" bg="gray.50">
      <Heading size="md" mb={4}>
        Assessment System Debugger
      </Heading>

      <Tabs colorScheme="blue" isLazy>
        <TabList>
          <Tab>API Tests</Tab>
          <Tab>Session</Tab>
          <Tab>Cache</Tab>
          <Tab>Results</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <FormControl mb={4}>
              <FormLabel>Test Type</FormLabel>
              <Select value={testType} onChange={(e) => setTestType(e.target.value)}>
                <option value="fetch">Fetch Assessments</option>
                <option value="create">Create Assessment</option>
                <option value="grades">Fetch Grades</option>
                <option value="create-grade">Create Grade</option>
                <option value="check-student">Check Student</option>
                <option value="check-subject">Check Subject</option>
                <option value="check-class">Check Class</option>
                <option value="check-class-students">Check Class Students</option>
              </Select>
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Student ID (optional)</FormLabel>
              <Input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Student ID" />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Subject ID (optional)</FormLabel>
              <Input value={subjectId} onChange={(e) => setSubjectId(e.target.value)} placeholder="Subject ID" />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Class ID (optional)</FormLabel>
              <Input value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="Class ID" />
            </FormControl>

            <Button
              leftIcon={<FaBug />}
              colorScheme="blue"
              onClick={runTest}
              isLoading={loading}
              loadingText="Running test..."
            >
              Run Test
            </Button>
          </TabPanel>

          <TabPanel>
            <Text mb={4}>Check your current session to verify authentication status.</Text>
            <Button
              leftIcon={<FaSync />}
              colorScheme="blue"
              onClick={checkSession}
              isLoading={loading}
              loadingText="Checking session..."
            >
              Check Session
            </Button>
          </TabPanel>

          <TabPanel>
            <Text mb={4}>Clear server-side cache to ensure fresh data is loaded.</Text>
            <Button
              leftIcon={<FaSync />}
              colorScheme="red"
              onClick={clearCache}
              isLoading={loading}
              loadingText="Clearing cache..."
            >
              Clear Server Cache
            </Button>
          </TabPanel>

          <TabPanel>
            {loading && (
              <Flex justify="center" my={8}>
                <Spinner size="xl" color="blue.500" />
              </Flex>
            )}

            {error && (
              <Alert status="error" mb={4}>
                <AlertIcon />
                {error}
              </Alert>
            )}

            {result && (
              <Box>
                <Flex align="center" mb={2}>
                  <Text fontWeight="bold" mr={2}>
                    Status:
                  </Text>
                  <Badge
                    colorScheme={result.status >= 200 && result.status < 300 ? "green" : "red"}
                    fontSize="md"
                    px={2}
                    py={1}
                  >
                    {result.status} {result.statusText}
                  </Badge>
                </Flex>

                <Text fontWeight="bold" mb={2}>
                  Headers:
                </Text>
                <Code p={2} display="block" whiteSpace="pre" mb={4} fontSize="sm">
                  {JSON.stringify(result.headers, null, 2)}
                </Code>

                <Divider my={4} />

                <Text fontWeight="bold" mb={2}>
                  Response Data:
                </Text>
                <Box maxH="400px" overflowY="auto">
                  <Code p={2} display="block" whiteSpace="pre" overflowX="auto" fontSize="sm">
                    {result.data ? JSON.stringify(result.data, null, 2) : result.raw || "No data"}
                  </Code>
                </Box>
              </Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}

export default AssessmentDebugger
