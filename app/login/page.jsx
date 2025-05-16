'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientLogin } from '@/lib/client-auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faLock, 
  faExclamationTriangle 
} from '@fortawesome/free-solid-svg-icons';
import { 
  faGoogle, 
  faFacebook 
} from '@fortawesome/free-brands-svg-icons';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { role } = await clientLogin({ email, password });
      router.push(role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo Section */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-blue-600">
            <FontAwesomeIcon 
              icon={faEnvelope} 
              className="h-full w-full"
            />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please sign in to continue
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <FontAwesomeIcon 
                  icon={faEnvelope} 
                  className="absolute right-3 top-3.5 h-4 w-4 text-gray-400"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <FontAwesomeIcon 
                  icon={faLock} 
                  className="absolute right-3 top-3.5 h-4 w-4 text-gray-400"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center space-x-2">
                <FontAwesomeIcon 
                  icon={faExclamationTriangle} 
                  className="h-4 w-4"
                />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3.5 rounded-lg transition-all shadow-lg hover:shadow-blue-200"
            >
              Continue to Dashboard
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center space-x-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 py-2.5 rounded-lg transition-all"
              >
                <FontAwesomeIcon 
                  icon={faGoogle} 
                  className="h-5 w-5"
                />
                <span>Google</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center space-x-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 py-2.5 rounded-lg transition-all"
              >
                <FontAwesomeIcon 
                  icon={faFacebook} 
                  className="h-5 w-5 text-[#1877F2]"
                />
                <span>Facebook</span>
              </button>
            </div>
          </form>

          {/* Registration Link */}
          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/register" className="font-semibold text-blue-600 hover:text-blue-500">
              Get started
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600">
          © {new Date().getFullYear()} Your Company. All rights reserved.
        </div>
      </div>
    </div>
  );
}