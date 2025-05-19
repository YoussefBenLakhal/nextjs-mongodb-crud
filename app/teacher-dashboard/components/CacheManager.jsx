"use client"

import { useState } from "react"
import {
  Box,
  Button,
  Heading,
  Text,
  Alert,
  AlertIcon,
  Spinner,
  useToast,
  Code,
  Stack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  FormControl,
  FormLabel,
  Divider,
} from "@chakra-ui/react"
import { FaTrash, FaSync, FaBroom, FaServer } from "react-icons/fa"

export default function CacheManager() {
  const [loading, setLoading] = useState(false)
  const [serverLoading, setServerLoading] = useState(false)
  const [error, setError] = useState(null)
  const [cacheInfo, setCacheInfo] = useState(null)
  const [serverCacheInfo, setServerCacheInfo] = useState(null)
  const [selectedCollection, setSelectedCollection] = useState("")
  const toast = useToast()

  // Function to clear browser cache
  const clearBrowserCache = async () => {
    setLoading(true)
    setError(null)

    try {
      // Clear localStorage
      localStorage.clear()

      // Clear sessionStorage
      sessionStorage.clear()

      // Attempt to clear cache API if available
      if ("caches" in window) {
        const cacheNames = await window.caches.keys()
        await Promise.all(cacheNames.map((name) => window.caches.delete(name)))
      }

      // Force reload with cache bypass
      toast({
        title: "Cache cleared",
        description: "Browser cache has been cleared. The page will reload in 3 seconds.",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      // Wait 3 seconds then reload
      setTimeout(() => {
        window.location.reload(true)
      }, 3000)
    } catch (err) {
      console.error("Error clearing cache:", err)
      setError(err.message)

      toast({
        title: "Error",
        description: `Failed to clear cache: ${err.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // Function to check cache status
  const checkCacheStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      const info = {
        localStorage: {
          size: 0,
          items: 0,
        },
        sessionStorage: {
          size: 0,
          items: 0,
        },
        cacheAPI: {
          available: "caches" in window,
          caches: [],
        },
      }

      // Check localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        const value = localStorage.getItem(key)
        info.localStorage.size += (key.length + value.length) * 2 // UTF-16 characters are 2 bytes
        info.localStorage.items++
      }

      // Check sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        const value = sessionStorage.getItem(key)
        info.sessionStorage.size += (key.length + value.length) * 2
        info.sessionStorage.items++
      }

      // Check Cache API
      if (info.cacheAPI.available) {
        const cacheNames = await window.caches.keys()
        info.cacheAPI.caches = cacheNames
      }

      setCacheInfo(info)

      toast({
        title: "Cache status checked",
        description: `Found ${info.localStorage.items} localStorage items and ${info.sessionStorage.items} sessionStorage items.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      console.error("Error checking cache:", err)
      setError(err.message)

      toast({
        title: "Error",
        description: `Failed to check cache: ${err.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // Function to force reload with cache bypass
  const forceReload = () => {
    toast({
      title: "Reloading page",
      description: "The page will reload with cache bypass in 1 second.",
      status: "info",
      duration: 1000,
      isClosable: true,
    })

    setTimeout(() => {
      window.location.reload(true)
    }, 1000)
  }

  // Function to clear server-side cache
  const clearServerCache = async () => {
    setServerLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/clear-cache", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify({
          collection: selectedCollection || undefined,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Server returned ${response.status}`)
      }

      const data = await response.json()
      setServerCacheInfo(data)

      toast({
        title: "Server cache refreshed",
        description: data.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      console.error("Error clearing server cache:", err)
      setError(err.message)

      toast({
        title: "Error",
        description: `Failed to clear server cache: ${err.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setServerLoading(false)
    }
  }

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
      <Heading size="md" mb={4}>
        Cache Manager
      </Heading>

      <Text mb={4}>Use these tools to manage browser and server cache to fix issues with stale data.</Text>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      <Tabs variant="enclosed" colorScheme="blue" mb={4}>
        <TabList>
          <Tab>Browser Cache</Tab>
          <Tab>Server Cache</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Stack spacing={4} direction={{ base: "column", md: "row" }} mb={4}>
              <Button
                leftIcon={<FaSync />}
                colorScheme="blue"
                onClick={checkCacheStatus}
                isLoading={loading && !cacheInfo}
              >
                Check Cache Status
              </Button>

              <Button leftIcon={<FaBroom />} colorScheme="yellow" onClick={forceReload}>
                Force Reload Page
              </Button>

              <Button
                leftIcon={<FaTrash />}
                colorScheme="red"
                onClick={clearBrowserCache}
                isLoading={loading && cacheInfo}
              >
                Clear Browser Cache
              </Button>
            </Stack>

            {loading && !cacheInfo && (
              <Box textAlign="center" py={4}>
                <Spinner size="xl" />
                <Text mt={2}>Checking cache status...</Text>
              </Box>
            )}

            {cacheInfo && (
              <Box mt={4}>
                <Heading size="sm" mb={2}>
                  Browser Cache Information
                </Heading>

                <Box p={3} bg="gray.50" borderRadius="md" mb={3}>
                  <Text fontWeight="bold">Local Storage</Text>
                  <Text>Items: {cacheInfo.localStorage.items}</Text>
                  <Text>Size: {(cacheInfo.localStorage.size / 1024).toFixed(2)} KB</Text>
                </Box>

                <Box p={3} bg="gray.50" borderRadius="md" mb={3}>
                  <Text fontWeight="bold">Session Storage</Text>
                  <Text>Items: {cacheInfo.sessionStorage.items}</Text>
                  <Text>Size: {(cacheInfo.sessionStorage.size / 1024).toFixed(2)} KB</Text>
                </Box>

                <Box p={3} bg="gray.50" borderRadius="md">
                  <Text fontWeight="bold">Cache API</Text>
                  <Text>Available: {cacheInfo.cacheAPI.available ? "Yes" : "No"}</Text>
                  {cacheInfo.cacheAPI.available && (
                    <>
                      <Text>Cache Names:</Text>
                      <Code p={2} display="block" whiteSpace="pre" overflowX="auto">
                        {JSON.stringify(cacheInfo.cacheAPI.caches, null, 2)}
                      </Code>
                    </>
                  )}
                </Box>
              </Box>
            )}
          </TabPanel>

          <TabPanel>
            <Text mb={4}>
              This tool refreshes the server-side database cache to ensure you're seeing the most up-to-date data.
            </Text>

            <FormControl mb={4}>
              <FormLabel>Collection to refresh (optional)</FormLabel>
              <Select
                placeholder="All collections"
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
              >
                <option value="subjects">Subjects</option>
                <option value="classes">Classes</option>
                <option value="students">Students</option>
                <option value="attendance">Attendance</option>
                <option value="assessments">Assessments</option>
              </Select>
            </FormControl>

            <Button
              leftIcon={<FaServer />}
              colorScheme="purple"
              onClick={clearServerCache}
              isLoading={serverLoading}
              mb={4}
            >
              Refresh Server Cache
            </Button>

            {serverCacheInfo && (
              <Box mt={4}>
                <Heading size="sm" mb={2}>
                  Server Cache Refresh Results
                </Heading>
                <Box p={3} bg="gray.50" borderRadius="md">
                  <Text fontWeight="bold">{serverCacheInfo.message}</Text>
                  {serverCacheInfo.count !== undefined && <Text>Items in collection: {serverCacheInfo.count}</Text>}
                  {serverCacheInfo.counts && (
                    <>
                      <Divider my={2} />
                      <Text fontWeight="bold">Collection Counts:</Text>
                      <Code p={2} display="block" whiteSpace="pre" overflowX="auto">
                        {JSON.stringify(serverCacheInfo.counts, null, 2)}
                      </Code>
                    </>
                  )}
                </Box>
              </Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}
