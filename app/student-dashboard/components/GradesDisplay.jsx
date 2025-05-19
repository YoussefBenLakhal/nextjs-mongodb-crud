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
} from "@chakra-ui/react"
import { FaSync } from "react-icons/fa"

const GradesDisplay = ({ subjects, grades: initialGrades, loading: externalLoading }) => {
  const [grades, setGrades] = useState(initialGrades || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const toast = useToast()

  // Update local grades when props change
  useEffect(() => {
    if (initialGrades && initialGrades.length > 0) {
      setGrades(initialGrades)
    }
  }, [initialGrades])

  // Add this near the top of the component, after useState hooks
  useEffect(() => {
    if (subjects && subjects.length > 0) {
      console.log(
        "[GradesDisplay] Subjects:",
        subjects.map((s) => ({
          id: s._id,
          name: s.name,
        })),
      )
    }

    if (grades && grades.length > 0) {
      console.log(
        "[GradesDisplay] Grades:",
        grades.map((g) => ({
          id: g._id,
          subjectId: g.subjectId,
          title: g.title,
          score: g.score,
        })),
      )
    }
  }, [subjects, grades])

  // Fetch grades
  const fetchGrades = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log("[GradesDisplay] Fetching grades...")

      const response = await fetch("/api/student-assessments", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "include", // Important for auth
      })

      if (!response.ok) {
        throw new Error("Failed to fetch grades")
      }

      const data = await response.json()
      console.log(`[GradesDisplay] Fetched ${data.grades?.length || 0} grades`)
      setGrades(data.grades || [])
    } catch (error) {
      console.error("[GradesDisplay] Error fetching grades:", error)
      setError("Failed to load grades. Using existing data.")
      toast({
        title: "Error",
        description: "Failed to load grades. Using existing data.",
        status: "warning",
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

  // Calculate average grade for a subject
  function calculateSubjectAverage(subjectId) {
    // Convert the subjectId to string for consistent comparison
    const subjectIdStr = String(subjectId)

    // Filter grades that match this subject, handling different ID formats
    const subjectGrades = grades.filter((g) => {
      // Convert grade's subjectId to string for comparison
      const gradeSubjectId = String(g.subjectId)

      // Check if IDs match directly or after removing any ObjectId wrapper
      return (
        gradeSubjectId === subjectIdStr ||
        gradeSubjectId.replace(/^ObjectId$$['"](.+)['"]$$$/, "$1") === subjectIdStr ||
        subjectIdStr.replace(/^ObjectId$$['"](.+)['"]$$$/, "$1") === gradeSubjectId
      )
    })

    console.log(`[GradesDisplay] Subject ${subjectIdStr} has ${subjectGrades.length} grades`)

    if (subjectGrades.length === 0) return null

    const weightedSum = subjectGrades.reduce((sum, grade) => {
      return sum + (grade.score / grade.maxScore) * grade.weight
    }, 0)

    const totalWeight = subjectGrades.reduce((sum, grade) => sum + grade.weight, 0)

    return (weightedSum / totalWeight) * 100
  }

  // Get color based on grade percentage
  const getGradeColor = (percentage) => {
    if (percentage >= 90) return "green.500"
    if (percentage >= 80) return "teal.500"
    if (percentage >= 70) return "blue.500"
    if (percentage >= 60) return "yellow.500"
    return "red.500"
  }

  // Get letter grade
  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return "A"
    if (percentage >= 80) return "B"
    if (percentage >= 70) return "C"
    if (percentage >= 60) return "D"
    return "F"
  }

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
        <Alert status="warning" mb={4}>
          <AlertIcon />
          {error}
          <Button ml="auto" size="sm" leftIcon={<FaSync />} onClick={fetchGrades}>
            Retry
          </Button>
        </Alert>
      )}

      <Heading size="md" mb={4}>
        Recent Grades
      </Heading>
      {grades.length === 0 ? (
        <Box textAlign="center" p={8}>
          <Text>No grades available yet.</Text>
        </Box>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Subject</Th>
              <Th>Title</Th>
              <Th>Score</Th>
              <Th>Date</Th>
              <Th>Comment</Th>
            </Tr>
          </Thead>
          <Tbody>
            {grades
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 10)
              .map((grade) => (
                <Tr key={grade._id}>
                  <Td>{getSubjectName(grade.subjectId)}</Td>
                  <Td>{grade.title}</Td>
                  <Td>
                    <Flex direction="column">
                      <Text fontWeight="bold" color={getGradeColor((grade.score / grade.maxScore) * 100)}>
                        {grade.score} / {grade.maxScore}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {((grade.score / grade.maxScore) * 100).toFixed(1)}%
                      </Text>
                    </Flex>
                  </Td>
                  <Td>{new Date(grade.date).toLocaleDateString()}</Td>
                  <Td>
                    <Text noOfLines={2}>{grade.comment || "—"}</Text>
                  </Td>
                </Tr>
              ))}
          </Tbody>
        </Table>
      )}

      <Heading size="md" mt={8} mb={4}>
        Subject Averages
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {subjects.map((subject) => {
          const average = calculateSubjectAverage(subject._id)
          return (
            <Card key={subject._id} p={4}>
              <Heading size="sm" mb={2}>
                {subject.name}
              </Heading>
              {average === null ? (
                <Text>No grades yet</Text>
              ) : (
                <>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Text fontWeight="bold" color={getGradeColor(average)}>
                      {average.toFixed(1)}%
                    </Text>
                    <Badge colorScheme={average >= 60 ? "green" : "red"}>{getLetterGrade(average)}</Badge>
                  </Flex>
                  <Progress
                    value={average}
                    colorScheme={
                      average >= 90
                        ? "green"
                        : average >= 80
                          ? "teal"
                          : average >= 70
                            ? "blue"
                            : average >= 60
                              ? "yellow"
                              : "red"
                    }
                    borderRadius="md"
                  />
                </>
              )}
            </Card>
          )
        })}
      </SimpleGrid>
    </Box>
  )
}

export default GradesDisplay
