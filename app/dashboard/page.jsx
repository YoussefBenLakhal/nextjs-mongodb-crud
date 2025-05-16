'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Spinner, Center, Text } from '@chakra-ui/react';
import { checkSession } from '@/lib/client-auth';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkUserSession() {
      try {
        const sessionData = await checkSession();
        
        if (!sessionData || !sessionData.user) {
          console.log('No valid session found');
          router.push('/login');
          return;
        }

        // Redirect based on user role
        const role = sessionData.user.role?.toLowerCase();
        console.log('User role:', role);
        
        if (role === 'teacher') {
          router.push('/teacher-dashboard');
        } else if (role === 'student') {
          router.push('/student-dashboard');
        } else {
          // Unknown role, redirect to login
          console.error('Unknown user role:', role);
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    checkUserSession();
  }, [router]);

  if (loading) {
    return (
      <Center h="100vh">
        <Box textAlign="center">
          <Spinner size="xl" color="blue.500" mb={4} />
          <Text>Loading your dashboard...</Text>
        </Box>
      </Center>
    );
  }

  // This should not be visible as we redirect in useEffect
  return null;
}