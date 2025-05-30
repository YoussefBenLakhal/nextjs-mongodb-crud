"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Spinner,
  useDisclosure,
  useToast,
  IconButton,
  Badge,
  Alert,
  AlertIcon,
  Tooltip,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Code,
} from "@chakra-ui/react"
import { FaPlus, FaEdit, FaTrash, FaSync, FaBug, FaTools } from "react-icons/fa"
import AssessmentDebugger from "./AssessmentDebugger"

const AssessmentManager = ({ classes, subjects, fetchSubjects }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [students, setStudents] = useState([])
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState({
    students: false,
    assessments: false,
    submit: false,
    fixIds: false,
  })
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    title: "",
    maxScore: 100,
    weight: 1,
    date: new Date().toISOString().split("T")[0],
    studentAssessments: [],
  })
  const [filteredSubjects, setFilteredSubjects] = useState([])
  const [showDebugger, setShowDebugger] = useState(false)
  const [fixResults, setFixResults] = useState(null)
  const [debugInfo, setDebugInfo] = useState({
    apiResponse: null,
    requestUrl: "",
    submissionData: null,
    submissionResults: null,
    lastError: null,
    students: null,
  })
  const toast = useToast()

  // Filter subjects when selected class changes
  useEffect(() => {
    if (selectedClass) {
      const filtered = subjects.filter((subject) => subject.classId === selectedClass)
      setFilteredSubjects(filtered)
      setSelectedSubject("")
    } else {
      setFilteredSubjects([])
      setSelectedSubject("")
    }
  }, [selectedClass, subjects])

  // Fetch students when selected class changes
  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass)
    } else {
      setStudents([])
    }
  }, [selectedClass])

  // Fetch assessments when selected subject changes
  useEffect(() => {
    if (selectedSubject && selectedClass) {
      fetchAssessments({ subjectId: selectedSubject, classId: selectedClass })
    } else {
      setAssessments([])
    }
  }, [selectedSubject, selectedClass])

  // Fetch students for a class
  const fetchStudents = async (classId) => {
    setLoading((prev) => ({ ...prev, students: true }))
    setError(null)

    try {
      console.log("[AssessmentManager] Fetching students for class:", classId)
      const response = await fetch(`/api/classes/${classId}/students`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch students")
      }

      const data = await response.json()
      console.log(`[AssessmentManager] Fetched ${data.students?.length || 0} students`)

      // Store students in debug info
      setDebugInfo((prev) => ({
        ...prev,
        students: data.students,
      }))

      setStudents(data.students || [])

      // Initialize student assessments
      setFormData((prev) => ({
        ...prev,
        studentAssessments: (data.students || []).map((student) => ({
          studentId: student._id,
          name: student.name,
          email: student.email, // Include email for better matching
          score: "",
          comment: "",
        })),
      }))
    } catch (error) {
      console.error("[AssessmentManager] Error fetching students:", error)
      setError("Failed to load students. Please try again.")
      toast({
        title: "Error",
        description: "Failed to load students. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading((prev) => ({ ...prev, students: false }))
    }
  }

  // Fetch assessments for a subject
  const fetchAssessments = async (filters = {}) => {
    setLoading((prev) => ({ ...prev, assessments: true }))
    setError(null)

    try {
      // Build query string from filters
      const queryParams = new URLSearchParams()
      if (filters.studentId) queryParams.set("studentId", filters.studentId)
      if (filters.subjectId) queryParams.set("subjectId", filters.subjectId)
      if (filters.classId) queryParams.set("classId", filters.classId)

      // Add timestamp to prevent caching
      queryParams.set("_t", Date.now())

      const url = `/api/student-assessments?${queryParams.toString()}`
      console.log("[AssessmentManager] Fetching assessments from URL:", url)
      setDebugInfo((prev) => ({ ...prev, requestUrl: url }))

      const response = await fetch(url, {
        method: "GET",
        credentials: "include", // Important: include cookies with the request
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to load assessments")
      }

      const data = await response.json()
      setDebugInfo((prev) => ({ ...prev, apiResponse: data }))
      setAssessments(data.assessments || [])
    } catch (error) {
      console.error("[AssessmentManager] Error fetching assessments:", error)
      setError(error.message)
    } finally {
      setLoading((prev) => ({ ...prev, assessments: false }))
    }
  }

  // Handle input change in the form
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle student assessment input change
  const handleStudentAssessmentChange = (index, field, value) => {
    const newStudentAssessments = [...formData.studentAssessments]
    newStudentAssessments[index][field] = value
    setFormData((prev) => ({ ...prev, studentAssessments: newStudentAssessments }))
  }

  // Validate and map students to ensure correct IDs
  const validateAndMapStudents = (assessments) => {
    // Check if we have student data
    if (!students || students.length === 0) {
      console.warn("[AssessmentManager] No students data available for validation")
      return {
        assessments,
        warnings: ["No student data available for validation"],
      }
    }

    // Create maps for quick lookup
    const studentIdMap = {}
    const studentNameMap = {}
    const studentEmailMap = {}
    const warnings = []

    students.forEach((student) => {
      // Map by ID
      studentIdMap[student._id] = student

      // Map by name (case insensitive)
      if (student.name) {
        studentNameMap[student.name.toLowerCase()] = student
      }

      // Map by email (case insensitive)
      if (student.email) {
        studentEmailMap[student.email.toLowerCase()] = student
      }

      // Map by first+last name combinations if available
      if (student.firstName && student.lastName) {
        const fullName = `${student.firstName} ${student.lastName}`.toLowerCase()
        studentNameMap[fullName] = student
      }
    })

    // Validate and fix each assessment
    const validatedAssessments = assessments.map((assessment) => {
      // Check if the student ID exists in our map
      const studentExists = !!studentIdMap[assessment.studentId]

      if (!studentExists) {
        // Try to find by name
        if (assessment.name) {
          const nameLower = assessment.name.toLowerCase()
          const matchedStudent = studentNameMap[nameLower]

          if (matchedStudent) {
            console.log(
              `[AssessmentManager] Fixing student ID for ${assessment.name}: ${assessment.studentId} -> ${matchedStudent._id}`,
            )
            warnings.push(`Fixed student ID for ${assessment.name}`)
            return {
              ...assessment,
              studentId: matchedStudent._id,
            }
          } else {
            warnings.push(`Could not find student match for name: ${assessment.name}`)
          }
        }

        // Try to find by email
        if (assessment.email) {
          const emailLower = assessment.email.toLowerCase()
          const matchedStudent = studentEmailMap[emailLower]

          if (matchedStudent) {
            console.log(
              `[AssessmentManager] Fixing student ID for ${assessment.email}: ${assessment.studentId} -> ${matchedStudent._id}`,
            )
            warnings.push(`Fixed student ID for ${assessment.email}`)
            return {
              ...assessment,
              studentId: matchedStudent._id,
            }
          } else {
            warnings.push(`Could not find student match for email: ${assessment.email}`)
          }
        } else {
          warnings.push(`Invalid student ID: ${assessment.studentId} and no name/email provided`)
        }
      }

      return assessment
    })

    return {
      assessments: validatedAssessments,
      warnings,
    }
  }

  // Fix student IDs in existing assessments
  const fixStudentIds = async () => {
    setLoading((prev) => ({ ...prev, fixIds: true }))
    setError(null)
    setFixResults(null)

    try {
      const response = await fetch("/api/fix-student-assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fix student IDs")
      }

      const data = await response.json()
      console.log("[AssessmentManager] Fix student IDs result:", data)

      setFixResults(data.results)

      toast({
        title: "Student IDs Fixed",
        description: data.message,
        status: "success",
        duration: 5000,
        isClosable: true,
      })

      // Refresh assessments after fixing
      if (selectedSubject && selectedClass) {
        fetchAssessments({ subjectId: selectedSubject, classId: selectedClass })
      }
    } catch (error) {
      console.error("[AssessmentManager] Error fixing student IDs:", error)
      setError(`Failed to fix student IDs: ${error.message}`)
      toast({
        title: "Error",
        description: `Failed to fix student IDs: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading((prev) => ({ ...prev, fixIds: false }))
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading((prev) => ({ ...prev, submit: true }))
    setError(null)

    try {
      // Validate form
      if (!formData.title || !formData.maxScore) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          status: "error",
          duration: 3000,
          isClosable: true,
        })
        setLoading((prev) => ({ ...prev, submit: false }))
        return
      }

      // Filter out empty scores
      const validAssessments = formData.studentAssessments.filter((assessment) => assessment.score !== "")

      if (validAssessments.length === 0) {
        toast({
          title: "Error",
          description: "Please enter at least one student assessment.",
          status: "error",
          duration: 3000,
          isClosable: true,
        })
        setLoading((prev) => ({ ...prev, submit: false }))
        return
      }

      // Validate and map student IDs before submission
      const { assessments: validatedAssessments, warnings } = validateAndMapStudents(validAssessments)

      // Show warnings if any
      if (warnings.length > 0) {
        console.warn("[AssessmentManager] Student validation warnings:", warnings)

        // Show toast with warnings if there are any
        if (warnings.some((w) => w.includes("Could not find") || w.includes("Invalid student ID"))) {
          toast({
            title: "Student ID Warnings",
            description: "Some students could not be properly identified. Check the console for details.",
            status: "warning",
            duration: 5000,
            isClosable: true,
          })
        }
      }

      // Create assessments using the student-assessments API endpoint
      console.log("[AssessmentManager] Creating assessments using student-assessments API")

      // Use the main endpoint with bulk data
      const bulkPayload = {
        subjectId: selectedSubject,
        title: formData.title,
        maxScore: Number(formData.maxScore),
        weight: Number(formData.weight),
        date: formData.date,
        assessments: validatedAssessments.map((assessment) => ({
          studentId: assessment.studentId,
          name: assessment.name, // Include name for backup matching
          email: assessment.email, // Include email for backup matching
          score: Number(assessment.score),
          comment: assessment.comment || "",
        })),
      }

      console.log("[AssessmentManager] Bulk submission payload:", bulkPayload)

      setDebugInfo((prev) => ({
        ...prev,
        submissionData: {
          endpoint: "/api/student-assessments",
          payload: bulkPayload,
        },
      }))

      // Try the submission with credentials
      const bulkResponse = await fetch("/api/student-assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(bulkPayload),
        credentials: "include", // Ensure cookies are sent with the request
      })

      // Check for authentication errors
      if (bulkResponse.status === 401) {
        console.error("[AssessmentManager] Authentication error: Not authorized")
        setError("Authentication error: You are not logged in or your session has expired. Please log in again.")
        throw new Error("Unauthorized - Please log in")
      }

      const bulkResponseText = await bulkResponse.text()
      let bulkData

      try {
        bulkData = JSON.parse(bulkResponseText)
      } catch (e) {
        console.error("[AssessmentManager] Failed to parse bulk response:", bulkResponseText)
        throw new Error(`Invalid bulk response: ${bulkResponseText.substring(0, 100)}...`)
      }

      if (bulkResponse.ok) {
        console.log("[AssessmentManager] Bulk creation successful:", bulkData)

        setDebugInfo((prev) => ({
          ...prev,
          submissionResults: bulkData.results,
        }))

        toast({
          title: "Assessments submitted",
          description: `Successfully submitted ${bulkData.results?.success?.length || 0} assessments. ${
            bulkData.results?.failed?.length > 0 ? `Failed: ${bulkData.results.failed.length}` : ""
          }`,
          status: bulkData.results?.failed?.length === 0 ? "success" : "warning",
          duration: 5000,
          isClosable: true,
        })

        // Reset form
        setFormData({
          title: "",
          maxScore: 100,
          weight: 1,
          date: new Date().toISOString().split("T")[0],
          studentAssessments: students.map((student) => ({
            studentId: student._id,
            name: student.name,
            email: student.email,
            score: "",
            comment: "",
          })),
        })
        onClose()

        // Refresh assessments after a short delay
        setTimeout(() => {
          fetchAssessments({ subjectId: selectedSubject, classId: selectedClass })
        }, 1000)

        return
      } else {
        console.warn("[AssessmentManager] Bulk creation failed:", bulkData)
        throw new Error(bulkData.error || "Bulk creation failed")
      }
    } catch (error) {
      console.error("[AssessmentManager] Error submitting assessments:", error)
      setError(`Failed to submit assessments: ${error.message}`)
      toast({
        title: "Error",
        description: `Failed to submit assessments: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }))
    }
  }

  // Enhance the student table rendering in the modal
  const renderStudentTable = () => {
    return (
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Student</Th>
            <Th>Student ID</Th>
            <Th>Score</Th>
            <Th>Comment</Th>
          </Tr>
        </Thead>
        <Tbody>
          {formData.studentAssessments.map((student, index) => (
            <Tr key={student.studentId}>
              <Td>
                <Flex direction="column">
                  <Text fontWeight="medium">{student.name}</Text>
                  {student.email && (
                    <Text fontSize="xs" color="gray.500">
                      {student.email}
                    </Text>
                  )}
                </Flex>
              </Td>
              <Td>
                <Tooltip label={`Student ID: ${student.studentId}`}>
                  <Text fontSize="xs" color="gray.500" noOfLines={1}>
                    {student.studentId.substring(0, 8)}...
                  </Text>
                </Tooltip>
              </Td>
              <Td>
                <NumberInput
                  min={0}
                  max={formData.maxScore}
                  value={student.score}
                  onChange={(value) => handleStudentAssessmentChange(index, "score", value)}
                  size="sm"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </Td>
              <Td>
                <Input
                  size="sm"
                  placeholder="Optional comment"
                  value={student.comment}
                  onChange={(e) => handleStudentAssessmentChange(index, "comment", e.target.value)}
                />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    )
  }

  // Get student name by ID
  const getStudentName = (studentId) => {
    const student = students.find((s) => s._id === studentId)
    return student ? student.name : "Unknown Student"
  }

  // Get subject name by ID
  const getSubjectName = (subjectId) => {
    const subject = subjects.find((s) => s._id === subjectId)
    return subject ? subject.name : "Unknown Subject"
  }

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Calculate assessment percentage
  const calculatePercentage = (score, maxScore) => {
    return ((score / maxScore) * 100).toFixed(1) + "%"
  }

  // Get assessment color based on percentage
  const getAssessmentColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 90) return "green.500"
    if (percentage >= 80) return "teal.500"
    if (percentage >= 70) return "blue.500"
    if (percentage >= 60) return "yellow.500"
    return "red.500"
  }

  // Get letter grade
  const getLetterGrade = (score, maxScore) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 90) return "A"
    if (percentage >= 80) return "B"
    if (percentage >= 70) return "C"
    if (percentage >= 60) return "D"
    return "F"
  }

  // Delete an assessment
  const handleDeleteAssessment = async (assessmentId) => {
    try {
      console.log(`[AssessmentManager] Deleting assessment: ${assessmentId}`)

      const response = await fetch(`/api/student-assessments?id=${assessmentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Ensure cookies are sent with the request
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to delete assessment")
      }

      toast({
        title: "Assessment deleted",
        description: "Assessment has been deleted successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      // Refresh assessments
      fetchAssessments({ subjectId: selectedSubject, classId: selectedClass })
    } catch (error) {
      console.error("[AssessmentManager] Error deleting assessment:", error)
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <Box>
      <Flex direction={{ base: "column", md: "row" }} justify="space-between" align="center" mb={6} gap={4}>
        <Heading size="md">Assessment Manager</Heading>

        <Flex gap={4} width={{ base: "100%", md: "auto" }}>
          <Select
            placeholder="Select a class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            width={{ base: "100%", md: "200px" }}
          >
            {Array.isArray(classes) &&
              classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
          </Select>

          <Select
            placeholder="Select a subject"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            width={{ base: "100%", md: "200px" }}
            isDisabled={!selectedClass || filteredSubjects.length === 0}
          >
            {filteredSubjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </Select>

          <Button
            leftIcon={<FaSync />}
            colorScheme="gray"
            onClick={() => {
              if (selectedSubject && selectedClass)
                fetchAssessments({ subjectId: selectedSubject, classId: selectedClass })
              if (selectedClass) fetchStudents(selectedClass)
            }}
            isLoading={loading.assessments || loading.students}
            isDisabled={!selectedClass && !selectedSubject}
            title="Refresh data"
          >
            Refresh
          </Button>

          <Button
            leftIcon={<FaPlus />}
            colorScheme="blue"
            onClick={onOpen}
            isDisabled={!selectedSubject || !selectedClass || students.length === 0}
          >
            Add Assessments
          </Button>

          <Button
            leftIcon={<FaTools />}
            colorScheme="orange"
            onClick={fixStudentIds}
            isLoading={loading.fixIds}
            title="Fix student IDs in assessments"
          >
            Fix IDs
          </Button>

          <Button
            leftIcon={<FaBug />}
            colorScheme={showDebugger ? "red" : "gray"}
            onClick={() => setShowDebugger(!showDebugger)}
            title="Toggle debugger"
          >
            {showDebugger ? "Hide Debugger" : "Debug"}
          </Button>
        </Flex>
      </Flex>

      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {fixResults && (
        <Alert status="success" mb={6}>
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Student ID Fix Results:</Text>
            <Text>Total assessments: {fixResults.total}</Text>
            <Text>Fixed: {fixResults.fixed}</Text>
            <Text>Already correct: {fixResults.alreadyCorrect}</Text>
            <Text>Failed: {fixResults.failed}</Text>
            {fixResults.details && fixResults.details.length > 0 && (
              <Box mt={2}>
                <Text fontWeight="bold">Fixed assessments:</Text>
                <Box maxH="200px" overflowY="auto" mt={2}>
                  {fixResults.details.map((detail, index) => (
                    <Text key={index} fontSize="sm">
                      • {detail.title}: {detail.studentName} ({detail.oldStudentId} → {detail.newStudentId})
                    </Text>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Alert>
      )}

      {showDebugger && (
        <Box mb={6}>
          <AssessmentDebugger />
        </Box>
      )}

      <Tabs colorScheme="blue" isLazy>
        <TabList>
          <Tab>Assessments List</Tab>
          <Tab>Student Performance</Tab>
          <Tab>Debug Info</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            {!selectedSubject ? (
              <Alert status="info">
                <AlertIcon />
                Please select a class and subject to view and manage assessments.
              </Alert>
            ) : loading.assessments ? (
              <Flex justify="center" align="center" minH="200px">
                <Spinner size="xl" color="blue.500" />
              </Flex>
            ) : assessments.length === 0 ? (
              <Box textAlign="center" p={8}>
                <Text mb={4}>No assessments recorded for this subject yet.</Text>
                <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={onOpen} isDisabled={students.length === 0}>
                  Add Assessments
                </Button>
              </Box>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Title</Th>
                    <Th>Student</Th>
                    <Th>Score</Th>
                    <Th>Date</Th>
                    <Th>Comment</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {assessments.map((assessment) => (
                    <Tr key={assessment._id}>
                      <Td>{assessment.title}</Td>
                      <Td>{getStudentName(assessment.studentId)}</Td>
                      <Td>
                        <Flex direction="column">
                          <Text fontWeight="bold" color={getAssessmentColor(assessment.score, assessment.maxScore)}>
                            {assessment.score} / {assessment.maxScore}
                          </Text>
                          <Flex gap={2} alignItems="center">
                            <Text fontSize="sm" color="gray.500">
                              {calculatePercentage(assessment.score, assessment.maxScore)}
                            </Text>
                            <Badge
                              colorScheme={
                                getLetterGrade(assessment.score, assessment.maxScore) === "A"
                                  ? "green"
                                  : getLetterGrade(assessment.score, assessment.maxScore) === "B"
                                    ? "teal"
                                    : getLetterGrade(assessment.score, assessment.maxScore) === "C"
                                      ? "blue"
                                      : getLetterGrade(assessment.score, assessment.maxScore) === "D"
                                        ? "yellow"
                                        : "red"
                              }
                            >
                              {getLetterGrade(assessment.score, assessment.maxScore)}
                            </Badge>
                          </Flex>
                        </Flex>
                      </Td>
                      <Td>{formatDate(assessment.date)}</Td>
                      <Td>
                        <Text noOfLines={1}>{assessment.comment || "—"}</Text>
                      </Td>
                      <Td>
                        <Flex gap={2}>
                          <Tooltip label="Edit Assessment">
                            <IconButton
                              icon={<FaEdit />}
                              size="sm"
                              colorScheme="blue"
                              variant="ghost"
                              aria-label="Edit assessment"
                            />
                          </Tooltip>
                          <Tooltip label="Delete Assessment">
                            <IconButton
                              icon={<FaTrash />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              aria-label="Delete assessment"
                              onClick={() => handleDeleteAssessment(assessment._id)}
                            />
                          </Tooltip>
                        </Flex>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </TabPanel>

          <TabPanel>
            {!selectedSubject ? (
              <Alert status="info">
                <AlertIcon />
                Please select a class and subject to view student performance.
              </Alert>
            ) : loading.assessments || loading.students ? (
              <Flex justify="center" align="center" minH="200px">
                <Spinner size="xl" color="blue.500" />
              </Flex>
            ) : students.length === 0 ? (
              <Box textAlign="center" p={8}>
                <Text>No students in this class yet.</Text>
              </Box>
            ) : (
              <Box>
                <Heading size="sm" mb={4}>
                  Student Performance for {getSubjectName(selectedSubject)}
                </Heading>
                {/* Student performance visualization would go here */}
                <Text>Performance visualization coming soon...</Text>
              </Box>
            )}
          </TabPanel>

          <TabPanel>
            <Box>
              <Heading size="sm" mb={4}>
                Debug Information
              </Heading>
              <Text fontWeight="bold" mb={2}>
                Request URL:
              </Text>
              <Code p={2} display="block" whiteSpace="pre" mb={4}>
                {debugInfo.requestUrl || "No request made yet"}
              </Code>

              <Text fontWeight="bold" mb={2}>
                Students in Class:
              </Text>
              <Box maxH="200px" overflowY="auto" mb={4}>
                <Code p={2} display="block" whiteSpace="pre" overflowX="auto">
                  {debugInfo.students
                    ? JSON.stringify(
                        debugInfo.students.map((s) => ({
                          id: s._id,
                          name: s.name,
                          email: s.email,
                        })),
                        null,
                        2,
                      )
                    : "No students loaded"}
                </Code>
              </Box>

              <Text fontWeight="bold" mb={2}>
                API Response:
              </Text>
              <Box maxH="400px" overflowY="auto">
                <Code p={2} display="block" whiteSpace="pre" overflowX="auto">
                  {debugInfo.apiResponse ? JSON.stringify(debugInfo.apiResponse, null, 2) : "No response data"}
                </Code>
              </Box>

              {debugInfo.submissionData && (
                <>
                  <Text fontWeight="bold" mt={4} mb={2}>
                    Last Submission Data:
                  </Text>
                  <Box maxH="400px" overflowY="auto">
                    <Code p={2} display="block" whiteSpace="pre" overflowX="auto">
                      {JSON.stringify(debugInfo.submissionData, null, 2)}
                    </Code>
                  </Box>
                </>
              )}

              {debugInfo.submissionResults && (
                <>
                  <Text fontWeight="bold" mt={4} mb={2}>
                    Submission Results:
                  </Text>
                  <Box maxH="400px" overflowY="auto">
                    <Code p={2} display="block" whiteSpace="pre" overflowX="auto">
                      {JSON.stringify(debugInfo.submissionResults, null, 2)}
                    </Code>
                  </Box>
                </>
              )}

              <Text fontWeight="bold" mt={4} mb={2}>
                Current State:
              </Text>
              <Box maxH="400px" overflowY="auto">
                <Code p={2} display="block" whiteSpace="pre" overflowX="auto">
                  {JSON.stringify(
                    {
                      selectedClass,
                      selectedSubject,
                      studentsCount: students.length,
                      assessmentsCount: assessments.length,
                      loading,
                      error,
                    },
                    null,
                    2,
                  )}
                </Code>
              </Box>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Add Assessments Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Assessments for {getSubjectName(selectedSubject)}</ModalHeader>
          <ModalCloseButton />

          <form onSubmit={handleSubmit}>
            <ModalBody>
              <Flex gap={4} mb={4}>
                <FormControl isRequired>
                  <FormLabel>Assessment Title</FormLabel>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Midterm Exam"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Maximum Score</FormLabel>
                  <NumberInput
                    min={1}
                    value={formData.maxScore}
                    onChange={(value) => setFormData((prev) => ({ ...prev, maxScore: value }))}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </Flex>

              <Flex gap={4} mb={4}>
                <FormControl>
                  <FormLabel>Weight</FormLabel>
                  <NumberInput
                    min={0.1}
                    step={0.1}
                    value={formData.weight}
                    onChange={(value) => setFormData((prev) => ({ ...prev, weight: value }))}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Date</FormLabel>
                  <Input name="date" type="date" value={formData.date} onChange={handleInputChange} />
                </FormControl>
              </Flex>

              <Heading size="sm" mb={4}>
                Student Assessments
              </Heading>

              {renderStudentTable()}
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" colorScheme="blue" isLoading={loading.submit}>
                Submit Assessments
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default AssessmentManager
