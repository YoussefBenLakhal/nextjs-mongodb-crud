"use client"

import { useState } from "react"
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  FormHelperText,
  useToast,
  VStack,
  HStack,
  Divider,
  Alert,
  AlertIcon,
} from "@chakra-ui/react"

const CreateStudentModal = ({ isOpen, onClose, classes, onStudentCreated }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    classId: "",
    createAccount: false,
    password: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const toast = useToast()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const validateForm = () => {
    if (!formData.firstName.trim() && !formData.lastName.trim()) {
      setError("First name or last name is required")
      return false
    }
    if (!formData.email.trim()) {
      setError("Email is required")
      return false
    }
    if (!formData.classId) {
      setError("Class is required")
      return false
    }
    if (formData.createAccount && !formData.password) {
      setError("Password is required when creating an account")
      return false
    }
    setError(null)
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create student")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: `Student ${formData.firstName} ${formData.lastName} created successfully${
          formData.createAccount ? " with user account" : ""
        }`,
        status: "success",
        duration: 5000,
        isClosable: true,
      })

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        classId: "",
        createAccount: false,
        password: "",
      })

      // Call the callback with the created student
      if (onStudentCreated) {
        onStudentCreated(data.student)
      }

      // Close the modal
      onClose()
    } catch (error) {
      console.error("Error creating student:", error)
      setError(error.message)
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Student</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {error && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              {error}
            </Alert>
          )}

          <form id="create-student-form" onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <HStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>First Name</FormLabel>
                  <Input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First name" />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Last Name</FormLabel>
                  <Input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last name" />
                </FormControl>
              </HStack>

              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@example.com"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Class</FormLabel>
                <Select name="classId" value={formData.classId} onChange={handleChange} placeholder="Select class">
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <Divider />

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="create-account" mb="0">
                  Create User Account
                </FormLabel>
                <Switch
                  id="create-account"
                  name="createAccount"
                  isChecked={formData.createAccount}
                  onChange={handleChange}
                />
              </FormControl>

              {formData.createAccount && (
                <FormControl isRequired={formData.createAccount}>
                  <FormLabel>Password</FormLabel>
                  <Input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                  />
                  <FormHelperText>This will create a user account that the student can use to log in.</FormHelperText>
                </FormControl>
              )}
            </VStack>
          </form>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" type="submit" form="create-student-form" isLoading={isSubmitting}>
            Create Student
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default CreateStudentModal
