"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkSession } from '@/lib/client-auth';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUserSession() {
      try {
        const session = await checkSession();
        console.log("HomePage - Session check result:", session);
        
        if (session) {
          // User is logged in, redirect to dashboard
          console.log("HomePage - User is logged in, redirecting to dashboard");
          router.push('/dashboard');
        } else {
          // User is not logged in, they can stay on the home page
          console.log("HomePage - User is not logged in");
          setLoading(false);
        }
      } catch (err) {
        console.error("HomePage - Session verification error:", err);
        setLoading(false);
      }
    }
    
    checkUserSession();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-500">Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Welcome to Student Management System</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Student Portal</h2>
          <p className="mb-4">Access your grades, courses, and more.</p>
          <button 
            onClick={() => router.push('/login')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Login
          </button>
        </div>
        
        <div className="bg-white shadow-md rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Teacher Portal</h2>
          <p className="mb-4">Manage students, submit grades, and more.</p>
          <button 
            onClick={() => router.push('/login')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}