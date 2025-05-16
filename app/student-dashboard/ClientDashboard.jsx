'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClientDashboard from './ClientDashboard';
import { Box, Spinner, Text, Center, Button, Alert, AlertIcon } from '@chakra-ui/react';
import { checkSession } from '@/lib/client-auth';

export default function StudentDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function verifyAccess() {
      try {
        console.log('StudentDashboard - Verifying access');
        const session = await checkSession();
        
        console.log('StudentDashboard - Session check result:', session);
        
        if (!session || !session.user) {
          console.log('StudentDashboard - No valid session found');
          setError('No valid session found. Please log in again.');
          setLoading(false);
          return;
        }
        
        setSessionData(session);
        
        const role = session.user.role?.toLowerCase();
        console.log('StudentDashboard - User role:', role);
        
        if (role !== 'student') {
          console.log('StudentDashboard - User is not a student:', role);
          setError('You do not have permission to access the student dashboard.');
          setLoading(false);
          return;
        }
        
        setLoading(false);
      } catch (err) {
        console.error('StudentDashboard - Error verifying access:', err);
        setError(err.message || 'Authentication failed');
        setLoading(false);
      }
    }
    
    verifyAccess();
  }, [router]);

  const handleReturnToLogin = () => {
    router.push('/login');
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Box textAlign="center">
          <Spinner size="xl" color="blue.500" mb={4} />
          <Text>Loading...</Text>
        </Box>
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="100vh">
        <Box textAlign="center" maxW="md" p={6} borderWidth={1} borderRadius="lg" boxShadow="lg">
          <Alert status="error" mb={4}>
            <AlertIcon />
            {error}
          </Alert>
          <Text mb={4}>Session data: {JSON.stringify(sessionData)}</Text>
          <Button colorScheme="blue" onClick={handleReturnToLogin}>
            Return to Login
          </Button>
        </Box>
      </Center>
    );
  }

  return <ClientDashboard />;
}