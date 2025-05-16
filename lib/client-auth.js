export async function clientLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  }
export async function clientRegister(credentials) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
  
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error(text || 'Invalid server response');
      }
  
      const data = await response.json();
  
      if (!response.ok) {
        const errorMap = {
          409: 'This email is already registered',
          400: 'Invalid registration data',
          500: 'Server error - please try later'
        };
        throw new Error(errorMap[response.status] || data.error || 'Registration failed');
      }
  
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.message);
    }
  }
  
  export async function clientLogin(credentials) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
  
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }