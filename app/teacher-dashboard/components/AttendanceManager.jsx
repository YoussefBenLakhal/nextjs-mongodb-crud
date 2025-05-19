"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Text,
  HStack,
  IconButton,
  Tooltip,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from "@chakra-ui/react"
import { FaSync, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaClock } from "react-icons/fa"
import AuthDebugger from "../../components/AuthDebugger"

const AttendanceManager = ({ subjects, classes }) => {
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [showAuthDebugger, setShowAuthDebugger] = useState(false)
  const toast = useToast()

  // Form state for new attendance record
  const [newAttendance, setNewAttendance] = useState({
    studentId: "",
    status: "present",
    notes: "",
  })

  // Get subject by code
  const getSubjectByCode = (code) => {
    return subjects.find((s) => s.code === code)
  }

  // Get class by ID
  const getClassById = (id) => {
    return classes.find((c) => c._id === id)
  }

  // Fetch students for selected class
  const fetchStudents = async () => {
    if (!selectedClass) return

    try {
      setLoading(true)
      const response = await fetch(`/api/classes/${selectedClass}/students`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch students: ${response.status}`)
      }

      const data = await response.json()
      console.log("Fetched students:", data.students) // Debug log
      setStudents(data.students || [])
    } catch (error) {
      console.error("Error fetching students:", error)
      toast({
        title: "Error",
        description: `Failed to fetch students: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch attendance records
  const fetchAttendance = async () => {
    if (!selectedClass || !selectedSubject || !selectedDate) return

    try {
      setLoading(true)
      setError(null)

      const subject = getSubjectByCode(selectedSubject)
      if (!subject) {
        throw new Error("Selected subject not found")
      }

      console.log(`Fetching attendance for class ${selectedClass}, subject ${selectedSubject}, date ${selectedDate}`)

      const response = await fetch(
        `/api/attendance?classId=${selectedClass}&date=${selectedDate}&subjectCode=${selectedSubject}`,
      )

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `Failed to fetch attendance: ${response.status}`

        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // If parsing fails, use the raw text
          errorMessage = errorText || errorMessage
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      setAttendance(data.attendance || [])
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

  // Submit new attendance record
  const submitAttendance = async (e) => {
    e.preventDefault()

    if (!selectedClass || !selectedSubject || !selectedDate || !newAttendance.studentId) {
      toast({
        title: "Missing Information",
        description: "Please select class, subject, date, and student",
        status: "warning",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      setSubmitting(true)

      const subject = getSubjectByCode(selectedSubject)
      if (!subject) {
        throw new Error("Selected subject not found")
      }

      const attendanceData = {
        studentId: newAttendance.studentId,
        subjectId: subject._id,
        classId: selectedClass,
        date: new Date(selectedDate),
        status: newAttendance.status,
        notes: newAttendance.notes,
      }

      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attendanceData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to submit attendance: ${response.status}`)
      }

      toast({
        title: "Success",
        description: "Attendance record saved successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      // Reset form
      setNewAttendance({
        studentId: "",
        status: "present",
        notes: "",
      })

      // Refresh attendance data
      fetchAttendance()
    } catch (error) {
      console.error("Error submitting attendance:", error)
      toast({
        title: "Error",
        description: `Failed to save attendance: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate attendance statistics
  const calculateStats = () => {
    if (!attendance || attendance.length === 0) {
      return { present: 0, absent: 0, late: 0, total: 0, presentRate: 0 }
    }

    const present = attendance.filter((a) => a.status === "present").length
    const absent = attendance.filter((a) => a.status === "absent").length
    const late = attendance.filter((a) => a.status === "late").length
    const total = attendance.length
    const presentRate = (present / total) * 100

    return { present, absent, late, total, presentRate }
  }

  // Effect to fetch students when class changes
  useEffect(() => {
    if (selectedClass) {
      fetchStudents()
    }
  }, [selectedClass])

  // Effect to fetch attendance when filters change
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedDate) {
      fetchAttendance()
    }
  }, [selectedClass, selectedSubject, selectedDate])

  // Get student name by ID
  const getStudentName = (studentId) => {
    const student = students.find((s) => s._id === studentId)
    return student ? `${student.firstName} ${student.lastName}` : "Unknown Student"
  }

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
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

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return <FaCheck />
      case "absent":
        return <FaTimes />
      case "late":
        return <FaClock />
      default:
        return null
    }
  }

  const stats = calculateStats()

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Attendance Management</Heading>
        <Button size="sm" onClick={() => setShowAuthDebugger(!showAuthDebugger)}>
          {showAuthDebugger ? "Hide Auth Debug" : "Show Auth Debug"}
        </Button>
      </Flex>

      {showAuthDebugger && <AuthDebugger />}

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
          <Button onClick={fetchAttendance} leftIcon={<FaSync />} size="sm">
            Retry
          </Button>
        </Alert>
      )}

      <Box mb={6} p={4} borderWidth="1px" borderRadius="lg" bg="white">
        <Heading size="md" mb={4}>
          Attendance Filters
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <FormControl>
            <FormLabel>Class</FormLabel>
            <Select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} placeholder="Select Class">
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Subject</FormLabel>
            <Select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              placeholder="Select Subject"
              isDisabled={!selectedClass}
            >
              {subjects
                .filter((s) => !selectedClass || s.classId === selectedClass)
                .map((s) => (
                  <option key={s._id} value={s.code}>
                    {s.name}
                  </option>
                ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Date</FormLabel>
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </FormControl>
        </SimpleGrid>
        <Button
          mt={4}
          colorScheme="blue"
          onClick={fetchAttendance}
          isLoading={loading}
          isDisabled={!selectedClass || !selectedSubject || !selectedDate}
          leftIcon={<FaSync />}
        >
          Load Attendance
        </Button>
      </Box>

      {selectedClass && selectedSubject && selectedDate && (
        <>
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={6}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Students</StatLabel>
                  <StatNumber>{stats.total}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Present</StatLabel>
                  <StatNumber>{stats.present}</StatNumber>
                  <StatHelpText>{stats.total > 0 ? `${Math.round(stats.presentRate)}%` : "N/A"}</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Absent</StatLabel>
                  <StatNumber>{stats.absent}</StatNumber>
                  <StatHelpText>
                    {stats.total > 0 ? `${Math.round((stats.absent / stats.total) * 100)}%` : "N/A"}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Late</StatLabel>
                  <StatNumber>{stats.late}</StatNumber>
                  <StatHelpText>
                    {stats.total > 0 ? `${Math.round((stats.late / stats.total) * 100)}%` : "N/A"}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          <Box mb={6} p={4} borderWidth="1px" borderRadius="lg" bg="white">
            <Heading size="md" mb={4}>
              Add Attendance Record
            </Heading>
            <form onSubmit={submitAttendance}>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Student</FormLabel>
                  <Select
                    value={newAttendance.studentId}
                    onChange={(e) => setNewAttendance({ ...newAttendance, studentId: e.target.value })}
                    placeholder="Select Student"
                  >
                    {students.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.name || `${student.firstName || ""} ${student.lastName || ""}`}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={newAttendance.status}
                    onChange={(e) => setNewAttendance({ ...newAttendance, status: e.target.value })}
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="excused">Excused</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Input
                    value={newAttendance.notes}
                    onChange={(e) => setNewAttendance({ ...newAttendance, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </FormControl>
              </SimpleGrid>
              <Button mt={4} colorScheme="green" type="submit" isLoading={submitting} leftIcon={<FaPlus />}>
                Add Record
              </Button>
            </form>
          </Box>

          <Heading size="md" mb={4}>
            Attendance Records
          </Heading>
          {loading ? (
            <Flex justify="center" align="center" p={8}>
              <Spinner size="xl" />
            </Flex>
          ) : attendance.length === 0 ? (
            <Box textAlign="center" p={8} borderWidth="1px" borderRadius="lg">
              <Text mb={4}>No attendance records found for this class, subject, and date.</Text>
              <Button leftIcon={<FaSync />} onClick={fetchAttendance}>
                Refresh
              </Button>
            </Box>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Student</Th>
                    <Th>Status</Th>
                    <Th>Notes</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {attendance.map((record) => (
                    <Tr key={record._id}>
                      <Td>{getStudentName(record.studentId)}</Td>
                      <Td>
                        <HStack>
                          {getStatusIcon(record.status)}
                          <Badge colorScheme={getStatusColor(record.status)}>{record.status}</Badge>
                        </HStack>
                      </Td>
                      <Td>{record.notes || "—"}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <Tooltip label="Edit">
                            <IconButton
                              icon={<FaEdit />}
                              size="sm"
                              aria-label="Edit"
                              colorScheme="blue"
                              onClick={() => {
                                // Edit functionality would go here
                                toast({
                                  title: "Edit",
                                  description: "Edit functionality not implemented yet",
                                  status: "info",
                                })
                              }}
                            />
                          </Tooltip>
                          <Tooltip label="Delete">
                            <IconButton
                              icon={<FaTrash />}
                              size="sm"
                              aria-label="Delete"
                              colorScheme="red"
                              onClick={() => {
                                // Delete functionality would go here
                                toast({
                                  title: "Delete",
                                  description: "Delete functionality not implemented yet",
                                  status: "info",
                                })
                              }}
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </>
      )}
    </Box>
  )
}

export default AttendanceManager
