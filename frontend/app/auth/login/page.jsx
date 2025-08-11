'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const { login, user, isAuthenticated, loading } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Handle redirect after successful login
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      // Redirect based on user role
      if (user.role === 'facility_owner') {
        router.push('/facilityowner')
      } else if (user.role === 'admin') {
        router.push('/admin') // You can add admin dashboard later
      } else {
        router.push('/dashboard')
      }
    }
  }, [isAuthenticated, user, router, loading])

  // If already authenticated, redirect immediately
  if (!loading && isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await login(formData)
      if (result.success) {
        // The redirect will be handled by the useEffect above
        // Show a brief loading message
        toast.success('Login successful! Redirecting...')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />
      <div className="bg-gray-50 flex pt-16">
        {/* Left Side - Image */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-green-700 relative overflow-hidden">
          <Image src="/logo.jpeg" alt="Login Background" fill  />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-600 mb-2">QuickCourt</h1>
            <h2 className="text-2xl font-bold text-gray-900">Sign in to your account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/register" className="font-medium text-green-600 hover:text-green-500">
                Sign up
              </Link>
            </p>
          </div>

          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter your password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/auth/forgot-password" className="font-medium text-green-600 hover:text-green-500">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
