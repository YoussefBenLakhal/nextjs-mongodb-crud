"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  HStack,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  ButtonGroup,
} from "@chakra-ui/react"
import {
  FaBook,
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaUserCircle,
  FaSignOutAlt,
  FaChevronDown,
  FaSync,
  FaExclamationTriangle,
  FaBug,
  FaDatabase,
} from "react-icons/fa"
import { useRouter } from "next/navigation"
import GradesDisplay from "./components/GradesDisplay"
import AttendanceDisplay from "./components/AttendanceDisplay"
import SubjectsDisplay from "./components/SubjectsDisplay"
import ConnectionStatus from "./components/ConnectionStatus"

export default function ClientDashboard({ user }) {
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [grades, setGrades] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState({
    classes: true,
    subjects: true,
    grades: true,
    attendance: true,
    logout: false,
    dbTest: false,
  })
  const [error, setError] = useState(null)
  const [apiStatus, setApiStatus] = useState({
    missingEndpoints: false,
    message: "",
  })
  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState({
    apiResponses: {},
    errors: {},
    dbTest: null,
  })
  const [activeTab, setActiveTab] = useState(0)
  const router = useRouter()
  const toast = useToast()

  const bgColor = useColorModeValue("white", "gray.800")
  const borderColor = useColorModeValue("gray.200", "gray.700")

  // Handle logout
  const handleLogout = async () => {
    try {
      setLoading((prev) => ({ ...prev, logout: true }))

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Logout failed")
      }

      toast({
        title: "Logged out successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      // Redirect to login page
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Logout failed",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading((prev) => ({ ...prev, logout: false }))
    }
  }

  // Test database connection
  const testDatabaseConnection = async () => {
    try {
      setLoading((prev) => ({ ...prev, dbTest: true }))
      console.log("[ClientDashboard] Testing database connection...")

      const response = await fetch("/api/test-db", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      })

      const data = await response.json()
      console.log("[ClientDashboard] Database test response:", data)

      // Store the response for debugging
      setDebugInfo((prev) => ({
        ...prev,
        dbTest: data,
      }))

      if (data.success) {
        toast({
          title: "Database Connection Successful",
          description: `Connected to ${data.database.name} with ${data.database.collections.length} collections.`,
          status: "success",
          duration: 5000,
          isClosable: true,
        })
      } else {
        toast({
          title: "Database Connection Failed",
          description: data.error || "Unknown error",
          status: "error",
          duration: 5000,
          isClosable: true,
        })
      }

      return data
    } catch (error) {
      console.error("[ClientDashboard] Database test error:", error)

      const errorInfo = {
        success: false,
        error: error.message,
        stack: error.stack,
      }

      setDebugInfo((prev) => ({
        ...prev,
        dbTest: errorInfo,
      }))

      toast({
        title: "Database Test Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })

      return errorInfo
    } finally {
      setLoading((prev) => ({ ...prev, dbTest: false }))
    }
  }

  // Fetch subjects with multiple fallbacks - Memoized to prevent recreation
  const fetchSubjects = useCallback(
    async (showToast = false) => {
      try {
        console.log("[ClientDashboard] Fetching subjects...")
        setLoading((prev) => ({ ...prev, subjects: true }))

        // Add cache-busting parameter
        const timestamp = Date.now()

        // FIXED: Use the correct API endpoint path - /api/student/subjects instead of /api/subjects
        const apiEndpoints = [
          `/api/student/subjects?t=${timestamp}`, // Primary endpoint
          `/api/subjects?t=${timestamp}`, // Fallback endpoint
          `/api/seed-subjects?t=${timestamp}`, // Seed data endpoint
        ]

        let subjectsData = null
        const errorMessages = []

        // Try each endpoint until one works
        for (const endpoint of apiEndpoints) {
          try {
            console.log(`[ClientDashboard] Trying endpoint: ${endpoint}`)

            const response = await fetch(endpoint, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                Pragma: "no-cache",
                Expires: "0",
              },
              cache: "no-store",
              credentials: "include", // Important for auth
            })

            console.log(`[ClientDashboard] ${endpoint} response status: ${response.status}`)

            if (!response.ok) {
              const errorMsg = `${endpoint} returned status ${response.status}`
              console.error(`[ClientDashboard] ${errorMsg}`)
              errorMessages.push(errorMsg)
              continue // Try next endpoint
            }

            const data = await response.json()
            console.log(`[ClientDashboard] ${endpoint} returned data:`, data)

            if (data.subjects && Array.isArray(data.subjects)) {
              console.log(`[ClientDashboard] Successfully fetched ${data.subjects.length} subjects from ${endpoint}`)

              // Filter out any hardcoded subjects (those with IDs starting with "subj" or "fallback")
              const filteredSubjects = data.subjects.filter(
                (subject) => !String(subject._id).startsWith("subj") && !String(subject._id).startsWith("fallback"),
              )

              subjectsData = filteredSubjects
              console.log(`[ClientDashboard] After filtering hardcoded subjects: ${filteredSubjects.length} subjects`)

              // Store successful response for debugging
              setDebugInfo((prev) => ({
                ...prev,
                apiResponses: {
                  ...prev.apiResponses,
                  subjects: { endpoint, data: { ...data, subjects: filteredSubjects } },
                },
              }))

              break // Exit the loop if we got valid data
            } else {
              errorMessages.push(`${endpoint} returned invalid data structure`)
            }
          } catch (endpointError) {
            console.error(`[ClientDashboard] Error with ${endpoint}:`, endpointError)
            errorMessages.push(`${endpoint}: ${endpointError.message}`)
          }
        }

        // Store errors for debugging
        setDebugInfo((prev) => ({
          ...prev,
          errors: {
            ...prev.errors,
            subjects: errorMessages,
          },
        }))

        if (subjectsData && subjectsData.length > 0) {
          // We got data from one of the endpoints
          setSubjects(subjectsData)
          setError(null) // Clear any previous errors

          if (showToast) {
            toast({
              title: "Subjects loaded",
              description: `Successfully loaded ${subjectsData.length} subjects.`,
              status: "success",
              duration: 3000,
              isClosable: true,
            })
          }
        } else {
          // All endpoints failed or returned no valid subjects
          console.error("[ClientDashboard] No valid subjects found. Using empty subjects array.")

          // Empty array - NO HARDCODED SUBJECTS
          setSubjects([])

          if (errorMessages.length > 0) {
            setError("Failed to load subjects. No subjects available.")

            setApiStatus({
              missingEndpoints: true,
              message: "API endpoints failed or returned no valid subjects.",
            })

            if (showToast) {
              toast({
                title: "Error loading subjects",
                description: "Failed to load subjects. Please try again later.",
                status: "error",
                duration: 5000,
                isClosable: true,
              })
            }
          } else {
            setError(null)
          }
        }
      } catch (error) {
        console.error("[ClientDashboard] Error fetching subjects:", error)

        // Empty array - NO HARDCODED SUBJECTS
        setSubjects([])
        setError(`Failed to load subjects. No subjects available.`)

        if (showToast) {
          toast({
            title: "Error loading subjects",
            description: error.message,
            status: "error",
            duration: 5000,
            isClosable: true,
          })
        }
      } finally {
        setLoading((prev) => ({ ...prev, subjects: false }))
      }
    },
    [toast],
  )

  // Fetch grades - Memoized to prevent recreation
  const fetchGrades = useCallback(
    async (showToast = false) => {
      try {
        console.log("[ClientDashboard] Fetching grades...")
        setLoading((prev) => ({ ...prev, grades: true }))

        // Add cache-busting parameter
        const timestamp = Date.now()

        const response = await fetch(`/api/student-assessments?t=${timestamp}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          cache: "no-store",
          credentials: "include", // Important for auth
        })

        if (!response.ok) {
          throw new Error("Failed to fetch grades")
        }

        const data = await response.json()
        console.log(`[ClientDashboard] Fetched ${data.grades?.length || 0} grades`)
        setGrades(data.grades || [])

        if (showToast) {
          toast({
            title: "Grades loaded",
            description: `Successfully loaded ${data.grades?.length || 0} grades.`,
            status: "success",
            duration: 3000,
            isClosable: true,
          })
        }
      } catch (error) {
        console.error("[ClientDashboard] Error fetching grades:", error)

        // Empty array - NO HARDCODED GRADES
        setGrades([])

        setApiStatus({
          missingEndpoints: true,
          message: "Some API endpoints are not working. No grades available.",
        })

        if (showToast) {
          toast({
            title: "Error loading grades",
            description: error.message,
            status: "error",
            duration: 5000,
            isClosable: true,
          })
        }
      } finally {
        setLoading((prev) => ({ ...prev, grades: false }))
      }
    },
    [toast],
  )

  // Fetch attendance - Memoized to prevent recreation
  const fetchAttendance = useCallback(
    async (showToast = false) => {
      try {
        console.log("[ClientDashboard] Fetching attendance...")
        setLoading((prev) => ({ ...prev, attendance: true }))

        // Add cache-busting parameter
        const timestamp = Date.now()

        const response = await fetch(`/api/student/attendance?t=${timestamp}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          cache: "no-store",
          credentials: "include", // Important for auth
        })

        if (!response.ok) {
          throw new Error("Failed to fetch attendance")
        }

        const data = await response.json()
        console.log(`[ClientDashboard] Fetched ${data.attendance?.length || 0} attendance records`)
        setAttendance(data.attendance || [])

        if (showToast) {
          toast({
            title: "Attendance loaded",
            description: `Successfully loaded ${data.attendance?.length || 0} attendance records.`,
            status: "success",
            duration: 3000,
            isClosable: true,
          })
        }
      } catch (error) {
        console.error("[ClientDashboard] Error fetching attendance:", error)

        // Empty array - NO HARDCODED ATTENDANCE
        setAttendance([])

        if (showToast) {
          toast({
            title: "Error loading attendance",
            description: error.message,
            status: "error",
            duration: 5000,
            isClosable: true,
          })
        }
      } finally {
        setLoading((prev) => ({ ...prev, attendance: false }))
      }
    },
    [toast],
  )

  // Fetch all data on initial load
  useEffect(() => {
    console.log("[ClientDashboard] Initial data load")
    fetchSubjects()
    fetchGrades()
    fetchAttendance()
  }, [fetchSubjects, fetchGrades, fetchAttendance])

  // Calculate attendance statistics (using real data if available)
  const attendanceStats = {
    present: attendance.filter((a) => a.status === "present").length || 0,
    absent: attendance.filter((a) => a.status === "absent").length || 0,
    late: attendance.filter((a) => a.status === "late").length || 0,
    total: attendance.length || 0,
  }

  // Stats for the dashboard
  const stats = [
    {
      label: "Subjects",
      value: subjects.length,
      icon: FaBook,
      color: "purple.500",
    },
    {
      label: "Classes",
      value: classes.length || 0, // Default to 0 if no classes
      icon: FaCalendarAlt,
      color: "blue.500",
    },
    {
      label: "Attendance Rate",
      value:
        attendanceStats.total > 0 ? `${Math.round((attendanceStats.present / attendanceStats.total) * 100)}%` : "N/A",
      icon: FaCheckCircle,
      color: "green.500",
    },
    {
      label: "Overall Grade",
      value: grades.length > 0 ? calculateOverallGrade() : "N/A",
      icon: FaChartLine,
      color: "orange.500",
    },
  ]

  // Calculate overall grade from all subjects
  function calculateOverallGrade() {
    if (grades.length === 0) return "N/A"

    let totalWeightedScore = 0
    let totalWeight = 0

    grades.forEach((grade) => {
      const percentage = (grade.score / grade.maxScore) * 100
      totalWeightedScore += percentage * grade.weight
      totalWeight += grade.weight
    })

    return totalWeight > 0 ? `${Math.round(totalWeightedScore / totalWeight)}%` : "N/A"
  }

  const isLoading = loading.classes || loading.subjects || loading.grades || loading.attendance

  // Refresh all data
  const refreshData = () => {
    fetchSubjects(true)
    fetchGrades(true)
    fetchAttendance(true)
  }

  // Handle tab change
  const handleTabChange = (index) => {
    setActiveTab(index)
  }

  return (
    <Container maxW="container.xl" py={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="xl">
          Student Dashboard
        </Heading>

        <Flex gap={4}>
          <ButtonGroup>
            <Button
              leftIcon={<FaSync />}
              colorScheme="gray"
              onClick={refreshData}
              isLoading={isLoading}
              title="Refresh data"
            >
              Refresh
            </Button>

            <Button
              leftIcon={<FaDatabase />}
              colorScheme="teal"
              onClick={testDatabaseConnection}
              isLoading={loading.dbTest}
              title="Test database connection"
            >
              Test DB
            </Button>

            <Button
              leftIcon={<FaBug />}
              colorScheme={showDebug ? "red" : "gray"}
              onClick={() => setShowDebug(!showDebug)}
              size="sm"
            >
              {showDebug ? "Hide Debug" : "Debug"}
            </Button>
          </ButtonGroup>

          <Menu>
            <MenuButton as={Button} rightIcon={<FaChevronDown />} colorScheme="blue" variant="outline">
              <HStack spacing={2}>
                <Avatar size="xs" icon={<FaUserCircle />} bg="blue.500" />
                <Text>{user.name}</Text>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FaUserCircle />}>Profile</MenuItem>
              <MenuItem icon={<FaSignOutAlt />} onClick={handleLogout} isDisabled={loading.logout}>
                {loading.logout ? "Logging out..." : "Logout"}
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      <Text fontSize="lg" mb={6}>
        Welcome back, {user.name}! Here's an overview of your academic progress.
      </Text>

      {/* Connection Status Component */}
      <ConnectionStatus />

      {showDebug && (
        <Box mb={6} p={4} bg="gray.50" borderRadius="md" borderWidth="1px">
          <Heading size="sm" mb={2}>
            Debug Information
          </Heading>

          {debugInfo.dbTest && (
            <>
              <Text fontWeight="bold" mb={1}>
                Database Test Results:
              </Text>
              <Box maxH="200px" overflowY="auto" mb={3}>
                <Code p={2} display="block" whiteSpace="pre" overflowX="auto" fontSize="sm">
                  {JSON.stringify(debugInfo.dbTest, null, 2)}
                </Code>
              </Box>
            </>
          )}

          <Text fontWeight="bold" mb={1}>
            API Responses:
          </Text>
          <Box maxH="300px" overflowY="auto" mb={3}>
            <Code p={2} display="block" whiteSpace="pre" overflowX="auto" fontSize="sm">
              {JSON.stringify(debugInfo.apiResponses, null, 2)}
            </Code>
          </Box>

          <Text fontWeight="bold" mb={1}>
            Errors:
          </Text>
          <Box maxH="200px" overflowY="auto">
            <Code p={2} display="block" whiteSpace="pre" overflowX="auto" fontSize="sm">
              {JSON.stringify(debugInfo.errors, null, 2)}
            </Code>
          </Box>
        </Box>
      )}

      {apiStatus.missingEndpoints && (
        <Alert status="warning" mb={6}>
          <AlertIcon as={FaExclamationTriangle} />
          <Box>
            <AlertTitle>API Development in Progress</AlertTitle>
            <AlertDescription>{apiStatus.message}</AlertDescription>
          </Box>
        </Alert>
      )}

      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        {stats.map((stat, index) => (
          <Card key={index} bg={bgColor} borderWidth="1px" borderColor={borderColor} shadow="md">
            <CardBody>
              <Flex align="center">
                <Box p={3} bg={stat.color} borderRadius="full" color="white" mr={4}>
                  <Icon as={stat.icon} boxSize={6} />
                </Box>
                <Stat>
                  <StatLabel fontSize="sm">{stat.label}</StatLabel>
                  <StatNumber fontSize="2xl">{stat.value}</StatNumber>
                  <StatHelpText>Academic Year 2024-2025</StatHelpText>
                </Stat>
              </Flex>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {/* Main Content Tabs */}
      <Card bg={bgColor} borderWidth="1px" borderColor={borderColor} shadow="md">
        <CardHeader p={0}>
          <Tabs colorScheme="blue" isLazy={false} index={activeTab} onChange={handleTabChange}>
            <TabList px={4}>
              <Tab>Grades</Tab>
              <Tab>Attendance</Tab>
              <Tab>Subjects</Tab>
            </TabList>

            <TabPanels>
              {/* Grades Tab */}
              <TabPanel>
                <GradesDisplay subjects={subjects} grades={grades} loading={loading.grades} />
              </TabPanel>

              {/* Attendance Tab */}
              <TabPanel>
                <AttendanceDisplay subjects={subjects} />
              </TabPanel>

              {/* Subjects Tab */}
              <TabPanel>
                <SubjectsDisplay subjects={subjects} grades={grades} loading={loading.subjects} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardHeader>
      </Card>
    </Container>
  )
}