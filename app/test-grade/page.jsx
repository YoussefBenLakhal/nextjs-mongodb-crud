"use client"

import { useState } from "react"
import { Box, Button, Input, FormControl, FormLabel, Text, VStack, useToast } from "@chakra-ui/react"

export default function TestGradePage() {
  const [formData, setFormData] = useState({
    title: "Test Grade",
    score: 90,
    maxScore: 100,
    studentId: "",
    subjectId: "",
    classId: "",
    teacherId: "",
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const toast = useToast()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("Submitting test grade:", formData)

      const response = await fetch("/api/test-grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to add test grade")
      }

      setResult(data)
      toast({
        title: "Success",
        description: "Test grade created successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      console.error("Error adding test grade:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add test grade",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box maxW="600px" mx="auto" mt={10} p={6} borderWidth="1px" borderRadius="lg">
      <Text fontSize="2xl" mb={6}>
        Test Grade Creation
      </Text>

      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Title</FormLabel>
            <Input name="title" value={formData.title} onChange={handleChange} />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Score</FormLabel>
            <Input name="score" type="number" value={formData.score} onChange={handleChange} />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Max Score</FormLabel>
            <Input name="maxScore" type="number" value={formData.maxScore} onChange={handleChange} />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Student ID</FormLabel>
            <Input
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              placeholder="Enter student ObjectId"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Subject ID</FormLabel>
            <Input
              name="subjectId"
              value={formData.subjectId}
              onChange={handleChange}
              placeholder="Enter subject ObjectId"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Class ID</FormLabel>
            <Input name="classId" value={formData.classId} onChange={handleChange} placeholder="Enter class ObjectId" />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Teacher ID</FormLabel>
            <Input
              name="teacherId"
              value={formData.teacherId}
              onChange={handleChange}
              placeholder="Enter teacher ObjectId"
            />
          </FormControl>

          <Button type="submit" colorScheme="blue" isLoading={loading} width="full">
            Create Test Grade
          </Button>
        </VStack>
      </form>

      {result && (
        <Box mt={6} p={4} borderWidth="1px" borderRadius="md">
          <Text fontWeight="bold">Result:</Text>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </Box>
      )}
    </Box>
  )
}
