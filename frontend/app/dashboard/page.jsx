'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, MapPin, Star, Filter, Search, Plus, User, CreditCard, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import { userAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'

export default function DashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('bookings')
  const [filterStatus, setFilterStatus] = useState('all')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        console.log('Fetching bookings with filter:', filterStatus)
        const params = {}
        if (filterStatus !== 'all') {
          params.status = filterStatus
        }
        const response = await userAPI.getBookings(params)
        console.log('Bookings API response:', response)
        setBookings(response.bookings || [])
      } catch (error) {
        console.error('Error fetching bookings:', error)
        console.error('Error details:', error.message)
        toast.error(`Failed to load bookings: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }
    
    // Only fetch bookings if user is authenticated
    if (isAuthenticated && !authLoading) {
      fetchBookings()
    }
  }, [filterStatus, isAuthenticated, authLoading])

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredBookings = bookings.filter(booking => {
    if (filterStatus === 'all') return true
    return booking.status === filterStatus
  })

  const upcomingBookings = bookings.filter(booking => 
    booking.status === 'confirmed' && new Date(booking.date) >= new Date()
  )

  const completedBookings = bookings.filter(booking => booking.status === 'completed')

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login redirect message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName || 'User'}!
          </h1>
          <p className="text-gray-600">Manage your bookings and track your sports activities</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Upcoming Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingBookings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedBookings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Favorite Sports</p>
                <p className="text-sm text-gray-900">{user?.preferences?.favoriteSports?.join(', ') || 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/facilities" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Plus className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Book New Court</h3>
                <p className="text-sm text-gray-600">Find and book available courts</p>
              </div>
            </Link>
            
            <Link href="/profile" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Settings className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Account Settings</h3>
                <p className="text-sm text-gray-600">Update your profile and preferences</p>
              </div>
            </Link>
            
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Search className="h-6 w-6 text-purple-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Find Partners</h3>
                <p className="text-sm text-gray-600">Connect with other players</p>
              </div>
            </button>
          </div>
        </div>

        {/* Bookings Section */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">My Bookings</h2>
              <div className="flex items-center space-x-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No bookings found</h3>
                <p className="mt-2 text-gray-600">
                  {filterStatus === 'all' 
                    ? "You haven't made any bookings yet."
                    : `No ${filterStatus} bookings found.`
                  }
                </p>
                <Link
                  href="/facilities"
                  className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Book Your First Court
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <div key={booking._id || booking.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                          <span className="text-2xl text-white">{booking.sport?.icon || '🏀'}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{booking.facility?.name || 'Unknown Facility'}</h3>
                          <div className="flex items-center text-gray-600 mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="text-sm">
                              {booking.facility?.address?.city || 'Unknown'}, {booking.facility?.address?.state || 'Unknown'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>{new Date(booking.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{booking.startTime} - {booking.endTime}</span>
                            </div>
                            <span>•</span>
                            <span>{booking.sport?.name || 'Unknown Sport'} - {booking.court?.name || 'Unknown Court'}</span>
                          </div>
                          {booking.players && booking.players.length > 0 && (
                            <div className="mt-2">
                              <span className="text-sm text-gray-600">Players: </span>
                              <span className="text-sm text-gray-900">
                                {booking.players.filter(p => p?.name).map(player => player.name).join(', ') || 'No players listed'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Unknown'}
                        </span>
                        <p className="mt-2 text-lg font-semibold text-gray-900">₹{booking.totalAmount || 0}</p>
                        <p className="text-xs text-gray-600">Payment: {booking.paymentStatus || 'Unknown'}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center space-x-3">
                      <Link
                        href={`/bookings/${booking._id || booking.id}`}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        View Details
                      </Link>
                      {booking.status === 'confirmed' && new Date(booking.date) > new Date() && (
                        <>
                          <span className="text-gray-300">|</span>
                          <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                            Cancel Booking
                          </button>
                        </>
                      )}
                      {booking.status === 'completed' && (
                        <>
                          <span className="text-gray-300">|</span>
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            Rate Facility
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}