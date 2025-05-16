// app/page.jsx
import { getSession } from '@/lib/server-auth';
import Link from 'next/link';

export default async function HomePage() {
  const session = await getSession();
  const user = session?.user;

  return (
    <main className="min-h-screen p-8">
      <nav className="flex justify-between items-center mb-12">
        <h1 className="text-2xl font-bold">My App</h1>
        <div className="flex gap-4">
          {user ? (
            <Link href="/logout" className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
              Logout
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Login
              </Link>
              <Link href="/register" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="max-w-2xl mx-auto text-center">
        {user ? (
          <div className="space-y-4">
            <h1 className="text-4xl font-bold mb-4">Welcome back, {user.email}</h1>
            <p className="text-lg text-gray-600">
              You're now signed in and can access all features!
            </p>
            <Link 
              href="/dashboard" 
              className="inline-block mt-6 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <h1 className="text-4xl font-bold mb-4">Welcome to My App</h1>
            <p className="text-lg text-gray-600">
              Please sign in or create an account to get started
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <Link 
                href="/login" 
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}