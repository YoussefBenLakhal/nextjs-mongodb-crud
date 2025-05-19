"use client"

import { useState } from "react"
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Container,
  Heading,
  Text,
  Alert,
  AlertIcon,
} from "@chakra-ui/react"
import GhostSubjectCleaner from "./components/GhostSubjectCleaner"
import CacheManager from "./components/CacheManager"
import DirectDatabaseAccess from "./components/DirectDatabaseAccess"

export default function DebugPage() {
  const [tabIndex, setTabIndex] = useState(0)

  return (
    <Container maxW="container.xl" py={8}>
      <Heading mb={2}>Debug & Troubleshooting Tools</Heading>
      <Text mb={6} color="gray.600">
        Use these tools to diagnose and fix issues with the application.
      </Text>

      <Alert status="warning" mb={6}>
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Warning: Advanced Tools</Text>
          <Text>These tools provide direct access to system components. Use with caution.</Text>
        </Box>
      </Alert>

      <Tabs variant="enclosed" colorScheme="purple" index={tabIndex} onChange={setTabIndex}>
        <TabList>
          <Tab>Ghost Subject Cleaner</Tab>
          <Tab>Cache Manager</Tab>
          <Tab>Database Access</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <GhostSubjectCleaner />
          </TabPanel>

          <TabPanel>
            <CacheManager />
          </TabPanel>

          <TabPanel>
            <DirectDatabaseAccess />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  )
}
