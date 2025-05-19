"use client"

import { useState } from "react"
import {
  Box,
  Button,
  Code,
  Heading,
  Text,
  VStack,
  HStack,
  Textarea,
  useToast,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react"

const ClassDebugger = () => {
  const [classId, setClassId] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const toast = useToast()

  const fetchClass = async () => {
    if (!classId) {
      toast({
        title: "Error",
        description: "Please enter a class ID",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/classes/${classId}?_=${Date.now()}`)
      const data = await response.json()

      setResult(data)

      if (!response.ok) {
        setError(`Error: ${data.error || "Unknown error"}`)
        toast({
          title: "Error",
          description: data.error || "Failed to fetch class",
          status: "error",
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (err) {
      console.error("Error fetching class:", err)
      setError(`Error: ${err.message}`)
      toast({
        title: "Error",
        description: `Failed to fetch class: ${err.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const testClassUpdate = async () => {
    if (!classId) {
      toast({
        title: "Error",
        description: "Please enter a class ID",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      // First get the current class data
      const getResponse = await fetch(`/api/classes/${classId}?_=${Date.now()}`)
      const getData = await getResponse.json()

      if (!getResponse.ok) {
        throw new Error(getData.error || "Failed to fetch class")
      }

      const classData = getData.class

      // Now try to update with the same data (no changes)
      const updatePayload = {
        name: classData.name,
        description: classData.description || "",
        academicYear: classData.academicYear || new Date().getFullYear().toString(),
      }

      const updateResponse = await fetch(`/api/classes/${classId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      })

      const updateData = await updateResponse.json()

      setResult({
        originalClass: classData,
        updatePayload,
        updateResponse: updateData,
      })

      if (!updateResponse.ok) {
        setError(`Update Error: ${updateData.error || "Unknown error"}`)
        toast({
          title: "Update Error",
          description: updateData.error || "Failed to update class",
          status: "error",
          duration: 5000,
          isClosable: true,
        })
      } else {
        toast({
          title: "Success",
          description: "Class update test completed",
          status: "success",
          duration: 3000,
          isClosable: true,
        })
      }
    } catch (err) {
      console.error("Error testing class update:", err)
      setError(`Error: ${err.message}`)
      toast({
        title: "Error",
        description: `Failed to test class update: ${err.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
      <Heading size="md" mb={4}>
        Class Debugger
      </Heading>

      <VStack spacing={4} align="stretch">
        <Box>
          <Text mb={2}>Enter Class ID:</Text>
          <Textarea
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            placeholder="Enter class ID"
            size="sm"
          />
        </Box>

        <HStack>
          <Button colorScheme="blue" onClick={fetchClass} isLoading={loading} loadingText="Fetching">
            Fetch Class
          </Button>

          <Button colorScheme="orange" onClick={testClassUpdate} isLoading={loading} loadingText="Testing">
            Test Class Update
          </Button>
        </HStack>

        {error && (
          <Box p={3} bg="red.50" color="red.800" borderRadius="md">
            <Text fontWeight="bold">Error:</Text>
            <Code whiteSpace="pre-wrap" d="block" p={2}>
              {error}
            </Code>
          </Box>
        )}

        {result && (
          <Accordion allowToggle defaultIndex={[0]}>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight="bold">
                    Result
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <Code whiteSpace="pre-wrap" d="block" p={2} fontSize="sm" overflowX="auto">
                  {JSON.stringify(result, null, 2)}
                </Code>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        )}
      </VStack>
    </Box>
  )
}

export default ClassDebugger
