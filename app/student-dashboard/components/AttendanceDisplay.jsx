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
  Badge,
  Progress,
  SimpleGrid,
  Card,
  Spinner,
  useToast,
  Alert,
  AlertIcon,
  Button,
  Select,
  HStack,
} from "@chakra-ui/react"
import { FaSync } from "react-icons/fa"

const AttendanceDisplay = ({ subjects, attendance: initialAttendance, loading: externalLoading }) => {
  const [attendance, setAttendance] = useState(initialAttendance || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedSubject, setSelectedSubject] = useState("all")
  const toast = useToast()

  // Update local attendance when props change
  useEffect(() => {
    if (initialAttendance && initialAttendance.length > 0) {
      setAttendance(initialAttendance)
    }
  }, [initialAttendance])

  // Fetch attendance
  const fetchAttendance = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log("[AttendanceDisplay] Fetching attendance...")

      const response = await fetch("/api/student/attendance", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "include", // Important for auth
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch attendance: ${response.status}`)
      }

      const data = await response.json()
      console.log(`[AttendanceDisplay] Fetched ${data.attendance?.length || 0} attendance records`)
      setAttendance(data.attendance || [])
    } catch (error) {
      console.error("[AttendanceDisplay] Error fetching attendance:", error)
      setError(`Failed to load attendance records: ${error.message}`)
      toast({
        title: "Error",
        description: `Failed to load attendance records: ${error.message}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // Get subject name by ID
  const getSubjectName = (subjectId) => {
    const subject = subjects.find((s) => s._id === subjectId)
    return subject ? subject.name : "Unknown Subject"
  }

  // Calculate attendance rate for a subject
  const calculateAttendanceRate = (subjectId) => {
    const subjectAttendance = attendance.filter((a) => a.subjectId === subjectId)

    if (subjectAttendance.length === 0) return null

    const present = subjectAttendance.filter((a) => a.status === "present").length
    return (present / subjectAttendance.length) * 100
  }

  // Calculate overall attendance rate
  const calculateOverallAttendanceRate = () => {
    if (attendance.length === 0) return null

    const present = attendance.filter((a) => a.status === "present").length
    return (present / attendance.length) * 100
  }

  // Get color based on attendance rate
  const getAttendanceColor = (rate) => {
    if (rate === null) return "gray.500"
    if (rate >= 90) return "green.500"
    if (rate >= 80) return "teal.500"
    if (rate >= 70) return "yellow.500"
    return "red.500"
  }

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "present":
        return "green"
      case "absent":
        return "red"
      case "late":
        return "yellow"
      case "excused":
        return "blue"
      default:
        return "gray"
    }
  }

  // Filter attendance by selected subject
  const filteredAttendance =
    selectedSubject === "all" ? attendance : attendance.filter((a) => a.subjectId === selectedSubject)

  if (loading || externalLoading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    )
  }

  return (
    <Box>
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
          <Button ml="auto" size="sm" leftIcon={<FaSync />} onClick={fetchAttendance}>
            Retry
          </Button>
        </Alert>
      )}

      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">Attendance Records</Heading>
        <HStack>
          <Select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} size="sm" width="200px">
            <option value="all">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </Select>
          <Button size="sm" leftIcon={<FaSync />} onClick={fetchAttendance}>
            Refresh
          </Button>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={6}>
        <Card p={4}>
          <Heading size="sm" mb={2}>
            Overall Attendance
          </Heading>
          {calculateOverallAttendanceRate() === null ? (
            <Text>No attendance data</Text>
          ) : (
            <>
              <Text fontWeight="bold" color={getAttendanceColor(calculateOverallAttendanceRate())}>
                {calculateOverallAttendanceRate().toFixed(1)}%
              </Text>
              <Progress
                value={calculateOverallAttendanceRate()}
                colorScheme={
                  calculateOverallAttendanceRate() >= 90
                    ? "green"
                    : calculateOverallAttendanceRate() >= 80
                      ? "teal"
                      : calculateOverallAttendanceRate() >= 70
                        ? "yellow"
                        : "red"
                }
                borderRadius="md"
                mt={2}
              />
            </>
          )}
        </Card>

        {subjects.map((subject) => {
          const rate = calculateAttendanceRate(subject._id)
          return (
            <Card key={subject._id} p={4}>
              <Heading size="sm" mb={2}>
                {subject.name}
              </Heading>
              {rate === null ? (
                <Text>No attendance data</Text>
              ) : (
                <>
                  <Text fontWeight="bold" color={getAttendanceColor(rate)}>
                    {rate.toFixed(1)}%
                  </Text>
                  <Progress
                    value={rate}
                    colorScheme={rate >= 90 ? "green" : rate >= 80 ? "teal" : rate >= 70 ? "yellow" : "red"}
                    borderRadius="md"
                    mt={2}
                  />
                </>
              )}
            </Card>
          )
        })}
      </SimpleGrid>

      {filteredAttendance.length === 0 ? (
        <Box textAlign="center" p={8}>
          <Text>No attendance records available.</Text>
          <Button mt={4} leftIcon={<FaSync />} onClick={fetchAttendance}>
            Refresh Data
          </Button>
        </Box>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Subject</Th>
              <Th>Status</Th>
              <Th>Notes</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredAttendance
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((record) => (
                <Tr key={record._id}>
                  <Td>{new Date(record.date).toLocaleDateString()}</Td>
                  <Td>{getSubjectName(record.subjectId)}</Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(record.status)}>{record.status || "Unknown"}</Badge>
                  </Td>
                  <Td>
                    <Text noOfLines={2}>{record.notes || "—"}</Text>
                  </Td>
                </Tr>
              ))}
          </Tbody>
        </Table>
      )}
    </Box>
  )
}

export default AttendanceDisplay
