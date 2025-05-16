import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Link,
  Stack,
  useToast,
} from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import { loginUser } from '@/lib/client-auth'

export default function LoginForm() {
  const toast = useToast()
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    try {
      await loginUser(data)
      window.location.href = '/dashboard'
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <Box maxW="md" mx="auto" mt={12} p={6} boxShadow="xl" borderRadius="lg">
      <Text fontSize="2xl" mb={6} fontWeight="bold" textAlign="center">
        Welcome Back
      </Text>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={4}>
          <FormControl isInvalid={errors.email}>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              {...register('email', { required: 'Email is required' })}
              focusBorderColor="brand.500"
            />
          </FormControl>

          <FormControl isInvalid={errors.password}>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              {...register('password', { required: 'Password is required' })}
              focusBorderColor="brand.500"
            />
          </FormControl>

          <Button
            type="submit"
            colorScheme="brand"
            size="lg"
            width="full"
            mt={4}
          >
            Sign In
          </Button>
        </Stack>
      </form>

      <Text mt={4} textAlign="center">
        Don't have an account?{' '}
        <Link href="/register" color="brand.500" fontWeight="semibold">
          Create one
        </Link>
      </Text>
    </Box>
  )
}