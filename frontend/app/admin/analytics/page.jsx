'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { adminAPI } from '@/lib/api'
import { TrendingUp, Users, Calendar, DollarSign, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminAnalytics() {
  const { user, isAuthenticated, loading } = useAuth()
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState('7d')

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === 'admin') {
      fetchAnalyticsData()
    }
  }, [loading, isAuthenticated, user, selectedPeriod])

  const fetchAnalyticsData = async () => {
    try {
      setLoadingAnalytics(true)
      setError(null)
      
      const [bookingTrends, userTrends] = await Promise.all([
        adminAPI.getBookingTrends(selectedPeriod),
        adminAPI.getUserRegistrationTrends(selectedPeriod)
      ])
      
      setAnalyticsData({ bookingTrends, userTrends })
    } catch (err) {
      console.error('Error fetching analytics data:', err)
      setError(err.message)
      toast.error('Failed to load analytics data')
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0)
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0)
  }

  const getPeriodLabel = (period) => {
    switch (period) {
      case '7d': return 'Last 7 Days'
      case '30d': return 'Last 30 Days'
      case '90d': return 'Last 90 Days'
      default: return 'Last 7 Days'
    }
  }

  // Redirect if not admin
  if (!loading && (!isAuthenticated || user?.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Analytics & Insights
              </h1>
              <p className="text-gray-600">
                View platform trends and performance metrics
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
              
              <button
                onClick={fetchAnalyticsData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loadingAnalytics ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics data...</p>
          </div>
        ) : analyticsData ? (
          <>
            {/* Period Overview */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {getPeriodLabel(selectedPeriod)}
              </h2>
            </div>

            {/* Booking Trends */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Booking Activity Trends
                </h3>
              </div>
              <div className="p-6">
                {analyticsData.bookingTrends?.bookingTrends?.length > 0 ? (
                  <div className="space-y-4">
                    {analyticsData.bookingTrends.bookingTrends.map((trend, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-500 mr-3" />
                          <span className="font-medium text-gray-900">{trend._id}</span>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <p className="text-sm text-gray-500">Bookings</p>
                            <p className="text-lg font-semibold text-blue-600">{formatNumber(trend.count)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500">Revenue</p>
                            <p className="text-lg font-semibold text-green-600">{formatCurrency(trend.totalAmount)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No booking data available for this period</p>
                  </div>
                )}
              </div>
            </div>

            {/* User Registration Trends */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-600" />
                  User Registration Trends
                </h3>
              </div>
              <div className="p-6">
                {analyticsData.userTrends?.registrationTrends?.length > 0 ? (
                  <div className="space-y-4">
                    {analyticsData.userTrends.registrationTrends.map((trend, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-500 mr-3" />
                          <span className="font-medium text-gray-900">{trend._id}</span>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <p className="text-sm text-gray-500">Total</p>
                            <p className="text-lg font-semibold text-blue-600">{formatNumber(trend.count)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500">Users</p>
                            <p className="text-lg font-semibold text-green-600">{formatNumber(trend.users)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500">Facility Owners</p>
                            <p className="text-lg font-semibold text-purple-600">{formatNumber(trend.facilityOwners)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No registration data available for this period</p>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(analyticsData.bookingTrends?.bookingTrends?.reduce((sum, trend) => sum + trend.count, 0) || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(analyticsData.bookingTrends?.bookingTrends?.reduce((sum, trend) => sum + trend.totalAmount, 0) || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">New Users</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(analyticsData.userTrends?.registrationTrends?.reduce((sum, trend) => sum + trend.count, 0) || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No analytics data available</p>
          </div>
        )}
      </div>
    </div>
  )
}
