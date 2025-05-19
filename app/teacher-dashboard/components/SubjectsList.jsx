"use client"

import { useState, useEffect, useCallback } from "react"
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
  Select,
  Badge,
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
  Spinner,
  useDisclosure,
  useToast,
  Alert,
  AlertIcon,
  Code,
  Switch,
  IconButton,
} from "@chakra-ui/react"
import { FaPlus, FaEdit, FaTrash, FaSync, FaBug, FaBroom } from "react-icons/fa"

const SubjectsList = ({
  subjects: initialSubjects,
  setSubjects,
  loading: externalLoading,
  fetchSubjects: externalFetchSubjects,
  classes,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedClass, setSelectedClass] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [currentSubject, setCurrentSubject] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    classId: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [subjects, setLocalSubjects] = useState(initialSubjects || [])
  const [fetchAttempts, setFetchAttempts] = useState(0)
  const [debugInfo, setDebugInfo] = useState({
    allSubjects: [],
    filteredSubjects: [],
    selectedSubject: "",
    selectedClass: "",
    selectedSubjectObject: null,
  })
  const [showDebug, setShowDebug] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [subjectToDelete, setSubjectToDelete] = useState(null)
  const [forceDelete, setForceDelete] = useState(false)
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [deleteError, setDeleteError] = useState(null)
  const toast = useToast()

  // Update debug info whenever relevant state changes
  useEffect(() => {
    setDebugInfo({
      allSubjects: subjects,
      filteredSubjects: filteredSubjects,
      selectedSubject: currentSubject?._id || "",
      selectedClass: selectedClass,
      selectedSubjectObject: currentSubject,
    })
  }, [subjects, selectedClass, currentSubject])

  // Memoize the fetch function to prevent recreation on each render
  const fetchLocalSubjects = useCallback(
    async (showToast = false) => {
      // Prevent excessive fetch attempts
      if (fetchAttempts > 3 && !showToast) {
        setError("Failed to load subjects after multiple attempts. Please refresh the page.")
        return
      }

      if (loading) return

      setLoading(true)
      setError(null)

      try {
        console.log("[SubjectsList] Fetching subjects...")
        // Add cache-busting parameter
        const timestamp = Date.now()
        const response = await fetch(`/api/subjects?t=${timestamp}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          cache: "no-store", // Important: Prevent caching
          credentials: "include", // Add this line
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            `Failed to fetch subjects: ${response.status} ${response.statusText} - ${errorData.error || ""}`,
          )
        }

        const data = await response.json()
        console.log("[SubjectsList] Subjects fetched:", data.subjects?.length || 0)

        // Log the first subject to debug
        if (data.subjects && data.subjects.length > 0) {
          console.log("[SubjectsList] Sample subject:", data.subjects[0])
        } else {
          console.log("[SubjectsList] No subjects returned from API")
        }

        setLocalSubjects(data.subjects || [])
        if (setSubjects) {
          setSubjects(data.subjects || [])
        }

        // Reset fetch attempts on success
        setFetchAttempts(0)

        if (showToast) {
          toast({
            title: "Subjects refreshed",
            description: `Successfully loaded ${data.subjects?.length || 0} subjects.`,
            status: "success",
            duration: 3000,
            isClosable: true,
          })
        }
      } catch (error) {
        console.error("[SubjectsList] Error fetching subjects:", error)
        setError(`Failed to load subjects: ${error.message}`)
        setFetchAttempts((prev) => prev + 1)

        if (showToast) {
          toast({
            title: "Error refreshing subjects",
            description: error.message,
            status: "error",
            duration: 5000,
            isClosable: true,
          })
        }
      } finally {
        setLoading(false)
      }
    },
    [setSubjects, fetchAttempts, loading, toast],
  )

  // Fetch subjects when component mounts
  useEffect(() => {
    // Only fetch if we don't have subjects and we're not already loading
    if ((!subjects || subjects.length === 0) && !loading && !externalLoading && fetchAttempts < 3) {
      if (typeof externalFetchSubjects === "function") {
        console.log("[SubjectsList] Using external fetch function")
        externalFetchSubjects()
      } else {
        console.log("[SubjectsList] Using local fetch function")
        fetchLocalSubjects()
      }
    }
  }, [subjects, loading, externalLoading, externalFetchSubjects, fetchLocalSubjects, fetchAttempts])

  // Update local subjects when props change
  useEffect(() => {
    if (initialSubjects && initialSubjects.length > 0) {
      console.log("[SubjectsList] Updating local subjects from props:", initialSubjects.length)
      setLocalSubjects(initialSubjects)
    }
  }, [initialSubjects])

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Filter subjects by selected class
  const filteredSubjects = selectedClass ? subjects.filter((subject) => subject.classId === selectedClass) : subjects

  // Open modal for creating a new subject
  const handleCreateSubject = () => {
    setIsEditing(false)
    setFormData({
      name: "",
      code: "",
      description: "",
      classId: selectedClass || "",
    })
    onOpen()
  }

  // Open modal for editing an existing subject
  const handleEditSubject = (subject) => {
    setIsEditing(true)
    setCurrentSubject(subject)
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description || "",
      classId: subject.classId,
    })
    onOpen()
  }

  // Submit form to create or update a subject
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (isEditing && currentSubject) {
        // Update existing subject
        console.log(`[SubjectsList] Updating subject: ${currentSubject._id}`)
        const response = await fetch(`/api/subjects/${currentSubject._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
          credentials: "include", // Add this line
        })

        // Log the response status
        console.log(`[SubjectsList] Update response status: ${response.status}`)

        // Try to get the response text first for debugging
        const responseText = await response.text()
        console.log(`[SubjectsList] Update response text: ${responseText}`)

        // Parse the JSON if possible
        let responseData
        try {
          responseData = JSON.parse(responseText)
        } catch (parseError) {
          console.error(`[SubjectsList] Error parsing response: ${parseError}`)
          throw new Error(`Failed to parse response: ${responseText.substring(0, 100)}...`)
        }

        if (!response.ok) {
          throw new Error(responseData.error || responseData.details || `Failed to update subject (${response.status})`)
        }

        // Update subjects state
        const updatedSubjects = subjects.map((s) => (s._id === currentSubject._id ? { ...s, ...formData } : s))
        setLocalSubjects(updatedSubjects)
        if (setSubjects) {
          setSubjects(updatedSubjects)
        }

        toast({
          title: "Subject updated",
          description: `${formData.name} has been updated successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        })
      } else {
        // Create new subject
        console.log(`[SubjectsList] Creating new subject: ${formData.name}`)
        const response = await fetch("/api/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
          credentials: "include", // Add this line
        })

        // Log the response status
        console.log(`[SubjectsList] Create response status: ${response.status}`)

        // Try to get the response text first for debugging
        const responseText = await response.text()
        console.log(`[SubjectsList] Create response text: ${responseText}`)

        // Parse the JSON if possible
        let responseData
        try {
          responseData = JSON.parse(responseText)
        } catch (parseError) {
          console.error(`[SubjectsList] Error parsing response: ${parseError}`)
          throw new Error(`Failed to parse response: ${responseText.substring(0, 100)}...`)
        }

        if (!response.ok) {
          throw new Error(responseData.error || responseData.details || `Failed to create subject (${response.status})`)
        }

        // Add new subject to state
        const newSubject = responseData.subject || {
          _id: responseData.subjectId,
          ...formData,
          createdAt: new Date().toISOString(),
        }

        const updatedSubjects = [...subjects, newSubject]
        setLocalSubjects(updatedSubjects)
        if (setSubjects) {
          setSubjects(updatedSubjects)
        }

        toast({
          title: "Subject created",
          description: `${formData.name} has been created successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        })

        // Refresh subjects from server to ensure we have the latest data
        setTimeout(() => {
          if (typeof externalFetchSubjects === "function") {
            externalFetchSubjects()
          } else {
            fetchLocalSubjects()
          }
        }, 500)
      }

      onClose()
    } catch (error) {
      console.error("[SubjectsList] Error submitting subject:", error)
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

  // Open delete confirmation modal
  const openDeleteModal = (subject) => {
    setSubjectToDelete(subject)
    setForceDelete(false)
    setAttendanceCount(0)
    setDeleteError(null)
    setIsDeleteModalOpen(true)
  }

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setSubjectToDelete(null)
    setForceDelete(false)
    setAttendanceCount(0)
    setDeleteError(null)
  }

  // Delete a subject
  const handleDeleteSubject = async () => {
    if (!subjectToDelete) return

    try {
      setDeleteError(null)
      console.log(`[SubjectsList] Deleting subject: ${subjectToDelete._id} (${subjectToDelete.name})`)
      console.log(`[SubjectsList] Force delete: ${forceDelete}`)

      // Show a loading toast
      const loadingToastId = toast({
        title: "Deleting subject...",
        status: "loading",
        duration: null,
      })

      // First try the normal API route
      // Add cache-busting parameter
      const timestamp = Date.now()
      let url = forceDelete
        ? `/api/subjects/${subjectToDelete._id}?force=true&t=${timestamp}`
        : `/api/subjects/${subjectToDelete._id}?t=${timestamp}`

      // Add name and code as query parameters to help with fallback deletion
      url += `&name=${encodeURIComponent(subjectToDelete.name)}&code=${encodeURIComponent(subjectToDelete.code)}`

      console.log(`[SubjectsList] DELETE request URL: ${url}`)

      let response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        credentials: "include", // Include cookies with the request
      })

      console.log(`[SubjectsList] DELETE response status: ${response.status}`)

      // Try to parse the response as JSON
      let responseData = {}
      let responseText = ""

      try {
        responseText = await response.text()
        console.log(`[SubjectsList] DELETE response text: ${responseText}`)

        if (responseText) {
          responseData = JSON.parse(responseText)
          console.log("[SubjectsList] Delete response data:", responseData)
        }
      } catch (e) {
        console.error("[SubjectsList] Error parsing response:", e)
        console.log("[SubjectsList] Raw response text:", responseText)
      }

      // If the normal delete fails with 404, try the debug endpoint as a fallback
      if (response.status === 404) {
        console.log("[SubjectsList] Subject not found in database, trying debug endpoint")

        // Try the debug endpoint as a fallback
        const debugUrl = `/api/debug-subjects?id=${subjectToDelete._id}&action=delete&force=${forceDelete}&t=${timestamp}`
        console.log(`[SubjectsList] DEBUG DELETE request URL: ${debugUrl}`)

        response = await fetch(debugUrl, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          credentials: "include",
        })

        console.log(`[SubjectsList] DEBUG DELETE response status: ${response.status}`)

        try {
          responseText = await response.text()
          console.log(`[SubjectsList] DEBUG DELETE response text: ${responseText}`)

          if (responseText) {
            responseData = JSON.parse(responseText)
            console.log("[SubjectsList] Debug delete response data:", responseData)
          }
        } catch (e) {
          console.error("[SubjectsList] Error parsing debug response:", e)
        }

        // If the debug endpoint indicates we should remove from cache
        if (responseData.action === "remove_from_cache") {
          console.log("[SubjectsList] Removing ghost entry from frontend cache")
          // Close the loading toast
          toast.close(loadingToastId)

          // Remove subject from state even though it wasn't in the database
          const updatedSubjects = subjects.filter((s) => s._id !== subjectToDelete._id)
          setLocalSubjects(updatedSubjects)
          if (setSubjects) {
            setSubjects(updatedSubjects)
          }

          toast({
            title: "Subject removed",
            description: `${subjectToDelete.name} has been removed from the list. It was not found in the database.`,
            status: "success",
            duration: 3000,
            isClosable: true,
          })

          // Close the modal
          closeDeleteModal()
          return
        }
      }

      // Close the loading toast
      toast.close(loadingToastId)

      if (!response.ok) {
        // Check if this is a constraint error with attendance records
        if (response.status === 400 && responseData.attendanceCount) {
          setAttendanceCount(responseData.attendanceCount)
          throw new Error(
            `This subject has ${responseData.attendanceCount} attendance records. Use force delete to remove both the subject and its attendance records.`,
          )
        }

        // Use the error message from the server if available
        const errorMessage =
          responseData.error || responseData.details || `Failed to delete subject (${response.status})`
        console.error(`[SubjectsList] Server returned error: ${response.status} - ${errorMessage}`)

        // Special case for 404 - remove from frontend cache
        if (response.status === 404) {
          console.log("[SubjectsList] Subject not found in database, removing from frontend cache")

          // Remove subject from state even though it wasn't in the database
          const updatedSubjects = subjects.filter((s) => s._id !== subjectToDelete._id)
          setLocalSubjects(updatedSubjects)
          if (setSubjects) {
            setSubjects(updatedSubjects)
          }

          toast({
            title: "Subject removed",
            description: `${subjectToDelete.name} has been removed from the list. It was not found in the database.`,
            status: "success",
            duration: 3000,
            isClosable: true,
          })

          // Close the modal
          closeDeleteModal()
          return
        }

        throw new Error(errorMessage)
      }

      console.log(`[SubjectsList] Subject deleted successfully: ${subjectToDelete._id}`)

      // Remove subject from state
      const updatedSubjects = subjects.filter((s) => s._id !== subjectToDelete._id)
      setLocalSubjects(updatedSubjects)
      if (setSubjects) {
        setSubjects(updatedSubjects)
      }

      toast({
        title: "Subject deleted",
        description: forceDelete
          ? `${subjectToDelete.name} and its related records have been deleted successfully.`
          : `${subjectToDelete.name} has been deleted successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      // Close the modal
      closeDeleteModal()

      // Refresh the subjects list after a short delay
      setTimeout(() => {
        if (typeof externalFetchSubjects === "function") {
          externalFetchSubjects()
        } else {
          fetchLocalSubjects()
        }
      }, 500)
    } catch (error) {
      console.error("[SubjectsList] Error deleting subject:", error)
      setDeleteError(error.message)

      // If it's an authentication error, suggest logging in again
      if (error.message.includes("Unauthorized")) {
        toast({
          title: "Authentication Error",
          description: "Your session may have expired. Please try logging in again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        })
      } else {
        toast({
          title: "Error",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        })
      }
    }
  }

  // Get class name by ID
  const getClassName = (classId) => {
    // Assuming classes are provided as a prop
    const classObj = classes?.find((c) => c._id === classId)
    return classObj ? classObj.name : "Unknown Class"
  }

  // Determine if we're in a loading state
  const isLoading = loading || externalLoading

  // Manual refresh function
  const handleRefresh = () => {
    if (typeof externalFetchSubjects === "function") {
      externalFetchSubjects(true)
    } else {
      fetchLocalSubjects(true)
    }
  }

  // Force reload the page
  const forceReload = () => {
    toast({
      title: "Reloading page",
      description: "The page will reload with cache bypass.",
      status: "info",
      duration: 1000,
      isClosable: true,
    })

    // Force reload with cache bypass
    window.location.reload(true)
  }

  return (
    <Box>
      <Flex direction={{ base: "column", md: "row" }} justify="space-between" align="center" mb={6} gap={4}>
        <Heading size="md">Manage Subjects</Heading>

        <Flex gap={4} width={{ base: "100%", md: "auto" }}>
          <Select
            placeholder="Filter by class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            width={{ base: "100%", md: "250px" }}
            isDisabled={isLoading}
          >
            <option value="">All Classes</option>
            {Array.isArray(classes) &&
              classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
          </Select>

          <Button
            leftIcon={<FaSync />}
            colorScheme="gray"
            onClick={handleRefresh}
            isLoading={isLoading}
            title="Refresh subjects"
          >
            Refresh
          </Button>

          <IconButton
            icon={<FaBroom />}
            colorScheme="orange"
            onClick={forceReload}
            title="Force reload page"
            aria-label="Force reload page"
          />

          <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={handleCreateSubject} isDisabled={isLoading}>
            Add Subject
          </Button>

          <Button
            leftIcon={<FaBug />}
            colorScheme={showDebug ? "red" : "gray"}
            onClick={() => setShowDebug(!showDebug)}
            size="sm"
          >
            {showDebug ? "Hide Debug" : "Debug"}
          </Button>
        </Flex>
      </Flex>

      {showDebug && (
        <Box mb={6} p={4} bg="gray.50" borderRadius="md">
          <Heading size="sm" mb={2}>
            Debug Information
          </Heading>
          <Code p={2} display="block" whiteSpace="pre" overflowX="auto">
            {JSON.stringify(debugInfo, null, 2)}
          </Code>
        </Box>
      )}

      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Flex justify="center" align="center" minH="200px">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      ) : !Array.isArray(subjects) || subjects.length === 0 ? (
        <Card p={6} textAlign="center">
          <CardBody>
            <Text mb={4}>You haven't created any subjects yet.</Text>
            <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={handleCreateSubject}>
              Create Your First Subject
            </Button>
          </CardBody>
        </Card>
      ) : filteredSubjects.length === 0 ? (
        <Card p={6} textAlign="center">
          <CardBody>
            <Text mb={4}>No subjects found for the selected class.</Text>
            <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={handleCreateSubject}>
              Create Subject
            </Button>
          </CardBody>
        </Card>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filteredSubjects.map((subject) => (
            <Card key={subject._id} borderWidth="1px" borderRadius="lg" overflow="hidden">
              <CardHeader bg="purple.50" py={4}>
                <Flex justify="space-between" align="center">
                  <Heading size="md">{subject.name}</Heading>
                  <Badge colorScheme="purple">{subject.code}</Badge>
                </Flex>
                <Text fontSize="sm" color="gray.600" mt={2}>
                  {getClassName(subject.classId)}
                </Text>
              </CardHeader>

              <CardBody>
                <Text noOfLines={3}>{subject.description || "No description provided."}</Text>
                {showDebug && (
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    ID: <Code fontSize="xs">{subject._id}</Code>
                  </Text>
                )}
              </CardBody>

              <CardFooter borderTopWidth="1px" justifyContent="space-between" bg="gray.50" py={3}>
                <Button
                  leftIcon={<FaEdit />}
                  size="sm"
                  colorScheme="purple"
                  variant="ghost"
                  onClick={() => handleEditSubject(subject)}
                >
                  Edit
                </Button>
                <Button
                  leftIcon={<FaTrash />}
                  size="sm"
                  colorScheme="red"
                  variant="ghost"
                  onClick={() => openDeleteModal(subject)}
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Create/Edit Subject Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{isEditing ? `Edit ${currentSubject?.name}` : "Create New Subject"}</ModalHeader>
          <ModalCloseButton />

          <form onSubmit={handleSubmit}>
            <ModalBody>
              <FormControl isRequired mb={4}>
                <FormLabel>Subject Name</FormLabel>
                <Input name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Mathematics" />
              </FormControl>

              <FormControl isRequired mb={4}>
                <FormLabel>Subject Code</FormLabel>
                <Input name="code" value={formData.code} onChange={handleChange} placeholder="e.g., MATH101" />
              </FormControl>

              <FormControl mb={4}>
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide a brief description of this subject"
                  rows={3}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Class</FormLabel>
                <Select
                  name="classId"
                  value={formData.classId}
                  onChange={handleChange}
                  placeholder="Select a class"
                  isDisabled={isEditing}
                >
                  {Array.isArray(classes) &&
                    classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name}
                      </option>
                    ))}
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Subject</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {deleteError && (
              <Alert status="error" mb={4}>
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Error</Text>
                  <Text>{deleteError}</Text>
                </Box>
              </Alert>
            )}

            {attendanceCount > 0 ? (
              <>
                <Alert status="warning" mb={4}>
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Warning: This subject has attendance records</Text>
                    <Text>
                      This subject has {attendanceCount} attendance records. Deleting it will remove these records.
                    </Text>
                  </Box>
                </Alert>
                <FormControl display="flex" alignItems="center" mb={4}>
                  <FormLabel htmlFor="force-delete" mb="0">
                    Force delete with attendance records
                  </FormLabel>
                  <Switch
                    id="force-delete"
                    isChecked={forceDelete}
                    onChange={(e) => setForceDelete(e.target.checked)}
                  />
                </FormControl>
              </>
            ) : (
              <Text>Are you sure you want to delete {subjectToDelete?.name}? This action cannot be undone.</Text>
            )}

            {showDebug && subjectToDelete && (
              <Box mt={4} p={2} bg="gray.50" borderRadius="md">
                <Text fontSize="sm" fontWeight="bold">
                  Debug Info:
                </Text>
                <Text fontSize="xs">Subject ID: {subjectToDelete._id}</Text>
                <Text fontSize="xs">Force Delete: {forceDelete ? "Yes" : "No"}</Text>
                <Text fontSize="xs">
                  Delete URL: {`/api/subjects/${subjectToDelete._id}${forceDelete ? "?force=true" : ""}`}
                </Text>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDeleteSubject} isDisabled={attendanceCount > 0 && !forceDelete}>
              {attendanceCount > 0 && forceDelete ? "Force Delete" : "Delete"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default SubjectsList
