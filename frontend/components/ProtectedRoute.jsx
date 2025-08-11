'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedRoute({ 
  children, 
  requiredRole = null, 
  redirectTo = '/auth/login',
  showLoading = true 
}) {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push(redirectTo)
        return
      }

      // If role is required and user doesn't have it, redirect
      if (requiredRole && user?.role !== requiredRole) {
        // Redirect based on user's actual role
        if (user?.role === 'facility_owner') {
          router.push('/facilityowner')
        } else if (user?.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
        return
      }
    }
  }, [isAuthenticated, user, loading, requiredRole, router, redirectTo])

  // Show loading spinner while checking authentication
  if (loading && showLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Don't render if role requirement is not met
  if (requiredRole && user?.role !== requiredRole) {
    return null
  }

  // Render children if all conditions are met
  return <>{children}</>
}
