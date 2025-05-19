"use client"
import {
  Box,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Badge,
  Flex,
  Progress,
  Spinner,
  Alert,
  AlertIcon,
  Button,
} from "@chakra-ui/react"
import { FaSync } from "react-icons/fa"

const SubjectsDisplay = ({ subjects, grades, loading }) => {
  // Calculate average grade for a subject
  const calculateSubjectAverage = (subjectId) => {
    const subjectGrades = grades.filter((g) => g.subjectId === subjectId)

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

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    )
  }

  if (!subjects || subjects.length === 0) {
    return (
      <Box textAlign="center" p={8}>
        <Alert status="warning" mb={4}>
          <AlertIcon />
          <Text>
            No subjects available. This could be due to an API error or you may not be enrolled in any subjects yet.
          </Text>
          <Button ml="auto" size="sm" leftIcon={<FaSync />} onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Alert>
      </Box>
    )
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
      {subjects.map((subject) => (
        <Card key={subject._id} borderWidth="1px" borderRadius="lg" overflow="hidden">
          <CardHeader bg="purple.50" py={4}>
            <Heading size="md">{subject.name}</Heading>
            <Badge colorScheme="purple" mt={2}>
              {subject.code}
            </Badge>
          </CardHeader>
          <CardBody>
            <Text noOfLines={3} mb={4}>
              {subject.description || "No description provided."}
            </Text>

            <Heading size="xs" mb={2}>
              Performance
            </Heading>
            {(() => {
              const average = calculateSubjectAverage(subject._id)
              return average === null ? (
                <Text fontSize="sm">No grades yet</Text>
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
              )
            })()}
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
  )
}

export default SubjectsDisplay
