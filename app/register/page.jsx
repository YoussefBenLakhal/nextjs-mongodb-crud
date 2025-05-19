// app/register/page.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
  Text,
  Alert,
  AlertIcon,
  useColorModeValue,
  VStack,
  Card,
  CardBody,
  Divider,
  Link,
} from '@chakra-ui/react';
import { clientRegister } from '../../lib/register-service'; // Make sure this file exists

export default function RegisterPage() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  const bgColor = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password length
    if (credentials.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      await clientRegister(credentials);
      
      // Show success message or redirect
      router.push('/login');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bg={useColorModeValue('gray.50', 'gray.800')}
      py={12}
      px={{ base: 4, lg: 8 }}
    >
      <Container maxW="md">
        <VStack spacing={8} align="stretch">
          <VStack spacing={2} textAlign="center">
            <Heading fontSize="3xl" fontWeight="bold">
              Create a new account
            </Heading>
            <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="md">
              Join our platform to access all features
            </Text>
          </VStack>

          <Card bg={bgColor} boxShadow="lg" rounded="lg">
            <CardBody>
              <form onSubmit={handleSubmit}>
                <Stack spacing={4}>
                  {error && (
                    <Alert status="error" borderRadius="md">
                      <AlertIcon />
                      {error}
                    </Alert>
                  )}

                  <FormControl id="email" isRequired>
                    <FormLabel>Email address</FormLabel>
                    <Input
                      type="email"
                      placeholder="your.email@example.com"
                      value={credentials.email}
                      onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                    />
                  </FormControl>

                  <FormControl id="password" isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      placeholder="********"
                      value={credentials.password}
                      onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Must be at least 8 characters long
                    </Text>
                  </FormControl>

                  <FormControl id="role">
                    <FormLabel>Account Type</FormLabel>
                    <Select
                      value={credentials.role}
                      onChange={(e) => setCredentials({...credentials, role: e.target.value})}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                    </Select>
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    fontSize="md"
                    isLoading={loading}
                    loadingText="Registering..."
                    w="full"
                    mt={4}
                  >
                    Register
                  </Button>
                </Stack>
              </form>
            </CardBody>
          </Card>

          <Box textAlign="center">
            <Text color={useColorModeValue('gray.600', 'gray.400')}>
              Already have an account?{' '}
              <Link
                color="blue.500"
                href="/login"
                _hover={{ textDecoration: 'underline' }}
              >
                Sign in here
              </Link>
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}