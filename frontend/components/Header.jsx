'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  return (
    <header className="bg-white shadow-sm border-b relative animate-lift">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-green-600 animate-scale"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo with hover effect */}
          <Link href="/" className="flex items-center animate-scale">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              QUICKCOURT
            </h1>
          </Link>

          {/* Desktop Center - Book Button with green animation */}
          <div className="hidden md:flex justify-center flex-1">
            <Link
              href="/facilities"
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-full text-sm font-medium hover:from-green-700 hover:to-green-800 flex items-center animate-button shadow-lg"
            >
              📅 Book
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/dashboard" 
                  className="text-gray-700 hover:text-green-600 text-sm font-medium transition-colors cursor-pointer animate-scale"
                >
                  Hi, {user?.firstName || 'User'}
                </Link>
                <button onClick={handleLogout} className="text-gray-600 hover:text-red-600 text-sm animate-scale">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 pulse-animation">👤</span>
                <Link href="/auth/login" className="text-gray-700 hover:text-green-600 text-sm font-medium animate-lift px-3 py-1 rounded">
                  Login
                </Link>
                <span className="text-gray-400">/</span>
                <Link href="/auth/register" className="text-gray-700 hover:text-green-600 text-sm font-medium animate-lift px-3 py-1 rounded">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden">
            {isAuthenticated ? (
              <Link 
                href="/dashboard" 
                className="text-sm text-gray-600 hover:text-green-600 transition-colors animate-scale"
              >
                Hi, {user?.firstName || 'User'}
              </Link>
            ) : (
              <Link href="/auth/login" className="text-green-600 text-sm font-medium animate-scale">
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Animated Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-t border-gray-200 shadow-xl z-50 animate-lift">
            <div className="px-4 py-6 space-y-4">
              <Link href="/facilities" className="block px-4 py-4 text-center bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full font-medium animate-button shadow-lg">
                📅 Book Now
              </Link>
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="block px-3 py-3 text-gray-700 hover:text-green-600 rounded-lg hover:bg-gray-50 animate-lift">
                    Dashboard
                  </Link>
                  <Link href="/profile" className="block px-3 py-3 text-gray-700 hover:text-green-600 rounded-lg hover:bg-gray-50 animate-lift">
                    Profile
                  </Link>
                  <button onClick={handleLogout} className="block w-full text-left px-3 py-3 text-gray-700 hover:text-red-600 rounded-lg hover:bg-red-50 animate-lift">
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/auth/register" className="block px-3 py-3 text-gray-700 hover:text-green-600 rounded-lg hover:bg-gray-50 animate-lift">
                  Sign Up
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
