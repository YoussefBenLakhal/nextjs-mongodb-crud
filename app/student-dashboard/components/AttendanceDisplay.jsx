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
  Badge,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Icon,
  useToast,
} from "@chakra-ui/react"
import { FaCheckCircle, FaTimesCircle, FaClock, FaSync } from "react-icons/fa"

const AttendanceDisplay = () => {
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)
  const toast = useToast()

  // Fetch attendance data
  const fetchAttendance = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/attendance/student", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        cache: "no-store",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch attendance: ${response.status}`)
      }

      const data = await response.json()

      // Log the raw data to help with debugging
      console.log("Raw attendance data:", data)

      if (data.attendance && Array.isArray(data.attendance)) {
        setAttendanceData(data.attendance)

        // Show success message with count
        toast({
          title: "Attendance Loaded",
          description: `Successfully loaded ${data.attendance.length} attendance records.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        })
      } else {
        setAttendanceData([])
        setError("No attendance data returned from server")
      }

      // Store debug info if available
      if (data.debug) {
        setDebugInfo(data.debug)
      }
    } catch (error) {
      console.error("Error fetching attendance:", error)
      setError(`Failed to load attendance records: ${error.message}`)
      toast({
        title: "Error",
        description: `Failed to load attendance records: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchAttendance()
  }, [])

  // Format date for display
  const formatDate = (dateValue) => {
    try {
      let date
      if (typeof dateValue === "string") {
        date = new Date(dateValue)
      } else if (dateValue && dateValue.$date) {
        if (dateValue.$date.$numberLong) {
          date = new Date(Number.parseInt(dateValue.$date.$numberLong))
        } else {
          date = new Date(dateValue.$date)
        }
      } else {
        date = new Date(dateValue)
      }

      return date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch (e) {
      console.error("Error formatting date:", e, dateValue)
      return "Invalid Date"
    }
  }

  // Extract ID from MongoDB format or return the ID directly
  const extractId = (idField) => {
    if (!idField) return null
    return idField.$oid || idField
  }

  // Get subject name by ID
  const getSubjectName = (subjectId) => {
    if (!subjectId) return "Unknown Subject"

    // Extract the ID from MongoDB format if needed
    const id = extractId(subjectId)

    // Map known subject IDs to names
    const subjectMap = {
      "682a7cf80e9ef7db9ea5b1e9": "CCN",
      "682ac6505a34a8b67a6910eb": "Mathematics",
      "6828c914c677fe6c2bf312c0": "Science",
      "682afb7a6ed8223df425ad09": "BDD",
    }

    return subjectMap[id] || `Subject ${id.substring(0, 6)}...`
  }

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "present":
        return <Badge colorScheme="green">Present</Badge>
      case "absent":
        return <Badge colorScheme="red">Absent</Badge>
      case "late":
        return <Badge colorScheme="yellow">Late</Badge>
      default:
        return <Badge colorScheme="gray">{status || "Unknown"}</Badge>
    }
  }

  // Group attendance by subject
  const getAttendanceBySubject = () => {
    const bySubject = {}

    attendanceData.forEach((record) => {
      // Get subject ID, handling MongoDB format
      const subjectId = extractId(record.subjectId)

      if (!subjectId) {
        console.warn("Record missing subjectId:", record)
        return
      }

      if (!bySubject[subjectId]) {
        bySubject[subjectId] = {
          name: getSubjectName(record.subjectId),
          records: [],
        }
      }

      bySubject[subjectId].records.push(record)
    })

    return bySubject
  }

  // Calculate attendance stats
  const calculateStats = (records) => {
    const present = records.filter((r) => r.status === "present").length
    const absent = records.filter((r) => r.status === "absent").length
    const late = records.filter((r) => r.status === "late").length
    const total = records.length

    return {
      present,
      absent,
      late,
      total,
      presentPercentage: total > 0 ? Math.round((present / total) * 100) : 0,
    }
  }

  // Calculate overall stats
  const overallStats = calculateStats(attendanceData)

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    )
  }

  const attendanceBySubject = getAttendanceBySubject()
  const hasData = attendanceData.length > 0

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

      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="md">Attendance Records</Heading>
        <Button leftIcon={<FaSync />} onClick={fetchAttendance} isLoading={loading} colorScheme="blue">
          Refresh
        </Button>
      </Flex>

      {/* Overall Attendance Card */}
      <Card mb={6}>
        <CardHeader>
          <Heading size="sm">Overall Attendance</Heading>
        </CardHeader>
        <CardBody>
          {hasData ? (
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
              <Flex align="center">
                <Box p={2} bg="blue.500" borderRadius="full" color="white" mr={3}>
                  <Icon as={FaCheckCircle} boxSize={5} />
                </Box>
                <Box>
                  <Text fontWeight="bold">{overallStats.total} Records</Text>
                  <Text fontSize="sm" color="gray.600">
                    Total
                  </Text>
                </Box>
              </Flex>

              <Flex align="center">
                <Box p={2} bg="green.500" borderRadius="full" color="white" mr={3}>
                  <Icon as={FaCheckCircle} boxSize={5} />
                </Box>
                <Box>
                  <Text fontWeight="bold">{overallStats.presentPercentage}%</Text>
                  <Text fontSize="sm" color="gray.600">
                    Attendance Rate
                  </Text>
                </Box>
              </Flex>

              <Flex align="center">
                <Box p={2} bg="red.500" borderRadius="full" color="white" mr={3}>
                  <Icon as={FaTimesCircle} boxSize={5} />
                </Box>
                <Box>
                  <Text fontWeight="bold">{overallStats.absent}</Text>
                  <Text fontSize="sm" color="gray.600">
                    Absences
                  </Text>
                </Box>
              </Flex>

              <Flex align="center">
                <Box p={2} bg="yellow.500" borderRadius="full" color="white" mr={3}>
                  <Icon as={FaClock} boxSize={5} />
                </Box>
                <Box>
                  <Text fontWeight="bold">{overallStats.late}</Text>
                  <Text fontSize="sm" color="gray.600">
                    Late Arrivals
                  </Text>
                </Box>
              </Flex>
            </SimpleGrid>
          ) : (
            <Text>No attendance data</Text>
          )}
        </CardBody>
      </Card>

      {/* Subject Cards */}
      {hasData ? (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
          {Object.entries(attendanceBySubject).map(([subjectId, subject]) => {
            const stats = calculateStats(subject.records)

            return (
              <Card key={subjectId}>
                <CardHeader>
                  <Heading size="sm">{subject.name}</Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={3} spacing={4} mb={4}>
                    <Box textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="green.500">
                        {stats.present}
                      </Text>
                      <Text fontSize="sm">Present</Text>
                    </Box>
                    <Box textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="red.500">
                        {stats.absent}
                      </Text>
                      <Text fontSize="sm">Absent</Text>
                    </Box>
                    <Box textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="yellow.500">
                        {stats.late}
                      </Text>
                      <Text fontSize="sm">Late</Text>
                    </Box>
                  </SimpleGrid>

                  <Divider mb={4} />

                  <Text fontWeight="medium" mb={2}>
                    Recent Records
                  </Text>
                  {subject.records.slice(0, 3).map((record) => (
                    <Flex key={extractId(record._id)} justify="space-between" mb={2}>
                      <Text fontSize="sm">{formatDate(record.date)}</Text>
                      <Text>{getStatusBadge(record.status)}</Text>
                    </Flex>
                  ))}
                </CardBody>
              </Card>
            )
          })}
        </SimpleGrid>
      ) : (
        <Alert status="info">
          <AlertIcon />
          No attendance records available.
        </Alert>
      )}

      {/* Detailed Records Table */}
      {hasData && (
        <Box bg="white" borderRadius="md" boxShadow="sm" overflowX="auto" mb={6}>
          <Heading size="sm" p={4} borderBottomWidth="1px">
            Detailed Attendance Records
          </Heading>
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>Date</Th>
                <Th>Subject</Th>
                <Th>Status</Th>
                <Th>Notes</Th>
              </Tr>
            </Thead>
            <Tbody>
              {attendanceData.map((record) => (
                <Tr key={extractId(record._id)}>
                  <Td>{formatDate(record.date)}</Td>
                  <Td>{getSubjectName(record.subjectId)}</Td>
                  <Td>{getStatusBadge(record.status)}</Td>
                  <Td>{record.notes || "—"}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  )
}

export default AttendanceDisplay
