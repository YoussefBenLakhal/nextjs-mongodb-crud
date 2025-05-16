// Path: C:\Users\Administrator\Desktop\BDD\nextjs-mongodb-crud\app\teacher-dashboard\ClientDashboard.jsx

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clientLogout } from '@/lib/client-auth';
import { 
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Button,
  useToast,
  Spinner,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from '@chakra-ui/react';

export default function TeacherDashboard({ initialSession }) {
  const router = useRouter();
  const toast = useToast();
  const [session, setSession] = useState(initialSession || null);
  const [loading, setLoading] = useState(!initialSession);
  const [loadingAction, setLoadingAction] = useState(false);
  const [formData, setFormData] = useState({
    studentEmail: '',
    course: 'Math',
    grade: '',
    absences: 0
  });

  // Session verification
  useEffect(() => {
    if (initialSession) return;

    const verifySession = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(response.status === 401 ? 'Session expired' : 'Session verification failed');
        }

        const data = await response.json();
        console.log('Session verification response:', data);
        
        if (!data?.user || data.user.role !== 'teacher') {
          throw new Error('Teacher privileges required');
        }

        setSession(data.user);
      } catch (error) {
        console.error('Session verification error:', error);
        toast({
          title: 'Access Denied',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        router.push('/unauthorized');
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [router, toast, initialSession]);

  const handleLogout = async () => {
    try {
      await clientLogout();
    } catch (error) {
      toast({
        title: 'Logout Failed',
        description: error.message || 'Please try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    
    try {
      const endpoint = formData.grade ? '/api/grades' : '/api/absences';
      console.log('Submitting to endpoint:', endpoint);
      console.log('Form data:', formData);
      
      // Check if we have a session before submitting
      const sessionCheckResponse = await fetch('/api/auth/session', {
        credentials: 'include'
      });
      
      const sessionData = await sessionCheckResponse.json();
      console.log('Current session before submission:', sessionData);
      
      if (!sessionCheckResponse.ok) {
        throw new Error('Session validation failed. Please log in again.');
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentEmail: formData.studentEmail,
          course: formData.course,
          ...(formData.grade && { grade: parseFloat(formData.grade) }),
          ...(formData.absences > 0 && { count: formData.absences })
        }),
        credentials: 'include' // This is crucial - ensures cookies are sent
      });

      console.log('Response status:', response.status);
      
      const responseData = await response.json();
      console.log('Response data:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to submit record');
      }
      
      toast({
        title: 'Success',
        description: 'Record submitted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setFormData({ 
        studentEmail: '',
        course: 'Math',
        grade: '',
        absences: 0
      });

    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingAction(false);
    }
  };

  if (loading || !session) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner size="xl" thickness="4px" />
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Navigation Header */}
      <Box bg="white" boxShadow="sm" py={4}>
        <Flex maxW="7xl" mx="auto" px={6} justify="space-between" align="center">
          <Heading size="lg" color="blue.600">Teacher Portal</Heading>
          <Flex align="center" gap={4}>
            <Text fontWeight="medium">{session.email}</Text>
            <Button 
              onClick={handleLogout} 
              colorScheme="red" 
              variant="outline"
              size="sm"
            >
              Logout
            </Button>
          </Flex>
        </Flex>
      </Box>

      {/* Main Content */}
      <Box py={10} px={6} maxW="7xl" mx="auto">
        <Box bg="white" p={8} borderRadius="lg" boxShadow="md">
          <Heading size="xl" mb={8} color="blue.700">Grade & Attendance</Heading>
          
          <form onSubmit={handleSubmit}>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6} mb={8}>
              <FormControl>
                <FormLabel>Student Email</FormLabel>
                <Input
                  type="email"
                  value={formData.studentEmail}
                  onChange={(e) => setFormData({...formData, studentEmail: e.target.value})}
                  required
                />
              </FormControl>

              <FormControl>
                <FormLabel>Course</FormLabel>
                <Select
                  value={formData.course}
                  onChange={(e) => setFormData({...formData, course: e.target.value})}
                >
                  <option value="Math">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="History">History</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Grade (0-100)</FormLabel>
                <NumberInput 
                  min={0} 
                  max={100}
                  value={formData.grade}
                  onChange={(value) => setFormData({...formData, grade: value})}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Absences</FormLabel>
                <NumberInput
                  min={0}
                  value={formData.absences}
                  onChange={(value) => setFormData({...formData, absences: value})}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </Grid>

            <Flex justify="flex-end" gap={4}>
              <Button 
                type="reset" 
                variant="outline"
                onClick={() => setFormData({
                  studentEmail: '',
                  course: 'Math',
                  grade: '',
                  absences: 0
                })}
              >
                Clear
              </Button>
              <Button 
                type="submit" 
                colorScheme="blue"
                isLoading={loadingAction}
                loadingText="Submitting..."
              >
                Submit Record
              </Button>
            </Flex>
          </form>
        </Box>
      </Box>
    </Box>
  );
}