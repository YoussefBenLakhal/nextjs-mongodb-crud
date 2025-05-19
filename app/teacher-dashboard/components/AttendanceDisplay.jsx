"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  SimpleGrid,
  Card,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Spinner,
  useToast,
  Alert,
  AlertIcon,
  Button,
  Code,
} from "@chakra-ui/react"
import { FaCheckCircle, FaTimesCircle, FaClock, FaSync, FaBug } from "react-icons/fa"

const AttendanceDisplay = ({ subjects }) => {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [apiResponse, setApiResponse] = useState(null)
  const [showDebug, setShowDebug] = useState(false)
  const [usingSampleData, setUsingSampleData] = useState(false)
  const toast = useToast()

  // Fetch attendance
  const fetchAttendance = async () => {
    setLoading(true)
    setError(null)
    setApiResponse(null)
    setUsingSampleData(false)

    try {
      console.log("[AttendanceDisplay] Fetching attendance...")

      // Try multiple API endpoints in sequence
      const endpoints = ["/api/attendance/student", "/api/student-attendance", "/api/student/attendance"]

      let success = false
      let responseData = null
      let responseError = null

      for (const endpoint of endpoints) {
        try {
          console.log(`[AttendanceDisplay] Trying endpoint: ${endpoint}`)
          const response = await fetch(endpoint, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            credentials: "include",
          })

          // Get the raw response for debugging
          const responseText = await response.text()

          try {
            // Try to parse the response as JSON
            const data = JSON.parse(responseText)
            setApiResponse({
              endpoint,
              status: response.status,
              data,
            })

            if (response.ok && data.attendance) {
              console.log(
                `[AttendanceDisplay] Successfully fetched from ${endpoint}: ${data.attendance.length} records`,
              )

              // If we got data, use it
              if (data.attendance.length > 0) {
                setAttendance(data.attendance)
                success = true
                responseData = data
                break
              } else {
                console.log(`[AttendanceDisplay] Endpoint ${endpoint} returned empty array`)
                responseData = data
              }
            } else {
              console.log(`[AttendanceDisplay] Endpoint ${endpoint} returned status ${response.status}`)
              responseError = `API returned status ${response.status}: ${data.error || "Unknown error"}`
            }
          } catch (parseError) {
            console.error(`[AttendanceDisplay] Failed to parse response from ${endpoint}:`, parseError)
            responseError = `Failed to parse API response: ${parseError.message}`
            setApiResponse({
              endpoint,
              status: response.status,
              error: parseError.message,
              rawResponse: responseText.substring(0, 500), // First 500 chars for debugging
            })
          }
        } catch (fetchError) {
          console.error(`[AttendanceDisplay] Fetch error for ${endpoint}:`, fetchError)
          responseError = fetchError.message
        }
      }

      // If we got data from any endpoint, we're done
      if (success && responseData.attendance.length > 0) {
        return
      }

      // If we reach here, all API attempts failed or returned no data
      if (responseData && responseData.attendance && responseData.attendance.length === 0) {
        console.log("[AttendanceDisplay] APIs returned empty attendance array, using sample data")
        setError("No attendance records found in the database. Using sample data for demonstration.")
      } else if (responseError) {
        console.warn(`[AttendanceDisplay] All API endpoints failed: ${responseError}`)
        setError(`API Error: ${responseError}. Using sample data instead.`)
      } else {
        console.log("[AttendanceDisplay] No attendance records found, using sample data")
        setError("No attendance records found. Using sample data for demonstration.")
      }

      // Use mock data
      console.log("[AttendanceDisplay] Using mock attendance data")
      const mockAttendance = generateSampleAttendanceData(subjects)
      setAttendance(mockAttendance)
      setUsingSampleData(true)
    } catch (error) {
      console.error("[AttendanceDisplay] Error fetching attendance:", error)
      setError(`Failed to load attendance records: ${error.message}. Using sample data instead.`)

      // Use mock data if API fails
      const mockAttendance = generateSampleAttendanceData(subjects)
      setAttendance(mockAttendance)
      setUsingSampleData(true)

      toast({
        title: "Error",
        description: "Failed to load attendance records. Using sample data instead.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // Generate sample attendance data
  const generateSampleAttendanceData = (subjects) => {
    if (!subjects || subjects.length === 0) {
      subjects = [
        { _id: "subj1", name: "Mathematics" },
        { _id: "subj2", name: "Science" },
      ]
    }

    const mockAttendance = []
    const now = new Date()

    // Create 20 days of attendance records
    for (let i = 0; i < 20; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)

      // Skip weekends
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) continue

      // Randomly select a subject
      const subject = subjects[Math.floor(Math.random() * subjects.length)]

      // Determine status (80% present, 10% late, 10% absent)
      const rand = Math.random()
      let status = "present"
      let comment = ""

      if (rand > 0.9) {
        status = "absent"
        comment = "Student was absent"
      } else if (rand > 0.8) {
        status = "late"
        comment = "Student arrived 10 minutes late"
      }

      mockAttendance.push({
        _id: `mock-${i}`,
        date: date.toISOString(),
        subjectId: subject._id,
        status: status,
        comment: comment,
      })
    }

    return mockAttendance
  }

  useEffect(() => {
    fetchAttendance()
  }, [subjects]) // Re-fetch when subjects change

  // Get subject name by ID
  const getSubjectName = (subjectId) => {
    const subject = subjects.find((s) => s._id === subjectId)
    return subject ? subject.name : "Unknown Subject"
  }

  // Get attendance status icon
  const getAttendanceIcon = (status) => {
    switch (status) {
      case "present":
        return <Icon as={FaCheckCircle} color="green.500" />
      case "absent":
        return <Icon as={FaTimesCircle} color="red.500" />
      case "late":
        return <Icon as={FaClock} color="yellow.500" />
      default:
        return null
    }
  }

  // Calculate attendance statistics
  const attendanceStats = {
    present: attendance.filter((a) => a.status === "present").length,
    absent: attendance.filter((a) => a.status === "absent").length,
    late: attendance.filter((a) => a.status === "late").length,
    total: attendance.length,
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    )
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">Attendance Summary</Heading>
        <Button
          leftIcon={<FaBug />}
          size="sm"
          colorScheme={showDebug ? "red" : "gray"}
          onClick={() => setShowDebug(!showDebug)}
        >
          {showDebug ? "Hide Debug" : "Debug"}
        </Button>
      </Flex>

      {error && (
        <Alert status={usingSampleData ? "info" : "warning"} mb={4}>
          <AlertIcon />
          {error}
          <Button ml="auto" size="sm" leftIcon={<FaSync />} onClick={fetchAttendance}>
            Retry
          </Button>
        </Alert>
      )}

      {showDebug && apiResponse && (
        <Box mb={4} p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
          <Heading size="sm" mb={2}>
            API Debug Information
          </Heading>
          <Code display="block" whiteSpace="pre" overflowX="auto" p={2} fontSize="sm">
            {JSON.stringify(apiResponse, null, 2)}
          </Code>
        </Box>
      )}

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
        <Card p={4} bg="green.50" borderColor="green.200" borderWidth="1px">
          <Stat>
            <StatLabel>Present</StatLabel>
            <StatNumber>{attendanceStats.present}</StatNumber>
            <StatHelpText>
              {attendanceStats.total > 0 ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : 0}%
            </StatHelpText>
          </Stat>
        </Card>
        <Card p={4} bg="red.50" borderColor="red.200" borderWidth="1px">
          <Stat>
            <StatLabel>Absent</StatLabel>
            <StatNumber>{attendanceStats.absent}</StatNumber>
            <StatHelpText>
              {attendanceStats.total > 0 ? Math.round((attendanceStats.absent / attendanceStats.total) * 100) : 0}%
            </StatHelpText>
          </Stat>
        </Card>
        <Card p={4} bg="yellow.50" borderColor="yellow.200" borderWidth="1px">
          <Stat>
            <StatLabel>Late</StatLabel>
            <StatNumber>{attendanceStats.late}</StatNumber>
            <StatHelpText>
              {attendanceStats.total > 0 ? Math.round((attendanceStats.late / attendanceStats.total) * 100) : 0}%
            </StatHelpText>
          </Stat>
        </Card>
      </SimpleGrid>

      <Heading size="md" mb={4}>
        Recent Attendance
      </Heading>
      {attendance.length === 0 ? (
        <Box textAlign="center" p={8}>
          <Text>No attendance records available yet.</Text>
        </Box>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Subject</Th>
              <Th>Status</Th>
              <Th>Comment</Th>
            </Tr>
          </Thead>
          <Tbody>
            {attendance
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 10)
              .map((record, index) => (
                <Tr key={record._id || index}>
                  <Td>{new Date(record.date).toLocaleDateString()}</Td>
                  <Td>{getSubjectName(record.subjectId)}</Td>
                  <Td>
                    <Flex align="center">
                      {getAttendanceIcon(record.status)}
                      <Text ml={2}>{record.status.charAt(0).toUpperCase() + record.status.slice(1)}</Text>
                    </Flex>
                  </Td>
                  <Td>{record.comment || "—"}</Td>
                </Tr>
              ))}
          </Tbody>
        </Table>
      )}
    </Box>
  )
}

export default AttendanceDisplay
