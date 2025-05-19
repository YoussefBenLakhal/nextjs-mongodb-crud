"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  HStack,
  Spinner,
  Alert,
  AlertIcon,
} from "@chakra-ui/react"
import {
  FaChalkboardTeacher,
  FaUserGraduate,
  FaBook,
  FaCalendarCheck,
  FaUserCircle,
  FaSignOutAlt,
  FaChevronDown,
} from "react-icons/fa"
import { useRouter } from "next/navigation"
import ClassesList from "./components/ClassesList"
import StudentsList from "./components/StudentsList"
import SubjectsList from "./components/SubjectsList"
import AttendanceManager from "./components/AttendanceManager"
import AssessmentManager from "./components/AssessmentManager"
import ConnectionStatus from "./components/ConnectionStatus"

export default function ClientDashboard({ user }) {
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [connectionError, setConnectionError] = useState(false)
  const [loading, setLoading] = useState({
    classes: true,
    students: false,
    subjects: false, // Start with false to prevent immediate loading indicator
    connectionTest: false,
    logout: false,
  })
  const [errors, setErrors] = useState({
    classes: null,
    students: null,
    subjects: null,
  })
  const [activeTab, setActiveTab] = useState(0)
  const router = useRouter()
  const toast = useToast()

  // Use refs to prevent multiple fetches
  const subjectsFetchedRef = useRef(false)
  const initialLoadCompletedRef = useRef(false)
  const fetchTimeoutRef = useRef(null)

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

  // Test connection to the server and database
  const testConnection = async () => {
    setLoading((prev) => ({ ...prev, connectionTest: true }))
    setConnectionError(false)

    try {
      const response = await fetch("/api/connection-test", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("Connection test failed")
      }

      const data = await response.json()

      if (!data.database.connected) {
        toast({
          title: "Database Connection Issue",
          description: `Could not connect to the database: ${data.database.error}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        })
        setConnectionError(true)
        return false
      }

      toast({
        title: "Connection Test Successful",
        description: "Server and database are running correctly.",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      return true
    } catch (error) {
      console.error("Connection test error:", error)
      toast({
        title: "Connection Error",
        description: "Could not connect to the server. Please check if the server is running.",
        status: "error",
        duration: null,
        isClosable: true,
      })
      setConnectionError(true)
      return false
    } finally {
      setLoading((prev) => ({ ...prev, connectionTest: false }))
    }
  }

  // Fetch teacher's classes
  useEffect(() => {
    async function fetchClasses() {
      try {
        console.log("[ClientDashboard] Fetching classes...")
        setLoading((prev) => ({ ...prev, classes: true }))
        setErrors((prev) => ({ ...prev, classes: null }))

        const response = await fetch("/api/classes", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch classes")
        }

        const data = await response.json()
        console.log(`[ClientDashboard] Fetched ${data.classes?.length || 0} classes`)
        setClasses(data.classes || [])
      } catch (error) {
        console.error("[ClientDashboard] Error fetching classes:", error)
        setErrors((prev) => ({ ...prev, classes: error.message }))
        toast({
          title: "Error",
          description: "Failed to load classes. Please try again.",
          status: "error",
          duration: 3000,
          isClosable: true,
        })

        // Use fallback data if fetch fails
        setClasses([
          {
            _id: "fallback1",
            name: "Class 10A",
            grade: "10",
            section: "A",
            studentCount: 25,
          },
          {
            _id: "fallback2",
            name: "Class 11B",
            grade: "11",
            section: "B",
            studentCount: 22,
          },
        ])
      } finally {
        setLoading((prev) => ({ ...prev, classes: false }))
      }
    }

    fetchClasses()
  }, [toast])

  // Fetch subjects when needed - memoized to prevent recreation on each render
  const fetchSubjects = useCallback(
    async (force = false) => {
      // Clear any existing timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
        fetchTimeoutRef.current = null
      }

      // Only fetch if we haven't fetched yet or if force is true
      if (subjectsFetchedRef.current && !force) {
        console.log("[ClientDashboard] Subjects already fetched, skipping fetch")
        return
      }

      if (loading.subjects && !force) {
        console.log("[ClientDashboard] Already fetching subjects, skipping fetch")
        return
      }

      console.log("[ClientDashboard] Fetching subjects...")
      setLoading((prev) => ({ ...prev, subjects: true }))
      setErrors((prev) => ({ ...prev, subjects: null }))

      // Set a timeout to prevent infinite loading
      fetchTimeoutRef.current = setTimeout(() => {
        console.log("[ClientDashboard] Subjects fetch timeout - resetting loading state")
        setLoading((prev) => ({ ...prev, subjects: false }))
        setErrors((prev) => ({ ...prev, subjects: "Request timed out. Please try again." }))

        // Use fallback data
        if (subjects.length === 0) {
          setSubjects([
            {
              _id: "fallback1",
              name: "Mathematics",
              code: "MATH101",
              description: "Introduction to algebra, geometry, and calculus",
              classId: "fallback1",
            },
            {
              _id: "fallback2",
              name: "Science",
              code: "SCI101",
              description: "Basic principles of physics, chemistry, and biology",
              classId: "fallback1",
            },
          ])
        }
      }, 10000) // 10 second timeout

      try {
        // Add cache-busting parameter
        const timestamp = Date.now()
        const response = await fetch(`/api/subjects?t=${timestamp}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          cache: "no-store",
        })

        // Clear the timeout since we got a response
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current)
          fetchTimeoutRef.current = null
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch subjects: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log(`[ClientDashboard] Fetched ${data.subjects?.length || 0} subjects`)

        if (!data.subjects) {
          throw new Error("No subjects data returned from API")
        }

        setSubjects(data.subjects)

        // Mark as fetched to prevent additional fetches
        subjectsFetchedRef.current = true
      } catch (error) {
        console.error("[ClientDashboard] Error fetching subjects:", error)
        setErrors((prev) => ({ ...prev, subjects: error.message }))

        // Only show toast for user-initiated refreshes
        if (force) {
          toast({
            title: "Error",
            description: `Failed to load subjects: ${error.message}`,
            status: "error",
            duration: 5000,
            isClosable: true,
          })
        }

        // Use fallback data if fetch fails and we don't have any subjects
        if (subjects.length === 0) {
          setSubjects([
            {
              _id: "fallback1",
              name: "Mathematics",
              code: "MATH101",
              description: "Introduction to algebra, geometry, and calculus",
              classId: "fallback1",
            },
            {
              _id: "fallback2",
              name: "Science",
              code: "SCI101",
              description: "Basic principles of physics, chemistry, and biology",
              classId: "fallback1",
            },
          ])
        }
      } finally {
        // Clear the timeout if it's still active
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current)
          fetchTimeoutRef.current = null
        }

        setLoading((prev) => ({ ...prev, subjects: false }))
      }
    },
    [loading.subjects, toast, subjects],
  )

  // Manual refresh function for subjects
  const handleRefreshSubjects = () => {
    console.log("[ClientDashboard] Manually refreshing subjects")
    subjectsFetchedRef.current = false // Reset the fetched flag
    fetchSubjects(true) // Force refresh
  }

  // Fetch subjects on component mount with a slight delay
  useEffect(() => {
    // Only run this effect once on mount
    if (!initialLoadCompletedRef.current) {
      console.log("[ClientDashboard] Initial load - fetching subjects automatically")
      // Add a small delay to ensure the component is fully mounted
      const timer = setTimeout(() => {
        fetchSubjects()
      }, 500)

      initialLoadCompletedRef.current = true

      return () => clearTimeout(timer)
    }
  }, [fetchSubjects])

  // Also fetch subjects when the subjects tab is selected (as a backup)
  useEffect(() => {
    if (activeTab === 2 && !loading.subjects) {
      console.log("[ClientDashboard] Subjects tab selected, checking if we need to fetch...")
      if (!subjectsFetchedRef.current || subjects.length === 0) {
        fetchSubjects()
      }
    }
  }, [activeTab, loading.subjects, fetchSubjects, subjects])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [])

  // Handle tab change
  const handleTabChange = (index) => {
    setActiveTab(index)
  }

  // Stats for the dashboard
  const stats = [
    {
      label: "Classes",
      value: Array.isArray(classes) ? classes.length : 0,
      icon: FaChalkboardTeacher,
      color: "blue.500",
      loading: loading.classes,
      error: errors.classes,
    },
    {
      label: "Students",
      value: Array.isArray(classes) ? classes.reduce((acc, cls) => acc + (cls.students?.length || 0), 0) : 0,
      icon: FaUserGraduate,
      color: "green.500",
      loading: loading.students,
      error: errors.students,
    },
    {
      label: "Subjects",
      value: Array.isArray(subjects) ? subjects.length : 0,
      icon: FaBook,
      color: "purple.500",
      loading: loading.subjects,
      error: errors.subjects,
    },
    {
      label: "Today's Sessions",
      value: "N/A",
      icon: FaCalendarCheck,
      color: "orange.500",
      loading: false,
      error: null,
    },
  ]

  return (
    <Container maxW="container.xl" py={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="xl">
          Teacher Dashboard
        </Heading>

        <Menu>
          <MenuButton as={Button} rightIcon={<FaChevronDown />} colorScheme="purple" variant="outline">
            <HStack spacing={2}>
              <Avatar size="xs" icon={<FaUserCircle />} bg="purple.500" />
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

      <Text fontSize="lg" mb={8}>
        Welcome back, {user.name}! Here's an overview of your teaching activities.
      </Text>

      {/* Connection Status Component */}
      <ConnectionStatus />

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        {stats.map((stat, index) => (
          <Card key={index} bg={bgColor} borderWidth="1px" borderColor={borderColor} shadow="md">
            <CardBody>
              <Flex align="center" justify="space-between">
                <Flex align="center">
                  <Box p={3} bg={stat.color} borderRadius="full" color="white" mr={4}>
                    <Icon as={stat.icon} boxSize={6} />
                  </Box>
                  <Stat>
                    <StatLabel fontSize="sm">{stat.label}</StatLabel>
                    <StatNumber fontSize="2xl">
                      {stat.loading ? (
                        <Spinner size="sm" color={stat.color} mr={2} />
                      ) : stat.error ? (
                        <Text as="span" fontSize="md" color="red.500">
                          Error
                        </Text>
                      ) : (
                        stat.value
                      )}
                    </StatNumber>
                    <StatHelpText>Academic Year 2024-2025</StatHelpText>
                  </Stat>
                </Flex>
              </Flex>
              {stat.error && (
                <Alert status="error" mt={2} size="sm" fontSize="xs">
                  <AlertIcon />
                  {stat.error}
                </Alert>
              )}
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {/* Main Content Tabs */}
      <Card bg={bgColor} borderWidth="1px" borderColor={borderColor} shadow="md">
        <CardHeader p={0}>
          <Tabs colorScheme="blue" isLazy={false} index={activeTab} onChange={handleTabChange}>
            <TabList px={4}>
              <Tab>Classes</Tab>
              <Tab>Students</Tab>
              <Tab>Subjects</Tab>
              <Tab>Attendance</Tab>
              <Tab>Grades</Tab>
            </TabList>

            <TabPanels>
              {/* Classes Tab */}
              <TabPanel>
                <ClassesList classes={classes} setClasses={setClasses} loading={loading.classes} />
              </TabPanel>

              {/* Students Tab */}
              <TabPanel>
                <StudentsList classes={classes} loading={loading.students} />
              </TabPanel>

              {/* Subjects Tab */}
              <TabPanel>
                <SubjectsList
                  classes={classes}
                  subjects={subjects}
                  setSubjects={setSubjects}
                  loading={loading.subjects}
                  fetchSubjects={fetchSubjects}
                />
              </TabPanel>

              {/* Attendance Tab */}
              <TabPanel>
                <AttendanceManager classes={classes} subjects={subjects} fetchSubjects={fetchSubjects} />
              </TabPanel>

              {/* Grades Tab */}
              <TabPanel>
                <AssessmentManager classes={classes} subjects={subjects} fetchSubjects={fetchSubjects} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardHeader>
      </Card>
    </Container>
  )
}
