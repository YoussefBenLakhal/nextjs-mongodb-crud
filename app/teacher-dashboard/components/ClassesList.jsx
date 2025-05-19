"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
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
  useDisclosure,
  useToast,
  Spinner,
  Text,
  Badge,
  IconButton,
  Flex,
  Alert,
  AlertIcon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react"
import { FaPlus, FaEdit, FaTrash, FaEllipsisV, FaUsers, FaBook } from "react-icons/fa"

const ClassesList = () => {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    subject: "",
    schedule: "",
    room: "",
  })

  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  // Fetch classes on component mount
  useEffect(() => {
    fetchClasses()
  }, [])

  // Fetch all classes
  const fetchClasses = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/classes", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch classes: ${response.status}`)
      }

      const data = await response.json()
      console.log("[ClassesList] Classes:", data)

      setClasses(data.classes || [])
    } catch (err) {
      console.error("[ClassesList] Error fetching classes:", err)
      setError(err.message)

      toast({
        title: "Error",
        description: `Failed to fetch classes: ${err.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle opening the modal for creating or editing a class
  const handleOpenModal = (cls = null) => {
    if (cls) {
      // Editing existing class
      setSelectedClass(cls)
      setFormData({
        name: cls.name || "",
        description: cls.description || "",
        subject: cls.subject || "",
        schedule: cls.schedule || "",
        room: cls.room || "",
      })
    } else {
      // Creating new class
      setSelectedClass(null)
      setFormData({
        name: "",
        description: "",
        subject: "",
        schedule: "",
        room: "",
      })
    }

    onOpen()
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (!formData.name) {
        toast({
          title: "Error",
          description: "Class name is required",
          status: "error",
          duration: 3000,
          isClosable: true,
        })
        return
      }

      setLoading(true)

      if (selectedClass) {
        // Update existing class
        console.log(`[ClassesList] Updating class ${selectedClass._id}:`, formData)

        const response = await fetch(`/api/classes/${selectedClass._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            teacherId: selectedClass.teacherId, // Preserve the teacher ID
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("[ClassesList] Update response:", response.status, errorText)
          throw new Error("Failed to update class")
        }

        const data = await response.json()
        console.log("[ClassesList] Update response:", data)

        toast({
          title: "Success",
          description: "Class updated successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        })
      } else {
        // Create new class
        console.log("[ClassesList] Creating new class:", formData)

        const response = await fetch("/api/classes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error("Failed to create class")
        }

        toast({
          title: "Success",
          description: "Class created successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        })
      }

      // Refresh the classes list
      fetchClasses()

      // Close the modal
      onClose()
    } catch (err) {
      console.error("[ClassesList] Error submitting class:", err)

      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle deleting a class
  const handleDelete = async (classId) => {
    if (!confirm("Are you sure you want to delete this class?")) {
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`/api/classes/${classId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        throw new Error("Failed to delete class")
      }

      toast({
        title: "Success",
        description: "Class deleted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      // Refresh the classes list
      fetchClasses()
    } catch (err) {
      console.error("[ClassesList] Error deleting class:", err)

      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // View students in a class
  const viewStudents = (classId) => {
    // Navigate to students page for this class
    window.location.href = `/teacher-dashboard/classes/${classId}/students`
  }

  // View assessments for a class
  const viewAssessments = (classId) => {
    // Navigate to assessments page for this class
    window.location.href = `/teacher-dashboard/classes/${classId}/assessments`
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">Classes</Heading>
        <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={() => handleOpenModal()}>
          Add Class
        </Button>
      </Flex>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {loading && classes.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" />
          <Text mt={4}>Loading classes...</Text>
        </Box>
      ) : classes.length === 0 ? (
        <Alert status="info" mb={4}>
          <AlertIcon />
          No classes found. Create your first class by clicking the "Add Class" button.
        </Alert>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Subject</Th>
                <Th>Schedule</Th>
                <Th>Room</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {classes.map((cls) => (
                <Tr key={cls._id}>
                  <Td>
                    <Text fontWeight="medium">{cls.name}</Text>
                    {cls.description && (
                      <Text fontSize="sm" color="gray.600" noOfLines={1}>
                        {cls.description}
                      </Text>
                    )}
                  </Td>
                  <Td>
                    <Badge colorScheme="blue">{cls.subject || "No Subject"}</Badge>
                  </Td>
                  <Td>{cls.schedule || "Not scheduled"}</Td>
                  <Td>{cls.room || "No room assigned"}</Td>
                  <Td>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<FaEllipsisV />}
                        variant="ghost"
                        size="sm"
                        aria-label="Actions"
                      />
                      <MenuList>
                        <MenuItem icon={<FaEdit />} onClick={() => handleOpenModal(cls)}>
                          Edit
                        </MenuItem>
                        <MenuItem icon={<FaUsers />} onClick={() => viewStudents(cls._id)}>
                          Students
                        </MenuItem>
                        <MenuItem icon={<FaBook />} onClick={() => viewAssessments(cls._id)}>
                          Assessments
                        </MenuItem>
                        <MenuItem icon={<FaTrash />} onClick={() => handleDelete(cls._id)} color="red.500">
                          Delete
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* Modal for creating/editing a class */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedClass ? "Edit Class" : "Create New Class"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4} isRequired>
              <FormLabel>Class Name</FormLabel>
              <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter class name" />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Description</FormLabel>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter class description"
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Subject</FormLabel>
              <Input name="subject" value={formData.subject} onChange={handleInputChange} placeholder="Enter subject" />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Schedule</FormLabel>
              <Input
                name="schedule"
                value={formData.schedule}
                onChange={handleInputChange}
                placeholder="E.g., Mon/Wed/Fri 10:00 AM - 11:30 AM"
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Room</FormLabel>
              <Input
                name="room"
                value={formData.room}
                onChange={handleInputChange}
                placeholder="Enter room number or location"
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit} isLoading={loading}>
              {selectedClass ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default ClassesList
