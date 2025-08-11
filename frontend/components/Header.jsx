'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { User, LogOut, Settings } from 'lucide-react'

export default function Header() {
  const { user, isAuthenticated, logout, loading } = useAuth()

  const handleLogout = () => {
    logout()
    // Redirect to home page after logout
    window.location.href = '/'
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-green-600">QuickCourt</h1>
          </Link>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="/facilities" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
              Facilities
            </Link>
            <Link href="/sports" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
              Sports
            </Link>
            {!loading && isAuthenticated && (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/profile" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
                  Profile
                </Link>
              </>
            )}
          </nav>
          
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 w-20 bg-gray-300 rounded"></div>
              </div>
            ) : isAuthenticated ? (
              <div className="flex flex-row items-center space-x-3">
                <Link
                  href="/facilities"
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Book Court
                </Link>

                <div className="flex flex-row items-center space-x-2 text-gray-700">
                  <Link href="/profile" className="flex flex-row items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {user?.firstName || user?.email || 'User'}
                  </span>
                  </Link>
                  
                </div>
                <div className="flex items-center space-x-2">
                  
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
