'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { adminAPI } from '@/lib/api'
import { 
  Building2, 
  MapPin, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle,
  Eye,
  Search,
  Filter,
  Calendar,
  Trophy
} from 'lucide-react'
import toast from 'react-hot-toast'


export default function AdminFacilities() {
  const { user, isAuthenticated, loading } = useAuth()
  const [facilities, setFacilities] = useState([])
  const [loadingFacilities, setLoadingFacilities] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFacility, setSelectedFacility] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [approvalData, setApprovalData] = useState({
    status: 'approved',
    adminNotes: ''
  })

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === 'admin') {
      fetchFacilities()
    }
  }, [loading, isAuthenticated, user, currentPage, searchTerm])

  const fetchFacilities = async () => {
    try {
      setLoadingFacilities(true)
      setError(null)
      
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined
      }

      // Clean up params
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === '') {
          delete params[key]
        }
      })

      const response = await adminAPI.getPendingFacilities(params)
      setFacilities(response.facilities || [])
      setTotalPages(Math.ceil((response.total || 0) / 10))
    } catch (err) {
      console.error('Error fetching facilities:', err)
      setError(err.message)
      toast.error('Failed to load facilities')
    } finally {
      setLoadingFacilities(false)
    }
  }

  const handleApproval = async () => {
    try {
      if (!selectedFacility) return

      await adminAPI.approveFacility(
        selectedFacility._id,
        approvalData.status,
        approvalData.adminNotes
      )

      toast.success(`Facility ${approvalData.status} successfully`)
      setShowModal(false)
      setSelectedFacility(null)
      setApprovalData({ status: 'approved', adminNotes: '' })
      
      // Refresh the list
      fetchFacilities()
    } catch (err) {
      console.error('Error updating facility status:', err)
      toast.error('Failed to update facility status')
    }
  }

  const openApprovalModal = (facility) => {
    setSelectedFacility(facility)
    setApprovalData({ status: 'approved', adminNotes: '' })
    setShowModal(true)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Approved</span>
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Rejected</span>
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>
    }
  }

  // Redirect if not admin
  if (!loading && (!isAuthenticated || user?.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
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
                Facility Approval Management
              </h1>
              <p className="text-gray-600">
                Review and approve pending facility registrations
              </p>
            </div>
            <a
              href="/admin"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search facilities by name or city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={fetchFacilities}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Facilities List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Pending Facilities ({facilities.length})
            </h3>
          </div>
          
          {loadingFacilities ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading facilities...</p>
            </div>
          ) : facilities.length === 0 ? (
            <div className="p-6 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No pending facilities found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {facilities.map((facility) => (
                <div key={facility._id} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-blue-600" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-lg font-medium text-gray-900 truncate">
                              {facility.name}
                            </h4>
                            {getStatusBadge(facility.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="space-y-1">
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2" />
                                <span>
                                  {facility.address?.street}, {facility.address?.city}, {facility.address?.state}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                <span>
                                  Owner: {facility.owner?.firstName} {facility.owner?.lastName}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>Submitted: {formatDate(facility.createdAt)}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center">
                                <Trophy className="h-4 w-4 mr-2" />
                                <span>
                                  Sports: {facility.sports?.map(s => s.sport?.name).join(', ') || 'None'}
                                </span>
                              </div>
                              {facility.description && (
                                <p className="text-gray-600 line-clamp-2">
                                  {facility.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => openApprovalModal(facility)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Review & Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center">
            <nav className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showModal && selectedFacility && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Review Facility: {selectedFacility.name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approval Decision
                  </label>
                  <select
                    value={approvalData.status}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="approved">Approve</option>
                    <option value="rejected">Reject</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={approvalData.adminNotes}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, adminNotes: e.target.value }))}
                    rows={3}
                    placeholder="Add any notes about your decision..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproval}
                  className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                    approvalData.status === 'approved'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {approvalData.status === 'approved' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
