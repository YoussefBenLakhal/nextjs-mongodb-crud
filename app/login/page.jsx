'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  useToast,
} from '@chakra-ui/react';
import { clientLogin } from '@/lib/client-auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  // Check for error parameter in URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const redirectPath = searchParams.get('redirect');
    
    if (errorParam === 'session_expired') {
      setError('Your session has expired. Please log in again.');
      
      if (redirectPath) {
        console.log('Will redirect to', redirectPath, 'after login');
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate inputs
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    try {
      setLoading(true);
      console.log('Submitting login with:', { email, password: '***' });
      
      const userData = await clientLogin(email, password);
      
      console.log('Login successful:', userData);
      
      toast({
        title: 'Login successful',
        description: `Welcome back, ${userData.user?.name || email}!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Check if there's a redirect path in the URL
      const redirectPath = searchParams.get('redirect');
      if (redirectPath) {
        router.push(redirectPath);
        return;
      }

      // Otherwise, redirect based on role
      const role = userData.user?.role?.toLowerCase();
      if (role === 'teacher') {
        router.push('/teacher-dashboard');
      } else if (role === 'student') {
        router.push('/student-dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="lg" boxShadow="lg">
      <VStack spacing={6}>
        <Heading as="h1" size="xl">
          Login
        </Heading>
        
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <VStack spacing={4} align="flex-start" width="100%">
            <FormControl isRequired>
              <FormLabel htmlFor="email">Email</FormLabel>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel htmlFor="password">Password</FormLabel>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
            </FormControl>
            
            <Button
              type="submit"
              colorScheme="blue"
              width="100%"
              mt={4}
              isLoading={loading}
              loadingText="Logging in..."
            >
              Login
            </Button>
          </VStack>
        </form>
        
        <Text>
          Don't have an account?{' '}
          <Button
            variant="link"
            colorScheme="blue"
            onClick={() => router.push('/register')}
          >
            Register
          </Button>
        </Text>
      </VStack>
    </Box>
  );
}