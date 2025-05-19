"use client"

import { useState } from "react"
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Spinner,
  useDisclosure,
  useToast,
} from "@chakra-ui/react"
import { FaUserGraduate, FaBook, FaPlus, FaEdit, FaTrash } from "react-icons/fa"

export default function ClassesList({ classes, setClasses, loading }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isEditing, setIsEditing] = useState(false)
  const [currentClass, setCurrentClass] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    academicYear: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Open modal for creating a new class
  const handleCreateClass = () => {
    setIsEditing(false)
    setFormData({
      name: "",
      description: "",
      academicYear: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
    })
    onOpen()
  }

  // Open modal for editing an existing class
  const handleEditClass = (classData) => {
    setIsEditing(true)
    setCurrentClass(classData)
    setFormData({
      name: classData.name,
      description: classData.description || "",
      academicYear: classData.academicYear,
    })
    onOpen()
  }

  // Submit form to create or update a class
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (isEditing && currentClass) {
        // Update existing class
        const response = await fetch(`/api/classes/${currentClass._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error("Failed to update class")
        }

        // Update classes state
        setClasses(classes.map((c) => (c._id === currentClass._id ? { ...c, ...formData } : c)))

        toast({
          title: "Class updated",
          description: `${formData.name} has been updated successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        })
      } else {
        // Create new class
        const response = await fetch("/api/classes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error("Failed to create class")
        }

        const data = await response.json()

        // Add new class to state
        const newClass = {
          _id: data.classId,
          ...formData,
          students: [],
          createdAt: new Date().toISOString(),
        }

        setClasses([...classes, newClass])

        toast({
          title: "Class created",
          description: `${formData.name} has been created successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        })
      }

      onClose()
    } catch (error) {
      console.error("Error submitting class:", error)
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete a class
  const handleDeleteClass = async (classId, className) => {
    if (!window.confirm(`Are you sure you want to delete ${className}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete class")
      }

      // Remove class from state
      setClasses(classes.filter((c) => c._id !== classId))

      toast({
        title: "Class deleted",
        description: `${className} has been deleted successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error("Error deleting class:", error)
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    )
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="md">Your Classes</Heading>
        <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={handleCreateClass}>
          Create Class
        </Button>
      </Flex>

      {classes.length === 0 ? (
        <Card p={6} textAlign="center">
          <CardBody>
            <Text mb={4}>You haven't created any classes yet.</Text>
            <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={handleCreateClass}>
              Create Your First Class
            </Button>
          </CardBody>
        </Card>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {Array.isArray(classes) && classes.map((classItem) => (
            <Card key={classItem._id} borderWidth="1px" borderRadius="lg" overflow="hidden">
              <CardHeader bg="blue.50" py={4}>
                <Heading size="md">{classItem.name}</Heading>
                <Badge colorScheme="blue" mt={2}>
                  {classItem.academicYear}
                </Badge>
              </CardHeader>

              <CardBody>
                <Text noOfLines={2} mb={4}>
                  {classItem.description || "No description provided."}
                </Text>

                <Flex justify="space-between" mt={4}>
                  <Flex align="center">
                    <Icon as={FaUserGraduate} color="green.500" mr={2} />
                    <Text>{classItem.students?.length || 0} Students</Text>
                  </Flex>
                  <Flex align="center">
                    <Icon as={FaBook} color="purple.500" mr={2} />
                    <Text>0 Subjects</Text>
                  </Flex>
                </Flex>
              </CardBody>

              <CardFooter borderTopWidth="1px" justifyContent="space-between" bg="gray.50" py={3}>
                <Button
                  leftIcon={<FaEdit />}
                  size="sm"
                  colorScheme="blue"
                  variant="ghost"
                  onClick={() => handleEditClass(classItem)}
                >
                  Edit
                </Button>
                <Button
                  leftIcon={<FaTrash />}
                  size="sm"
                  colorScheme="red"
                  variant="ghost"
                  onClick={() => handleDeleteClass(classItem._id, classItem.name)}
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Create/Edit Class Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{isEditing ? `Edit ${currentClass?.name}` : "Create New Class"}</ModalHeader>
          <ModalCloseButton />

          <form onSubmit={handleSubmit}>
            <ModalBody>
              <FormControl isRequired mb={4}>
                <FormLabel>Class Name</FormLabel>
                <Input name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Mathematics 101" />
              </FormControl>

              <FormControl mb={4}>
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide a brief description of this class"
                  rows={3}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Academic Year</FormLabel>
                <Select name="academicYear" value={formData.academicYear} onChange={handleChange}>
                  <option value="2023-2024">2023-2024</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                </Select>
              </FormControl>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" colorScheme="blue" isLoading={isSubmitting}>
                {isEditing ? "Update" : "Create"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  )
}
