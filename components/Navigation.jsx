// components/Navigation.jsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  // Helper function to check active route
  const isActive = (path) => pathname === path;

  return (
    <nav className="flex gap-6 p-4 bg-gray-100">
      <Link 
        href="/" 
        className={`${isActive('/') ? 'text-blue-600 font-semibold' : 'text-gray-600'} hover:text-blue-700`}
      >
        Home
      </Link>
      
      <Link 
        href="/login" 
        className={`${isActive('/login') ? 'text-blue-600 font-semibold' : 'text-gray-600'} hover:text-blue-700`}
      >
        Login
      </Link>
      
      <Link 
        href="/register" 
        className={`${isActive('/register') ? 'text-blue-600 font-semibold' : 'text-gray-600'} hover:text-blue-700`}
      >
        Register
      </Link>
    </nav>
  );
}