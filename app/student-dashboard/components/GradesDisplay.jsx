"use client"

import { useState, useEffect } from "react"
import { Box, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, Badge, Spinner, Alert, AlertIcon } from "@chakra-ui/react"

const GradesDisplay = ({ subjects = [], grades = [], loading = false, user }) => {
  const [subjectGrades, setSubjectGrades] = useState({})
  const [averages, setAverages] = useState({})
  const [processedGrades, setProcessedGrades] = useState([])

  // Update the useEffect that processes grades to strictly filter by student ID
  useEffect(() => {
    if (subjects.length === 0) {
      console.log("[GradesDisplay] No subjects to process")
      setSubjectGrades({})
      setAverages({})
      setProcessedGrades([])
      return
    }

    console.log(`[GradesDisplay] Processing ${grades.length} grades for ${subjects.length} subjects`)
    console.log(`[GradesDisplay] Current user ID: ${user?.id}`)

    // Group grades by subject
    const gradesBySubject = {}
    const subjectAverages = {}

    // Initialize with empty arrays for all subjects
    subjects.forEach((subject) => {
      const subjectId = String(subject._id)
      gradesBySubject[subjectId] = []
    })

    // Use a Set to track unique grade IDs to prevent duplicates
    const processedIds = new Set()
    const uniqueGrades = []

    // CRITICAL FIX: Only process grades that match the current user's student ID
    grades.forEach((grade) => {
      // Skip if we've already processed this grade
      if (processedIds.has(grade._id)) {
        console.log(`[GradesDisplay] Skipping duplicate grade: ${grade.title} (${grade._id})`)
        return
      }

      // Skip grades that don't have a valid _id
      if (!grade._id) {
        console.log(`[GradesDisplay] Skipping grade without ID: ${grade.title}`)
        return
      }

      // CRITICAL FIX: Verify this grade belongs to the current student
      const gradeStudentId = String(grade.studentId)
      if (user && user.id && gradeStudentId !== user.id) {
        console.log(`[GradesDisplay] Skipping grade not belonging to current student: ${grade.title} (${grade._id})`)
        console.log(`[GradesDisplay] Grade student ID: ${gradeStudentId}, Current user ID: ${user.id}`)
        return
      }

      // Convert IDs to strings for comparison
      const gradeSubjectId = String(grade.subjectId)

      // Find matching subject
      const matchingSubject = subjects.find((subject) => {
        const subjectId = String(subject._id)
        return subjectId === gradeSubjectId
      })

      if (matchingSubject) {
        const subjectId = String(matchingSubject._id)
        if (!gradesBySubject[subjectId]) {
          gradesBySubject[subjectId] = []
        }

        // Add to subject grades
        gradesBySubject[subjectId].push(grade)

        // Add to unique grades list
        uniqueGrades.push({
          ...grade,
          subjectName: matchingSubject.name,
        })

        // Mark as processed
        processedIds.add(grade._id)
      } else {
        console.log(`[GradesDisplay] No matching subject found for grade: ${grade.title} (${grade.subjectId})`)
        console.log(`[GradesDisplay] Available subjects: ${subjects.map((s) => `${s.name} (${s._id})`).join(", ")}`)
      }
    })

    // Calculate averages for each subject
    Object.keys(gradesBySubject).forEach((subjectId) => {
      const subjectGradesList = gradesBySubject[subjectId]
      if (subjectGradesList.length > 0) {
        let totalWeightedScore = 0
        let totalWeight = 0

        subjectGradesList.forEach((grade) => {
          if (
            grade.score !== undefined &&
            grade.maxScore !== undefined &&
            grade.maxScore > 0 &&
            !isNaN(grade.score) &&
            !isNaN(grade.maxScore)
          ) {
            const weight = grade.weight || 1
            const percentage = (grade.score / grade.maxScore) * 100
            totalWeightedScore += percentage * weight
            totalWeight += weight
          }
        })

        if (totalWeight > 0) {
          subjectAverages[subjectId] = Math.round(totalWeightedScore / totalWeight)
        } else {
          subjectAverages[subjectId] = null
        }
      } else {
        subjectAverages[subjectId] = null
      }
    })

    setSubjectGrades(gradesBySubject)
    setAverages(subjectAverages)
    setProcessedGrades(uniqueGrades)

    console.log(`[GradesDisplay] Processed ${uniqueGrades.length} unique grades out of ${grades.length} total`)
  }, [subjects, grades, user])

  // Get grade color based on percentage
  const getGradeColor = (percentage) => {
    if (percentage >= 90) return "green"
    if (percentage >= 80) return "teal"
    if (percentage >= 70) return "blue"
    if (percentage >= 60) return "yellow"
    return "red"
  }

  // Get letter grade based on percentage
  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return "A"
    if (percentage >= 80) return "B"
    if (percentage >= 70) return "C"
    if (percentage >= 60) return "D"
    return "F"
  }

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    } catch (error) {
      console.error(`[GradesDisplay] Error formatting date: ${dateString}`, error)
      return "Invalid date"
    }
  }

  // Format percentage with one decimal place
  const formatPercentage = (score, maxScore) => {
    return ((score / maxScore) * 100).toFixed(1) + "%"
  }

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading grades...</Text>
      </Box>
    )
  }

  return (
    <Box>
      <Heading size="md" mb={4}>
        My Grades
      </Heading>

      {processedGrades.length === 0 ? (
        <Alert status="info">
          <AlertIcon />
          No grades have been entered by your teachers yet.
        </Alert>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Assignment</Th>
              <Th>Subject</Th>
              <Th>Score</Th>
              <Th>Date</Th>
              <Th>Comment</Th>
            </Tr>
          </Thead>
          <Tbody>
            {processedGrades
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((grade) => {
                const percentage = (grade.score / grade.maxScore) * 100
                const letterGrade = getLetterGrade(percentage)

                return (
                  <Tr key={grade._id}>
                    <Td>{grade.title}</Td>
                    <Td>{grade.subjectName}</Td>
                    <Td>
                      <Box>
                        <Text fontWeight="medium">
                          {grade.score} / {grade.maxScore}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {formatPercentage(grade.score, grade.maxScore)}
                        </Text>
                        <Badge colorScheme={getGradeColor(percentage)}>{letterGrade}</Badge>
                      </Box>
                    </Td>
                    <Td>{formatDate(grade.date)}</Td>
                    <Td>{grade.comment || "-"}</Td>
                  </Tr>
                )
              })}
          </Tbody>
        </Table>
      )}

      <Heading size="md" mt={8} mb={4}>
        Subject Averages
      </Heading>

      <Box mb={8}>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Subject</Th>
              <Th>Average</Th>
              <Th>Grade</Th>
            </Tr>
          </Thead>
          <Tbody>
            {subjects.map((subject) => {
              const subjectId = String(subject._id)
              const average = averages[subjectId]
              const hasGrades = subjectGrades[subjectId]?.length > 0

              return (
                <Tr key={subjectId}>
                  <Td>{subject.name}</Td>
                  <Td>
                    {hasGrades && average !== null ? (
                      `${average}%`
                    ) : (
                      <Text color="gray.500" fontSize="sm">
                        No grades yet
                      </Text>
                    )}
                  </Td>
                  <Td>
                    {hasGrades && average !== null ? (
                      <Badge colorScheme={getGradeColor(average)}>{getLetterGrade(average)}</Badge>
                    ) : (
                      <Badge colorScheme="gray">N/A</Badge>
                    )}
                  </Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
      </Box>
      {process.env.NODE_ENV === "development" && (
        <Box mt={8} p={4} borderWidth="1px" borderRadius="md">
          <Heading size="sm" mb={2}>
            Debug Information
          </Heading>
          <Text fontSize="sm">Data Source: student-assessments collection</Text>
          <Text fontSize="sm">Total Grades: {grades.length}</Text>
          <Text fontSize="sm">Processed Grades: {processedGrades.length}</Text>
          <Text fontSize="sm">
            First Grade Sample:{" "}
            {grades.length > 0
              ? JSON.stringify(
                  {
                    id: grades[0]._id,
                    title: grades[0].title,
                    score: grades[0].score,
                    maxScore: grades[0].maxScore,
                    date: grades[0].date,
                  },
                  null,
                  2,
                )
              : "No grades"}
          </Text>
          <Text fontSize="sm" mt={2}>
            Subject IDs: {subjects.map((s) => `${s.name}: ${s._id}`).join(", ")}
          </Text>
        </Box>
      )}
    </Box>
  )
}

export default GradesDisplay
