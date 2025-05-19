"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Image,
  Spinner,
  Stack,
  Alert,
  AlertIcon,
} from "@chakra-ui/react"
import { FaGraduationCap, FaChalkboardTeacher, FaBook, FaCalendarAlt, FaChartLine, FaUserFriends } from "react-icons/fa"

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Colors
  const bgColor = useColorModeValue("gray.50", "gray.900")
  const cardBg = useColorModeValue("white", "gray.800")
  const headingColor = useColorModeValue("blue.600", "blue.300")
  const textColor = useColorModeValue("gray.600", "gray.400")
  const buttonColorScheme = useColorModeValue("blue", "purple")

  useEffect(() => {
    async function checkUserSession() {
      try {
        // Check if we have a session cookie
        const cookies = document.cookie.split(";").reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split("=")
          acc[key] = value
          return acc
        }, {})

        const hasSession =
          cookies.session || cookies.token || cookies.auth_session || cookies.authToken || cookies.auth_token

        console.log("HomePage - Checking session:", !!hasSession)

        if (hasSession) {
          // Try to verify the session with the server
          const response = await fetch("/api/auth/session", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          })

          if (response.ok) {
            const data = await response.json()

            if (data.user) {
              console.log("HomePage - User is logged in, redirecting to dashboard")

              // Redirect based on user role
              if (data.user.role === "teacher") {
                router.push("/teacher-dashboard")
              } else if (data.user.role === "student") {
                router.push("/student-dashboard")
              } else {
                router.push("/dashboard")
              }
              return
            }
          }
        }

        // User is not logged in, they can stay on the home page
        console.log("HomePage - User is not logged in")
        setLoading(false)
      } catch (err) {
        console.error("HomePage - Session verification error:", err)
        setError("Failed to verify session. Please try again.")
        setLoading(false)
      }
    }

    checkUserSession()
  }, [router])

  if (loading) {
    return (
      <Flex height="100vh" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text fontSize="lg" fontWeight="medium">
            Loading...
          </Text>
        </VStack>
      </Flex>
    )
  }

  const features = [
    {
      title: "Course Management",
      icon: FaBook,
      description: "Access and manage all your courses in one place.",
    },
    {
      title: "Schedule Planning",
      icon: FaCalendarAlt,
      description: "Plan your academic schedule with our intuitive calendar.",
    },
    {
      title: "Performance Tracking",
      icon: FaChartLine,
      description: "Track your academic performance with detailed analytics.",
    },
    {
      title: "Community",
      icon: FaUserFriends,
      description: "Connect with peers and teachers in a collaborative environment.",
    },
  ]

  return (
    <Box bg={bgColor} minH="100vh">
      {error && (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {/* Hero Section */}
      <Box
        bg="blue.600"
        color="white"
        py={{ base: 16, md: 24 }}
        px={8}
        backgroundImage="linear-gradient(135deg, #3182CE 0%, #2C5282 100%)"
      >
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} alignItems="center">
            <VStack spacing={6} align="flex-start">
              <Heading as="h1" size="2xl" fontWeight="bold" lineHeight="shorter">
                Student Management System
              </Heading>
              <Text fontSize="xl" opacity={0.9}>
                Streamline your educational journey with our comprehensive platform for students and teachers.
              </Text>
              <HStack spacing={4} pt={4}>
                <Button size="lg" colorScheme="whiteAlpha" onClick={() => router.push("/login")}>
                  Login
                </Button>
                <Button size="lg" colorScheme="whiteAlpha" variant="outline" onClick={() => router.push("/register")}>
                  Register
                </Button>
              </HStack>
            </VStack>
            <Box display={{ base: "none", md: "block" }}>
              <Image
                src="/placeholder.svg?height=300&width=400"
                alt="Education illustration"
                borderRadius="lg"
                boxShadow="lg"
              />
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Portal Cards */}
      <Container maxW="container.xl" py={16}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
          <Card bg={cardBg} shadow="xl" borderRadius="lg" overflow="hidden">
            <CardHeader bg="blue.500" py={6}>
              <Flex align="center">
                <Icon as={FaGraduationCap} boxSize={8} color="white" mr={4} />
                <Heading size="lg" color="white">
                  Student Portal
                </Heading>
              </Flex>
            </CardHeader>
            <CardBody p={6}>
              <VStack spacing={4} align="stretch">
                <Text fontSize="md" color={textColor}>
                  Access your courses, assignments, grades, and connect with teachers. Track your academic progress and
                  manage your educational journey.
                </Text>
                <Box pt={4}>
                  <Button
                    colorScheme={buttonColorScheme}
                    size="lg"
                    width="full"
                    onClick={() => router.push("/login?role=student")}
                  >
                    Login as Student
                  </Button>
                </Box>
                <Text fontSize="sm" textAlign="center">
                  New student?{" "}
                  <Button
                    variant="link"
                    colorScheme={buttonColorScheme}
                    onClick={() => router.push("/register?role=student")}
                  >
                    Register here
                  </Button>
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="xl" borderRadius="lg" overflow="hidden">
            <CardHeader bg="purple.500" py={6}>
              <Flex align="center">
                <Icon as={FaChalkboardTeacher} boxSize={8} color="white" mr={4} />
                <Heading size="lg" color="white">
                  Teacher Portal
                </Heading>
              </Flex>
            </CardHeader>
            <CardBody p={6}>
              <VStack spacing={4} align="stretch">
                <Text fontSize="md" color={textColor}>
                  Manage your classes, create assignments, grade student work, and communicate with students. Access
                  powerful teaching tools and analytics.
                </Text>
                <Box pt={4}>
                  <Button
                    colorScheme="purple"
                    size="lg"
                    width="full"
                    onClick={() => router.push("/login?role=teacher")}
                  >
                    Login as Teacher
                  </Button>
                </Box>
                <Text fontSize="sm" textAlign="center">
                  New teacher?{" "}
                  <Button variant="link" colorScheme="purple" onClick={() => router.push("/register?role=teacher")}>
                    Register here
                  </Button>
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Container>

      {/* Features Section */}
      <Box bg={bgColor} py={16}>
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <Heading as="h2" size="xl" color={headingColor} textAlign="center">
              Platform Features
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={10}>
              {features.map((feature, index) => (
                <VStack key={index} bg={cardBg} p={6} borderRadius="lg" shadow="md" spacing={4} align="flex-start">
                  <Icon as={feature.icon} boxSize={10} color="blue.500" />
                  <Heading size="md">{feature.title}</Heading>
                  <Text color={textColor}>{feature.description}</Text>
                </VStack>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Footer */}
      <Box bg={bgColor} py={8}>
        <Container maxW="container.xl">
          <Stack direction={{ base: "column", md: "row" }} spacing={8} justify="space-between" align="center">
            <Text color={textColor}>© 2025 Student Management System. All rights reserved.</Text>
            <HStack spacing={4}>
              <Button variant="link" colorScheme={buttonColorScheme}>
                About
              </Button>
              <Button variant="link" colorScheme={buttonColorScheme}>
                Contact
              </Button>
              <Button variant="link" colorScheme={buttonColorScheme}>
                Privacy Policy
              </Button>
            </HStack>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}
