'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { adminAPI } from '@/lib/api'
import { 
  Users, 
  Building2, 
  Calendar, 
  Trophy, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  UserCheck,
  UserX,
  DollarSign
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  BookingTrendsChart,
  UserRegistrationChart,
  FacilityApprovalChart,
  SportsActivityChart,
  EarningsChart
} from '@/components/charts'



export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth()
  const [stats, setStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  
  // Chart data states
  const [bookingTrends, setBookingTrends] = useState(null)
  const [userRegistration, setUserRegistration] = useState(null)
  const [facilityApproval, setFacilityApproval] = useState(null)
  const [sportsActivity, setSportsActivity] = useState(null)
  const [earningsData, setEarningsData] = useState(null)
  const [loadingCharts, setLoadingCharts] = useState(true)

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === 'admin') {
      fetchDashboardData()
      fetchChartData()
    }
  }, [loading, isAuthenticated, user])

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === 'admin') {
      fetchChartData()
    }
  }, [selectedPeriod])

  const fetchDashboardData = async () => {
    try {
      setLoadingStats(true)
      setError(null)
      
      const statsData = await adminAPI.getDashboardStats()
      setStats(statsData)
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err)
      setError(err.message)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchChartData = async () => {
    try {
      setLoadingCharts(true)
      
      const [bookingData, userData, approvalData, sportsData, earnings] = await Promise.all([
        adminAPI.getBookingTrends(selectedPeriod),
        adminAPI.getUserRegistrationTrends(selectedPeriod),
        adminAPI.getFacilityApprovalTrends(selectedPeriod),
        adminAPI.getSportsActivity(selectedPeriod),
        adminAPI.getEarningsSimulation(selectedPeriod)
      ])

      console.log('Raw API responses:', {
        bookingData,
        userData,
        approvalData,
        sportsData,
        earnings
      })

      // Map backend data to frontend chart expectations
      const mappedBookingData = {
        bookingTrends: bookingData.bookingTrends?.map(item => ({
          _id: item._id,
          bookingCount: item.count, // Map count to bookingCount
          revenue: item.totalAmount // Map totalAmount to revenue
        })) || []
      }
      
      const mappedUserData = {
        userRegistration: userData.registrationTrends?.map(item => ({
          _id: item._id,
          totalUsers: item.count, // Map count to totalUsers
          regularUsers: item.users, // Map users to regularUsers
          facilityOwners: item.facilityOwners // This one matches
        })) || []
      }
      
      const mappedApprovalData = {
        facilityApproval: approvalData.approvalTrends?.map(item => ({
          _id: item._id,
          approved: item.approved, // This one matches
          rejected: item.rejected, // This one matches
          pending: item.pending // This one matches
        })) || []
      }
      
      const mappedSportsData = {
        sportsActivity: sportsData.sportsActivity?.map(item => ({
          sport: item.name, // Map name to sport
          facilityCount: item.facilityCount, // This one matches
          bookingCount: item.bookingCount // This one matches
        })) || []
      }
      
      const mappedEarningsData = {
        earningsData: earnings.earningsData || []
      }

      console.log('Mapped chart data:', {
        mappedBookingData,
        mappedUserData,
        mappedApprovalData,
        mappedSportsData,
        mappedEarningsData
      })

      setBookingTrends(mappedBookingData)
      setUserRegistration(mappedUserData)
      setFacilityApproval(mappedApprovalData)
      setSportsActivity(mappedSportsData)
      setEarningsData(mappedEarningsData)
    } catch (err) {
      console.error('Error fetching chart data:', err)
      toast.error('Failed to load chart data')
    } finally {
      setLoadingCharts(false)
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

  // Redirect if not admin
  if (!loading && (!isAuthenticated || user?.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    )
  }

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {user?.firstName}! Here's an overview of your platform.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
              <button
                onClick={() => {
                  fetchDashboardData()
                  fetchChartData()
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {stats && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(stats.overview.totalUsers)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Facility Owners</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(stats.overview.totalFacilityOwners)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(stats.overview.totalBookings)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(stats.financials.totalEarnings)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Trophy className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Sports</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(stats.overview.totalSports)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(stats.overview.pendingFacilities)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-pink-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(stats.recentActivity.recentBookings + stats.recentActivity.recentUsers)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Sports */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Top Sports by Facility Count</h3>
              </div>
              <div className="p-6">
                {stats.topSports && stats.topSports.length > 0 ? (
                  <div className="space-y-4">
                    {stats.topSports.map((sport, index) => (
                      <div key={sport._id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-lg font-semibold text-gray-400 w-8">
                            #{index + 1}
                          </span>
                          <span className="text-gray-900 font-medium">{sport.name}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">
                            {sport.facilityCount} facilities
                          </span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ 
                                width: `${(sport.facilityCount / Math.max(...stats.topSports.map(s => s.facilityCount))) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No sports data available</p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <a
                    href="/admin/facilities"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <Building2 className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Manage Facilities</span>
                  </a>

                  <a
                    href="/admin/users"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                  >
                    <Users className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Manage Users</span>
                  </a>

                  <a
                    href="/admin/reports"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
                  >
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                    <span className="text-sm font-medium text-gray-900">View Reports</span>
                  </a>

                  <a
                    href="/admin/analytics"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    <TrendingUp className="h-5 w-5 text-purple-600 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Analytics</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
              
              {loadingCharts ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {/* First Row - 2 Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <BookingTrendsChart data={bookingTrends} period={selectedPeriod} />
                    <UserRegistrationChart data={userRegistration} period={selectedPeriod} />
                  </div>

                  {/* Second Row - 2 Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <FacilityApprovalChart data={facilityApproval} period={selectedPeriod} />
                    <SportsActivityChart data={sportsActivity} period={selectedPeriod} />
                  </div>

                  {/* Third Row - 1 Full Width Chart */}
                  <div className="w-full">
                    <EarningsChart data={earningsData} period={selectedPeriod} />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
