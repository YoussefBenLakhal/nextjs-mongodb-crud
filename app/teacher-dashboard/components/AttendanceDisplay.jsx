"use client"

import { useState, useEffect, useMemo } from "react"
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
  Select,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Card,
  CardBody,
  Icon,
  useToast,
  InputGroup,
  Input,
  InputLeftElement,
  Tag,
  TagLabel,
} from "@chakra-ui/react"
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaSync,
  FaFilter,
  FaCalendarAlt,
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa"

const AttendanceDisplay = () => {
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortDirection, setSortDirection] = useState("desc") // desc = newest first
  const [dateFilter, setDateFilter] = useState("all") // all, thisWeek, thisMonth
  const toast = useToast()

  // Extract unique subjects from attendance data
  const subjects = useMemo(() => {
    const subjectMap = new Map()

    attendanceData.forEach((record) => {
      if (record.subjectId && record.subjectId.$oid) {
        // For individual records
        subjectMap.set(record.subjectId.$oid, {
          id: record.subjectId.$oid,
          name: getSubjectName(record.subjectId.$oid),
        })
      } else if (record.records && record.subjectId && record.subjectId.$oid) {
        // For class records
        subjectMap.set(record.subjectId.$oid, {
          id: record.subjectId.$oid,
          name: getSubjectName(record.subjectId.$oid),
        })
      }
    })

    return Array.from(subjectMap.values())
  }, [attendanceData])

  // Process attendance data to a unified format
  const processedAttendance = useMemo(() => {
    const result = []
    console.log("[AttendanceDisplay] Processing attendance data:", attendanceData)

    if (!attendanceData || attendanceData.length === 0) {
      return []
    }

    attendanceData.forEach((record) => {
      try {
        // Handle different data formats
        if (record.records) {
          // Handle class records with multiple students
          record.records.forEach((studentRecord) => {
            const studentId = studentRecord.studentId?.$oid || studentRecord.studentId
            if (!studentId) {
              console.warn("[AttendanceDisplay] Missing studentId in record:", studentRecord)
              return
            }

            result.push({
              id: `${record._id?.$oid || record._id}-${studentId}`,
              date: record.date,
              studentId: studentId,
              subjectId: record.subjectId?.$oid || record.subjectId,
              status: studentRecord.status,
              notes: studentRecord.comment || "",
              createdAt: record.createdAt,
            })
          })
        } else {
          // Handle individual student records
          const studentId = record.studentId?.$oid || record.studentId
          const subjectId = record.subjectId?.$oid || record.subjectId

          if (!studentId || !subjectId) {
            console.warn("[AttendanceDisplay] Missing studentId or subjectId in record:", record)
            return
          }

          result.push({
            id: record._id?.$oid || record._id,
            date: record.date,
            studentId: studentId,
            subjectId: subjectId,
            status: record.status,
            notes: record.notes || "",
            createdAt: record.createdAt,
          })
        }
      } catch (err) {
        console.error("[AttendanceDisplay] Error processing attendance record:", err, record)
      }
    })

    console.log("[AttendanceDisplay] Processed attendance records:", result.length)
    return result
  }, [attendanceData])

  // Apply filters to processed attendance
  const filteredAttendance = useMemo(() => {
    return processedAttendance.filter((record) => {
      // Subject filter
      if (selectedSubject !== "all" && record.subjectId !== selectedSubject) {
        return false
      }

      // Search filter (search in notes)
      if (searchTerm && !record.notes.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      // Date filter
      if (dateFilter !== "all") {
        const recordDate = getDateObject(record.date)
        const today = new Date()

        if (dateFilter === "thisWeek") {
          // Get start of week (Sunday)
          const startOfWeek = new Date(today)
          startOfWeek.setDate(today.getDate() - today.getDay())
          startOfWeek.setHours(0, 0, 0, 0)

          if (recordDate < startOfWeek) {
            return false
          }
        } else if (dateFilter === "thisMonth") {
          // Get start of month
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

          if (recordDate < startOfMonth) {
            return false
          }
        }
      }

      return true
    })
  }, [processedAttendance, selectedSubject, searchTerm, dateFilter])

  // Sort filtered attendance
  const sortedAttendance = useMemo(() => {
    return [...filteredAttendance].sort((a, b) => {
      const dateA = getDateObject(a.date)
      const dateB = getDateObject(b.date)

      return sortDirection === "desc" ? dateB - dateA : dateA - dateB
    })
  }, [filteredAttendance, sortDirection])

  // Calculate attendance statistics
  const stats = useMemo(() => {
    const present = filteredAttendance.filter((a) => a.status === "present").length
    const absent = filteredAttendance.filter((a) => a.status === "absent").length
    const late = filteredAttendance.filter((a) => a.status === "late").length
    const total = filteredAttendance.length

    return {
      present,
      absent,
      late,
      total,
      presentPercentage: total > 0 ? Math.round((present / total) * 100) : 0,
      absentPercentage: total > 0 ? Math.round((absent / total) * 100) : 0,
      latePercentage: total > 0 ? Math.round((late / total) * 100) : 0,
    }
  }, [filteredAttendance])

  // Fetch attendance from MongoDB Atlas
  const fetchAttendance = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("[AttendanceDisplay] Fetching attendance from API")

      // Try multiple endpoints to get attendance data
      const endpoints = [
        "/api/attendance/student", // Primary endpoint
        "/api/attendance?studentId=current", // Fallback endpoint
      ]

      let attendanceData = null
      let successEndpoint = null

      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`[AttendanceDisplay] Trying endpoint: ${endpoint}`)

          const response = await fetch(endpoint, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
            cache: "no-store",
            credentials: "include",
          })

          if (!response.ok) {
            console.log(`[AttendanceDisplay] ${endpoint} returned status ${response.status}`)
            continue // Try next endpoint
          }

          const data = await response.json()
          console.log(`[AttendanceDisplay] ${endpoint} returned:`, data)

          if (data.attendance && Array.isArray(data.attendance) && data.attendance.length > 0) {
            attendanceData = data.attendance
            successEndpoint = endpoint
            break // Exit the loop if we got valid data
          } else {
            console.log(`[AttendanceDisplay] ${endpoint} returned no attendance records`)
          }
        } catch (endpointError) {
          console.error(`[AttendanceDisplay] Error with ${endpoint}:`, endpointError)
        }
      }

      if (attendanceData) {
        console.log(
          `[AttendanceDisplay] Successfully loaded ${attendanceData.length} attendance records from ${successEndpoint}`,
        )
        setAttendanceData(attendanceData)

        toast({
          title: "Attendance Loaded",
          description: `Successfully loaded ${attendanceData.length} attendance records.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        })
      } else {
        console.log("[AttendanceDisplay] No attendance records found from any endpoint")
        setAttendanceData([])

        toast({
          title: "No attendance records",
          description: "No attendance records found for your account.",
          status: "info",
          duration: 3000,
          isClosable: true,
        })
      }
    } catch (error) {
      console.error("[AttendanceDisplay] Error fetching attendance:", error)
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

  // Helper function to get date object from various MongoDB date formats
  function getDateObject(dateValue) {
    try {
      if (typeof dateValue === "string") {
        return new Date(dateValue)
      } else if (dateValue && dateValue.$date) {
        if (dateValue.$date.$numberLong) {
          return new Date(Number.parseInt(dateValue.$date.$numberLong))
        } else {
          return new Date(dateValue.$date)
        }
      }
      return new Date(0) // fallback
    } catch (e) {
      console.error("Error parsing date:", e, dateValue)
      return new Date(0)
    }
  }

  // Format date for display
  const formatDate = (dateValue) => {
    try {
      const date = getDateObject(dateValue)
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

  // Get subject name by ID (placeholder - replace with actual subject data)
  function getSubjectName(subjectId) {
    // Check if subjectId is undefined or null
    if (!subjectId) {
      return "Unknown Subject"
    }

    // Map known subject IDs to names
    const subjectMap = {
      "682a7cf80e9ef7db9ea5b1e9": "CCN",
      "682ac6505a34a8b67a6910eb": "Mathematics",
      "6828c914c677fe6c2bf312c0": "Science",
    }

    return (
      subjectMap[subjectId] || `Subject ${typeof subjectId === "string" ? subjectId.substring(0, 6) : subjectId}...`
    )
  }

  // Get student name by ID (placeholder - replace with actual student data)
  function getStudentName(studentId) {
    // Check if studentId is undefined or null
    if (!studentId) {
      return "Unknown Student"
    }

    // Map known student IDs to names
    const studentMap = {
      "6823b1267b92d2877e872448": "John Smith",
      "68289990ff3a6b6bdf9a0780": "Emma Johnson",
      "682a2d5c895fe5d79b54dfc3": "Michael Brown",
    }

    return (
      studentMap[studentId] || `Student ${typeof studentId === "string" ? studentId.substring(0, 6) : studentId}...`
    )
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

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"))
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    )
  }

  // Add this right before the return statement
  if (attendanceData.length > 0 && processedAttendance.length === 0) {
    console.warn("[AttendanceDisplay] Data processing issue: Raw data exists but processed data is empty")
    console.log("[AttendanceDisplay] Raw data sample:", attendanceData[0])
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

      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="md">Attendance Records</Heading>
        <Button leftIcon={<FaSync />} onClick={fetchAttendance} isLoading={loading} colorScheme="blue">
          Refresh
        </Button>
      </Flex>

      {/* Attendance Stats */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
        <Card>
          <CardBody>
            <Flex align="center">
              <Box p={3} bg="green.500" borderRadius="full" color="white" mr={4}>
                <Icon as={FaCheckCircle} boxSize={6} />
              </Box>
              <Stat>
                <StatLabel>Present</StatLabel>
                <StatNumber>{stats.present}</StatNumber>
                <StatHelpText>{stats.presentPercentage}%</StatHelpText>
              </Stat>
            </Flex>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Flex align="center">
              <Box p={3} bg="red.500" borderRadius="full" color="white" mr={4}>
                <Icon as={FaTimesCircle} boxSize={6} />
              </Box>
              <Stat>
                <StatLabel>Absent</StatLabel>
                <StatNumber>{stats.absent}</StatNumber>
                <StatHelpText>{stats.absentPercentage}%</StatHelpText>
              </Stat>
            </Flex>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Flex align="center">
              <Box p={3} bg="yellow.500" borderRadius="full" color="white" mr={4}>
                <Icon as={FaClock} boxSize={6} />
              </Box>
              <Stat>
                <StatLabel>Late</StatLabel>
                <StatNumber>{stats.late}</StatNumber>
                <StatHelpText>{stats.latePercentage}%</StatHelpText>
              </Stat>
            </Flex>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Filters */}
      <Box mb={6} p={4} bg="gray.50" borderRadius="md">
        <Heading size="sm" mb={3}>
          Filters
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          {/* Subject Filter */}
          <Box>
            <Text fontSize="sm" mb={1} fontWeight="medium">
              Subject
            </Text>
            <Select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              size="sm"
              icon={<FaFilter />}
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </Select>
          </Box>

          {/* Date Filter */}
          <Box>
            <Text fontSize="sm" mb={1} fontWeight="medium">
              Date Range
            </Text>
            <Select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              size="sm"
              icon={<FaCalendarAlt />}
            >
              <option value="all">All Dates</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
            </Select>
          </Box>

          {/* Search */}
          <Box>
            <Text fontSize="sm" mb={1} fontWeight="medium">
              Search Notes
            </Text>
            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none">
                <FaSearch color="gray.300" />
              </InputLeftElement>
              <Input placeholder="Search notes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </InputGroup>
          </Box>
        </SimpleGrid>

        {/* Active Filters */}
        {(selectedSubject !== "all" || dateFilter !== "all" || searchTerm) && (
          <Flex mt={3} wrap="wrap" gap={2}>
            <Text fontSize="sm" fontWeight="medium" mr={1}>
              Active Filters:
            </Text>
            {selectedSubject !== "all" && (
              <Tag size="sm" colorScheme="blue" borderRadius="full">
                <TagLabel>Subject: {getSubjectName(selectedSubject)}</TagLabel>
              </Tag>
            )}
            {dateFilter !== "all" && (
              <Tag size="sm" colorScheme="purple" borderRadius="full">
                <TagLabel>{dateFilter === "thisWeek" ? "This Week" : "This Month"}</TagLabel>
              </Tag>
            )}
            {searchTerm && (
              <Tag size="sm" colorScheme="green" borderRadius="full">
                <TagLabel>Search: "{searchTerm}"</TagLabel>
              </Tag>
            )}
          </Flex>
        )}
      </Box>

      {/* Attendance Records */}
      {sortedAttendance.length === 0 ? (
        <Box textAlign="center" p={8} bg="white" borderRadius="md" boxShadow="sm">
          <Text fontSize="lg">No attendance records found.</Text>
          <Text color="gray.500" mt={2}>
            {selectedSubject !== "all" || dateFilter !== "all" || searchTerm
              ? "Try changing your filters to see more results."
              : "Click 'Refresh' to check for attendance records in your database."}
          </Text>
          <Button leftIcon={<FaSync />} onClick={fetchAttendance} mt={4} colorScheme="blue">
            Refresh Data
          </Button>
        </Box>
      ) : (
        <Box bg="white" borderRadius="md" boxShadow="sm" overflowX="auto">
          <Flex justify="space-between" align="center" p={4} borderBottomWidth="1px">
            <Text fontWeight="medium">
              Showing {sortedAttendance.length} of {processedAttendance.length} records
            </Text>
            <Button
              size="sm"
              leftIcon={sortDirection === "desc" ? <FaSortAmountDown /> : <FaSortAmountUp />}
              onClick={toggleSortDirection}
              variant="outline"
            >
              {sortDirection === "desc" ? "Newest First" : "Oldest First"}
            </Button>
          </Flex>

          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>Date</Th>
                <Th>Student</Th>
                <Th>Subject</Th>
                <Th>Status</Th>
                <Th>Notes</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sortedAttendance.map((record) => (
                <Tr key={record.id}>
                  <Td>{formatDate(record.date)}</Td>
                  <Td>{getStudentName(record.studentId)}</Td>
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
