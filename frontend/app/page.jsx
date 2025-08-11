'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Calendar, 
  MapPin, 
  Star, 
  Users, 
  Building2, 
  ArrowRight,
  Play
} from 'lucide-react'

export default function HomePage() {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()

  // Redirect authenticated users to their appropriate dashboard
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === 'facility_owner') {
        router.push('/facilityowner')
      } else if (user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    }
  }, [isAuthenticated, user, loading, router])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is authenticated, show loading while redirecting
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image src="/logo.jpeg" alt="QuickCourt" width={40} height={40} className="rounded-lg" />
              <span className="ml-3 text-xl font-bold text-green-600">QuickCourt</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-50 to-blue-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Book Your Court
              <span className="text-green-600"> Instantly</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Find and book sports courts near you. Tennis, Badminton, Squash, and more. 
              No more phone calls or waiting in line.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 flex items-center justify-center"
              >
                <Play className="mr-2 h-5 w-5" />
                Start Booking Now
              </Link>
              <Link
                href="/facilities"
                className="border-2 border-green-600 text-green-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-50 flex items-center justify-center"
              >
                <MapPin className="mr-2 h-5 w-5" />
                Browse Facilities
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose QuickCourt?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We make booking sports courts simple, fast, and convenient for everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Instant Booking</h3>
              <p className="text-gray-600">
                Book courts in seconds with our streamlined booking process. 
                No more phone calls or waiting in line.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Find Courts Near You</h3>
              <p className="text-gray-600">
                Discover sports facilities in your area with detailed information 
                about courts, amenities, and pricing.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect with Players</h3>
              <p className="text-gray-600">
                Find playing partners, join tournaments, and be part of a 
                vibrant sports community.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-green-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Playing?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of players who are already using QuickCourt
          </p>
          <Link
            href="/auth/register"
            className="bg-white text-green-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 inline-flex items-center"
          >
            Get Started Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Image src="/logo.jpeg" alt="QuickCourt" width={32} height={32} className="rounded-lg" />
                <span className="ml-2 text-xl font-bold">QuickCourt</span>
              </div>
              <p className="text-gray-400">
                Making sports accessible to everyone through easy court booking.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/facilities" className="hover:text-white">Find Facilities</Link></li>
                <li><Link href="/sports" className="hover:text-white">Sports</Link></li>
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 QuickCourt. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}