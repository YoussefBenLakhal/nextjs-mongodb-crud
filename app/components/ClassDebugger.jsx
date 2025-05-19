"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Heading,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  Textarea,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Spinner,
  Divider,
  VStack,
  HStack,
  useToast,
  Select,
} from "@chakra-ui/react"
import { FaSync, FaBug, FaCheck } from "react-icons/fa"

const ClassDebugger = () => {
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState("")
  const [classData, setClassData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [testResult, setTestResult] = useState(null)
  const [editedClass, setEditedClass] = useState({
    name: "",
    description: "",
    teacherId: "",
    subject: "",
    schedule: "",
    room: "",
  })

  const toast = useToast()

  // Fetch classes on component mount
  useEffect(() => {
    fetchClasses()
  }, [])

  // Fetch all classes
  const fetchClasses = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/classes", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch classes: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[ClassDebugger] Classes:", data)

      setClasses(data.classes || [])
    } catch (err) {
      console.error("[ClassDebugger] Error fetching classes:", err)
      setError(err.message)

      toast({
        title: "Error Fetching Classes",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch a specific class
  const fetchClass = async (classId) => {
    if (!classId) return

    setLoading(true)
    setError(null)
    setClassData(null)

    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch class: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[ClassDebugger] Class data:", data)

      setClassData(data.class || null)

      // Set the edited class data
      if (data.class) {
        setEditedClass({
          name: data.class.name || "",
          description: data.class.description || "",
          teacherId: data.class.teacherId || "",
          subject: data.class.subject || "",
          schedule: data.class.schedule || "",
          room: data.class.room || "",
        })
      }
    } catch (err) {
      console.error("[ClassDebugger] Error fetching class:", err)
      setError(err.message)

      toast({
        title: "Error Fetching Class",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle class selection
  const handleClassSelect = (e) => {
    const classId = e.target.value
    setSelectedClass(classId)

    if (classId) {
      fetchClass(classId)
    } else {
      setClassData(null)
      setEditedClass({
        name: "",
        description: "",
        teacherId: "",
        subject: "",
        schedule: "",
        room: "",
      })
    }
  }

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditedClass((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Test update class
  const testUpdateClass = async () => {
    if (!selectedClass || !classData) {
      toast({
        title: "No Class Selected",
        description: "Please select a class to test update",
        status: "warning",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setLoading(true)
    setTestResult(null)

    try {
      console.log("[ClassDebugger] Testing update for class:", selectedClass)
      console.log("[ClassDebugger] Update data:", editedClass)

      const response = await fetch(`/api/classes/${selectedClass}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedClass),
      })

      // Get the response text
      const responseText = await response.text()

      // Try to parse as JSON
      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (e) {
        console.error("[ClassDebugger] Failed to parse response as JSON:", e)
        responseData = { error: "Invalid JSON response", rawResponse: responseText }
      }

      console.log("[ClassDebugger] Update response:", response.status, responseData)

      setTestResult({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        rawResponse: responseText,
      })

      if (response.ok) {
        toast({
          title: "Class Updated Successfully",
          description: "The class was updated successfully",
          status: "success",
          duration: 5000,
          isClosable: true,
        })

        // Refresh the class data
        fetchClass(selectedClass)
      } else {
        toast({
          title: "Failed to Update Class",
          description: responseData.error || `Status: ${response.status} ${response.statusText}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (err) {
      console.error("[ClassDebugger] Error updating class:", err)

      setTestResult({
        success: false,
        error: err.message,
        stack: err.stack,
      })

      toast({
        title: "Error Updating Class",
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
    <Box p={6} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
      <Heading size="md" mb={4} display="flex" alignItems="center">
        <FaBug style={{ marginRight: "8px" }} /> Class API Debugger
      </Heading>

      <Alert status="info" mb={4}>
        <AlertIcon />
        <Box>
          <AlertTitle>Class API Debugging Tool</AlertTitle>
          <AlertDescription>
            Use this tool to test and debug the class API endpoints. You can fetch classes, view class details, and test
            updating classes.
          </AlertDescription>
        </Box>
      </Alert>

      <HStack mb={4} spacing={4}>
        <Button
          colorScheme="blue"
          onClick={fetchClasses}
          isLoading={loading && !selectedClass}
          loadingText="Fetching..."
          leftIcon={<FaSync />}
        >
          Fetch All Classes
        </Button>
      </HStack>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          <Box>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      )}

      {classes.length > 0 && (
        <FormControl mb={4}>
          <FormLabel>Select a Class</FormLabel>
          <Select value={selectedClass} onChange={handleClassSelect} placeholder="Select a class">
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name} - {cls.subject || "No Subject"}
              </option>
            ))}
          </Select>
        </FormControl>
      )}

      {loading && selectedClass && (
        <Box textAlign="center" py={4}>
          <Spinner size="xl" color="blue.500" />
          <Text mt={2}>Loading class data...</Text>
        </Box>
      )}

      {classData && (
        <Box mt={4}>
          <Heading size="sm" mb={2}>
            Class Details
          </Heading>

          <Box p={3} borderWidth="1px" borderRadius="md" bg="gray.50" mb={4}>
            <Code p={2} display="block" whiteSpace="pre" overflowX="auto">
              {JSON.stringify(classData, null, 2)}
            </Code>
          </Box>

          <Divider my={4} />

          <Heading size="sm" mb={4}>
            Test Class Update
          </Heading>

          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Class Name</FormLabel>
              <Input name="name" value={editedClass.name} onChange={handleInputChange} placeholder="Class Name" />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                name="description"
                value={editedClass.description}
                onChange={handleInputChange}
                placeholder="Class Description"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Teacher ID</FormLabel>
              <Input
                name="teacherId"
                value={editedClass.teacherId}
                onChange={handleInputChange}
                placeholder="Teacher ID"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Subject</FormLabel>
              <Input name="subject" value={editedClass.subject} onChange={handleInputChange} placeholder="Subject" />
            </FormControl>

            <FormControl>
              <FormLabel>Schedule</FormLabel>
              <Input name="schedule" value={editedClass.schedule} onChange={handleInputChange} placeholder="Schedule" />
            </FormControl>

            <FormControl>
              <FormLabel>Room</FormLabel>
              <Input name="room" value={editedClass.room} onChange={handleInputChange} placeholder="Room" />
            </FormControl>

            <Button
              colorScheme="green"
              onClick={testUpdateClass}
              isLoading={loading}
              loadingText="Testing..."
              leftIcon={<FaCheck />}
            >
              Test Update Class
            </Button>
          </VStack>

          {testResult && (
            <Box mt={4}>
              <Alert status={testResult.success ? "success" : "error"} variant="subtle" borderRadius="md" mb={3}>
                <AlertIcon />
                <Box>
                  <AlertTitle>{testResult.success ? "Update Successful" : "Update Failed"}</AlertTitle>
                  <AlertDescription>
                    Status: {testResult.status} {testResult.statusText}
                  </AlertDescription>
                </Box>
              </Alert>

              <Heading size="xs" mb={2}>
                Response Data:
              </Heading>
              <Box p={3} borderWidth="1px" borderRadius="md" bg="gray.50" maxH="300px" overflowY="auto">
                <Code p={2} display="block" whiteSpace="pre" overflowX="auto">
                  {JSON.stringify(testResult.data, null, 2) || testResult.rawResponse || "No response data"}
                </Code>
              </Box>

              {testResult.error && (
                <>
                  <Heading size="xs" mt={3} mb={2}>
                    Error:
                  </Heading>
                  <Box p={3} borderWidth="1px" borderRadius="md" bg="red.50" maxH="200px" overflowY="auto">
                    <Text color="red.600">{testResult.error}</Text>
                    {testResult.stack && (
                      <Code p={2} display="block" whiteSpace="pre" overflowX="auto" mt={2} size="sm">
                        {testResult.stack}
                      </Code>
                    )}
                  </Box>
                </>
              )}
            </Box>
          )}
        </Box>
      )}

      {classes.length === 0 && !loading && !error && (
        <Alert status="warning" mb={4}>
          <AlertIcon />
          <Box>
            <AlertTitle>No Classes Found</AlertTitle>
            <AlertDescription>No classes were found in the database. Create some classes first.</AlertDescription>
          </Box>
        </Alert>
      )}
    </Box>
  )
}

export default ClassDebugger
