export async function clientRegister(credentials) {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      throw new Error(text || 'Invalid server response');
    }

    const data = await response.json();

    if (!response.ok) {
      // Handle specific status codes
      const errorMap = {
        409: 'This email is already registered',
        400: 'Invalid registration data',
        500: 'Server error - please try later'
      };
      
      throw new Error(
        errorMap[response.status] || 
        data.error || 
        'Registration failed'
      );
    }

    return data;
    
  } catch (error) {
    console.error('Registration error:', error);
    throw new Error(error.message); // Propagate meaningful error
  }
}