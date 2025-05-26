"use client"
import { Box, Text, VStack, HStack, Badge, Card, CardBody } from "@chakra-ui/react"
import { FaBook, FaGraduationCap, FaClock } from "react-icons/fa"

export default function SubjectsDisplay({ subjects = [] }) {
  if (!subjects || subjects.length === 0) {
    return (
      <Card>
        <CardBody>
          <Text color="gray.500">No subjects enrolled</Text>
        </CardBody>
      </Card>
    )
  }

  return (
    <VStack spacing={4} align="stretch">
      {subjects.map((subject, index) => (
        <Card key={index} variant="outline">
          <CardBody>
            <HStack justify="space-between">
              <HStack spacing={3}>
                <Box color="blue.500">
                  <FaBook size={20} />
                </Box>
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">{subject.name}</Text>
                  <HStack spacing={2}>
                    <Badge colorScheme="blue" variant="subtle">
                      <HStack spacing={1}>
                        <FaGraduationCap size={12} />
                        <Text fontSize="xs">{subject.teacher}</Text>
                      </HStack>
                    </Badge>
                    <Badge colorScheme="green" variant="subtle">
                      <HStack spacing={1}>
                        <FaClock size={12} />
                        <Text fontSize="xs">{subject.schedule}</Text>
                      </HStack>
                    </Badge>
                  </HStack>
                </VStack>
              </HStack>
              <Badge colorScheme="purple">{subject.credits} Credits</Badge>
            </HStack>
          </CardBody>
        </Card>
      ))}
    </VStack>
  )
}
