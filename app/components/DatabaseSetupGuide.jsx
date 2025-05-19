"use client"

import { useState } from "react"
import {
  Box,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Divider,
  OrderedList,
  ListItem,
  Link,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useClipboard,
  useToast,
  Flex,
  Badge,
} from "@chakra-ui/react"
import { FaExternalLinkAlt, FaClipboard, FaCheck, FaDatabase } from "react-icons/fa"

const DatabaseSetupGuide = () => {
  const [showMongoDBAtlas, setShowMongoDBAtlas] = useState(false)
  const [showLocalMongoDB, setShowLocalMongoDB] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const sampleEnvContent = `MONGODB_URI=mongodb+srv://username:password@cluster0.example.mongodb.net/school-management?retryWrites=true&w=majority
MONGODB_DB=school-management
JWT_SECRET=your-secret-key-at-least-32-chars-long
NEXTAUTH_SECRET=another-secret-key-for-nextauth
NEXTAUTH_URL=http://localhost:3000`

  const { hasCopied, onCopy } = useClipboard(sampleEnvContent)
  const toast = useToast()

  const testConnection = async () => {
    setTestingConnection(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/test-db", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })

      // Check if the response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        // Try to get the text to see what's wrong
        const text = await response.text()
        console.error("[DatabaseSetupGuide] Non-JSON response:", text.substring(0, 200))
        throw new Error(`Expected JSON response but got: ${contentType || "unknown"} (${text.substring(0, 100)}...)`)
      }

      const data = await response.json()
      console.log("[DatabaseSetupGuide] Test result:", data)

      setTestResult({
        success: data.success,
        message: data.success
          ? `Successfully connected to database: ${data.database?.name || "unknown"}`
          : data.error || "Unknown error occurred",
        details: data,
      })

      if (data.success) {
        toast({
          title: "Connection Successful",
          description: `Connected to MongoDB database: ${data.database?.name || "unknown"}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        })
      } else {
        toast({
          title: "Connection Failed",
          description: data.error || "Failed to connect to the database",
          status: "error",
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (error) {
      console.error("[DatabaseSetupGuide] Test error:", error)
      setTestResult({
        success: false,
        message: `Error: ${error.message}`,
        details: { error: error.toString() },
      })

      toast({
        title: "Connection Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setTestingConnection(false)
    }
  }

  return (
    <Box p={6} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
      <Heading size="md" mb={4}>
        MongoDB Database Setup Guide
      </Heading>

      <Alert status="info" mb={4}>
        <AlertIcon />
        <Box>
          <AlertTitle>Database Connection Required</AlertTitle>
          <AlertDescription>
            This application requires a MongoDB database connection to function properly. Follow the steps below to set
            up your database.
          </AlertDescription>
        </Box>
      </Alert>

      <Text mb={4}>
        You need to set up a MongoDB database and configure the connection in your environment variables. You have two
        options:
      </Text>

      <Flex gap={4} mb={6} flexWrap="wrap">
        <Button
          colorScheme="blue"
          leftIcon={<FaDatabase />}
          onClick={() => {
            setShowMongoDBAtlas(!showMongoDBAtlas)
            if (showMongoDBAtlas) setShowLocalMongoDB(false)
          }}
        >
          {showMongoDBAtlas ? "Hide MongoDB Atlas Instructions" : "Use MongoDB Atlas (Recommended)"}
        </Button>

        <Button
          variant="outline"
          leftIcon={<FaDatabase />}
          onClick={() => {
            setShowLocalMongoDB(!showLocalMongoDB)
            if (showLocalMongoDB) setShowMongoDBAtlas(false)
          }}
        >
          {showLocalMongoDB ? "Hide Local MongoDB Instructions" : "Use Local MongoDB"}
        </Button>
      </Flex>

      {showMongoDBAtlas && (
        <Box mb={6} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
          <Heading size="sm" mb={3}>
            Setting up MongoDB Atlas (Cloud Database)
          </Heading>

          <OrderedList spacing={3}>
            <ListItem>
              <Text>
                Go to{" "}
                <Link href="https://www.mongodb.com/cloud/atlas" isExternal color="blue.500">
                  MongoDB Atlas <FaExternalLinkAlt size="0.8em" style={{ display: "inline" }} />
                </Link>{" "}
                and create a free account if you don't have one.
              </Text>
            </ListItem>

            <ListItem>
              <Text>Create a new project and build a free tier cluster.</Text>
            </ListItem>

            <ListItem>
              <Text>Once your cluster is created, click on "Connect" and then "Connect your application".</Text>
            </ListItem>

            <ListItem>
              <Text>Create a database user with a username and password. Make sure to remember these credentials.</Text>
            </ListItem>

            <ListItem>
              <Text>
                Add your IP address to the IP Access List or add 0.0.0.0/0 to allow access from anywhere (not
                recommended for production).
              </Text>
            </ListItem>

            <ListItem>
              <Text>Copy the connection string and replace &lt;password&gt; with your database user's password.</Text>
            </ListItem>

            <ListItem>
              <Text>Create a .env.local file in the root of your project with the following content:</Text>
              <Code p={3} mt={2} display="block" whiteSpace="pre" borderRadius="md">
                {sampleEnvContent}
              </Code>
              <Button
                size="sm"
                leftIcon={hasCopied ? <FaCheck /> : <FaClipboard />}
                onClick={onCopy}
                mt={2}
                colorScheme={hasCopied ? "green" : "gray"}
              >
                {hasCopied ? "Copied!" : "Copy to clipboard"}
              </Button>
            </ListItem>

            <ListItem>
              <Text>Replace the MONGODB_URI value with your connection string from MongoDB Atlas.</Text>
            </ListItem>

            <ListItem>
              <Text>Restart your Next.js development server for the changes to take effect.</Text>
            </ListItem>
          </OrderedList>

          <Alert status="warning" mt={4} size="sm">
            <AlertIcon />
            <Box>
              <AlertTitle fontSize="sm">Security Note</AlertTitle>
              <AlertDescription fontSize="sm">
                Never commit your .env.local file to version control. Make sure it's included in your .gitignore file.
              </AlertDescription>
            </Box>
          </Alert>
        </Box>
      )}

      {showLocalMongoDB && (
        <Box mb={6} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
          <Heading size="sm" mb={3}>
            Setting up Local MongoDB
          </Heading>

          <OrderedList spacing={3}>
            <ListItem>
              <Text>
                Download and install MongoDB Community Server from{" "}
                <Link href="https://www.mongodb.com/try/download/community" isExternal color="blue.500">
                  MongoDB Download Center <FaExternalLinkAlt size="0.8em" style={{ display: "inline" }} />
                </Link>
              </Text>
            </ListItem>

            <ListItem>
              <Text>Follow the installation instructions for your operating system.</Text>
            </ListItem>

            <ListItem>
              <Text>Start the MongoDB service according to your OS instructions.</Text>
            </ListItem>

            <ListItem>
              <Text>Create a .env.local file in the root of your project with the following content:</Text>
              <Code p={3} mt={2} display="block" whiteSpace="pre" borderRadius="md">
                {`MONGODB_URI=mongodb://localhost:27017/school-management
MONGODB_DB=school-management
JWT_SECRET=your-secret-key-at-least-32-chars-long
NEXTAUTH_SECRET=another-secret-key-for-nextauth
NEXTAUTH_URL=http://localhost:3000`}
              </Code>
              <Button
                size="sm"
                leftIcon={hasCopied ? <FaCheck /> : <FaClipboard />}
                onClick={() => {
                  onCopy(`MONGODB_URI=mongodb://localhost:27017/school-management
MONGODB_DB=school-management
JWT_SECRET=your-secret-key-at-least-32-chars-long
NEXTAUTH_SECRET=another-secret-key-for-nextauth
NEXTAUTH_URL=http://localhost:3000`)
                }}
                mt={2}
                colorScheme={hasCopied ? "green" : "gray"}
              >
                {hasCopied ? "Copied!" : "Copy to clipboard"}
              </Button>
            </ListItem>

            <ListItem>
              <Text>Restart your Next.js development server for the changes to take effect.</Text>
            </ListItem>
          </OrderedList>

          <Accordion allowToggle mt={4}>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight="medium">
                    Troubleshooting Local MongoDB
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <OrderedList spacing={2}>
                  <ListItem>
                    <Text>Make sure MongoDB service is running on your machine</Text>
                  </ListItem>
                  <ListItem>
                    <Text>Check if MongoDB is running on the default port (27017)</Text>
                  </ListItem>
                  <ListItem>
                    <Text>
                      If you've set up MongoDB with authentication, update your connection string to include username
                      and password:
                      <Code display="block" mt={1} p={2}>
                        mongodb://username:password@localhost:27017/school-management
                      </Code>
                    </Text>
                  </ListItem>
                  <ListItem>
                    <Text>Check MongoDB logs for any errors</Text>
                  </ListItem>
                </OrderedList>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </Box>
      )}

      <Divider my={6} />

      <Heading size="sm" mb={4}>
        Test Your Database Connection
      </Heading>

      <Text mb={4}>
        After setting up your MongoDB connection, test it to make sure everything is working correctly:
      </Text>

      <Button
        colorScheme="blue"
        onClick={testConnection}
        isLoading={testingConnection}
        loadingText="Testing Connection"
        mb={4}
      >
        Test Database Connection
      </Button>

      {testResult && (
        <Alert status={testResult.success ? "success" : "error"} variant="solid" mt={4} borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>{testResult.success ? "Connection Successful" : "Connection Failed"}</AlertTitle>
            <AlertDescription>{testResult.message}</AlertDescription>
          </Box>
        </Alert>
      )}

      <Accordion allowToggle mt={6}>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                Environment Variables Reference
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <Box>
              <Text fontWeight="bold" mb={2}>
                Required Environment Variables:
              </Text>
              <Box mb={4}>
                <Badge colorScheme="red" mb={1}>
                  Required
                </Badge>
                <Text fontWeight="medium">MONGODB_URI</Text>
                <Text fontSize="sm">The connection string to your MongoDB database.</Text>
                <Code display="block" mt={1} p={2} fontSize="sm">
                  MONGODB_URI=mongodb+srv://username:password@cluster0.example.mongodb.net/school-management?retryWrites=true&w=majority
                </Code>
              </Box>

              <Box mb={4}>
                <Badge colorScheme="red" mb={1}>
                  Required
                </Badge>
                <Text fontWeight="medium">MONGODB_DB</Text>
                <Text fontSize="sm">The name of your MongoDB database.</Text>
                <Code display="block" mt={1} p={2} fontSize="sm">
                  MONGODB_DB=school-management
                </Code>
              </Box>

              <Box mb={4}>
                <Badge colorScheme="red" mb={1}>
                  Required
                </Badge>
                <Text fontWeight="medium">JWT_SECRET</Text>
                <Text fontSize="sm">A secret key used for JWT token generation and verification.</Text>
                <Code display="block" mt={1} p={2} fontSize="sm">
                  JWT_SECRET=your-secret-key-at-least-32-chars-long
                </Code>
              </Box>

              <Box mb={4}>
                <Badge colorScheme="red" mb={1}>
                  Required
                </Badge>
                <Text fontWeight="medium">NEXTAUTH_SECRET</Text>
                <Text fontSize="sm">A secret key used by NextAuth.js for session encryption.</Text>
                <Code display="block" mt={1} p={2} fontSize="sm">
                  NEXTAUTH_SECRET=another-secret-key-for-nextauth
                </Code>
              </Box>

              <Box mb={4}>
                <Badge colorScheme="red" mb={1}>
                  Required
                </Badge>
                <Text fontWeight="medium">NEXTAUTH_URL</Text>
                <Text fontSize="sm">The base URL of your application.</Text>
                <Code display="block" mt={1} p={2} fontSize="sm">
                  NEXTAUTH_URL=http://localhost:3000
                </Code>
              </Box>
            </Box>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Box>
  )
}

export default DatabaseSetupGuide
