"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useToast,
  Flex,
  Spinner,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Badge,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
} from "@chakra-ui/react"
import { FaPlus, FaSearch, FaEdit, FaTrash, FaUserPlus, FaSync, FaEllipsisV, FaUserGraduate } from "react-icons/fa"
import CreateStudentModal from "./CreateStudentModal"

const StudentsList = ({ classes }) => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedClass, setSelectedClass] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [totalStudents, setTotalStudents] = useState(0)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError(null)

      let url = "/api/students"
      const params = new URLSearchParams()

      if (selectedClass) {
        params.append("classId", selectedClass)
      }

      if (searchQuery) {
        params.append("search", searchQuery)
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      console.log("[StudentsList] Fetching students from:", url)

      const response = await fetch(url)
      console.log("[StudentsList] Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => {
          console.error("[StudentsList] Failed to parse error response")
          return {}
        })
        console.error("[StudentsList] Error response data:", errorData)
        throw new Error(errorData.error || `Failed to fetch students: ${response.status}`)
      }

      const data = await response.json()
      console.log("[StudentsList] Received data with", data.students?.length || 0, "students")

      // Log the first student to see its structure
      if (data.students?.length > 0) {
        console.log("[StudentsList] First student structure:", data.students[0])
      }

      setStudents(data.students || [])
      setTotalStudents(data.total || 0)
    } catch (error) {
      console.error("[StudentsList] Error fetching students:", error)
      setError(`Failed to load students: ${error.message}`)
      toast({
        title: "Error",
        description: `Failed to load students: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // Add this function after the fetchStudents function
  const checkDatabaseConnection = async () => {
    try {
      const response = await fetch("/api/connection-diagnostic")
      const data = await response.json()

      console.log("[StudentsList] Database connection status:", data)

      toast({
        title: data.connected ? "Database Connected" : "Database Connection Issue",
        description: data.message || data.error,
        status: data.connected ? "success" : "error",
        duration: 5000,
        isClosable: true,
      })

      return data.connected
    } catch (error) {
      console.error("[StudentsList] Error checking database connection:", error)
      toast({
        title: "Connection Check Failed",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
      return false
    }
  }

  // Effect to fetch students when filters change
  useEffect(() => {
    fetchStudents()
  }, [selectedClass])

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault()
    fetchStudents()
  }

  // Handle student creation
  const handleStudentCreated = (newStudent) => {
    // If the new student is in the currently selected class, add it to the list
    if (!selectedClass || newStudent.classId === selectedClass) {
      setStudents((prevStudents) => [...prevStudents, newStudent])
      setTotalStudents((prev) => prev + 1)
    }
    // Refresh the list to ensure we have the latest data
    fetchStudents()
  }

  // Handle student removal from class
  const handleRemoveFromClass = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove ${studentName} from this class?`)) {
      return
    }

    try {
      const response = await fetch(`/api/classes/${selectedClass}/students?studentId=${studentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        // If student has records and force is required
        if (response.status === 400 && errorData.requiresForce) {
          const forceRemove = window.confirm(
            `${studentName} has ${errorData.attendanceCount} attendance records and ${errorData.gradesCount} grades. Removing will delete these records. Continue?`,
          )

          if (forceRemove) {
            const forceResponse = await fetch(
              `/api/classes/${selectedClass}/students?studentId=${studentId}&force=true`,
              {
                method: "DELETE",
              },
            )

            if (!forceResponse.ok) {
              const forceErrorData = await forceResponse.json().catch(() => ({}))
              throw new Error(forceErrorData.error || `Failed to remove student: ${forceResponse.status}`)
            }

            toast({
              title: "Success",
              description: `Removed ${studentName} and deleted associated records`,
              status: "success",
              duration: 3000,
              isClosable: true,
            })

            // Refresh the list
            fetchStudents()
            return
          } else {
            // User canceled force removal
            return
          }
        }

        throw new Error(errorData.error || `Failed to remove student: ${response.status}`)
      }

      toast({
        title: "Success",
        description: `Removed ${studentName} from class`,
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      // Refresh the list
      fetchStudents()
    } catch (error) {
      console.error("Error removing student:", error)
      toast({
        title: "Error",
        description: `Failed to remove student: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // Get student name
  const getStudentName = (student) => {
    if (student.name) return student.name
    if (student.firstName || student.lastName) {
      return `${student.firstName || ""} ${student.lastName || ""}`.trim()
    }
    return "Unnamed Student"
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Students</Heading>
        <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={onOpen} isDisabled={!classes.length}>
          Add Student
        </Button>
      </Flex>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription display="block">
              {error}
              <Text fontSize="sm" mt={1}>
                Check the browser console for more details.
              </Text>
            </AlertDescription>
          </Box>
          <HStack>
            <Button onClick={checkDatabaseConnection} size="sm" colorScheme="yellow">
              Check DB
            </Button>
            <Button onClick={fetchStudents} leftIcon={<FaSync />} size="sm">
              Retry
            </Button>
          </HStack>
        </Alert>
      )}

      <Box mb={4}>
        <Flex direction={{ base: "column", md: "row" }} gap={4}>
          <Box flex="1">
            <form onSubmit={handleSearch}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaSearch color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
            </form>
          </Box>
          <Select
            placeholder="All Classes"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            maxW={{ base: "full", md: "300px" }}
          >
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name}
              </option>
            ))}
          </Select>
          <Button leftIcon={<FaSearch />} colorScheme="blue" onClick={handleSearch}>
            Search
          </Button>
        </Flex>
      </Box>

      {loading ? (
        <Flex justify="center" align="center" p={8}>
          <Spinner size="xl" />
        </Flex>
      ) : students.length === 0 ? (
        <Box textAlign="center" p={8} borderWidth="1px" borderRadius="lg">
          <Text mb={4}>No students found.</Text>
          {selectedClass ? (
            <Button leftIcon={<FaUserPlus />} colorScheme="blue" onClick={onOpen}>
              Add Student to Class
            </Button>
          ) : (
            <Text fontSize="sm" color="gray.500">
              Select a class to add students
            </Text>
          )}
        </Box>
      ) : (
        <>
          <Text mb={4}>
            Showing {students.length} of {totalStudents} students
            {selectedClass && classes.find((c) => c._id === selectedClass)
              ? ` in ${classes.find((c) => c._id === selectedClass).name}`
              : ""}
          </Text>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Class</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {students.map((student) => (
                  <Tr key={student._id}>
                    <Td>
                      <HStack>
                        <Text>{getStudentName(student)}</Text>
                        {student.userId && (
                          <Tooltip label="Has user account">
                            <Badge colorScheme="green">User</Badge>
                          </Tooltip>
                        )}
                      </HStack>
                    </Td>
                    <Td>{student.email}</Td>
                    <Td>
                      {student.classId && classes.find((c) => c._id === student.classId)
                        ? classes.find((c) => c._id === student.classId).name
                        : "No Class"}
                    </Td>
                    <Td>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          aria-label="Options"
                          icon={<FaEllipsisV />}
                          variant="ghost"
                          size="sm"
                        />
                        <MenuList>
                          <MenuItem icon={<FaEdit />}>Edit Student</MenuItem>
                          <MenuItem
                            icon={<FaUserGraduate />}
                            onClick={() => {
                              // View grades functionality would go here
                              toast({
                                title: "View Grades",
                                description: "This functionality is not implemented yet",
                                status: "info",
                              })
                            }}
                          >
                            View Grades
                          </MenuItem>
                          <MenuDivider />
                          {selectedClass && (
                            <MenuItem
                              icon={<FaTrash />}
                              color="red.500"
                              onClick={() => handleRemoveFromClass(student._id, getStudentName(student))}
                            >
                              Remove from Class
                            </MenuItem>
                          )}
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </>
      )}

      <CreateStudentModal isOpen={isOpen} onClose={onClose} classes={classes} onStudentCreated={handleStudentCreated} />
    </Box>
  )
}

export default StudentsList
