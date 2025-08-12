'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { adminAPI } from '@/lib/api'
import { 
  Users, 
  User, 
  UserCheck, 
  UserX, 
  Search, 
  Filter,
  Calendar,
  Mail,
  Phone,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  MoreHorizontal
} from 'lucide-react'
import toast from 'react-hot-toast'


export default function AdminUsers() {
  const { user: currentUser, isAuthenticated, loading } = useAuth()
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusData, setStatusData] = useState({
    isActive: true,
    adminNotes: ''
  })

  useEffect(() => {
    if (!loading && isAuthenticated && currentUser?.role === 'admin') {
      fetchUsers()
    }
  }, [loading, isAuthenticated, currentUser, currentPage, searchTerm, roleFilter, statusFilter])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      setError(null)
      
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined
      }

      // Clean up params
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === '') {
          delete params[key]
        }
      })

      const response = await adminAPI.getUsers(params)
      setUsers(response.users || [])
      setTotalPages(Math.ceil((response.total || 0) / 10))
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err.message)
      toast.error('Failed to load users')
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleStatusUpdate = async () => {
    try {
      if (!selectedUser) return

      await adminAPI.updateUserStatus(
        selectedUser._id,
        statusData.isActive,
        statusData.adminNotes
      )

      toast.success(`User ${statusData.isActive ? 'activated' : 'deactivated'} successfully`)
      setShowStatusModal(false)
      setSelectedUser(null)
      setStatusData({ isActive: true, adminNotes: '' })
      
      // Refresh the list
      fetchUsers()
    } catch (err) {
      console.error('Error updating user status:', err)
      toast.error('Failed to update user status')
    }
  }

  const openStatusModal = (user) => {
    setSelectedUser(user)
    setStatusData({ 
      isActive: user.isActive, 
      adminNotes: user.adminNotes || '' 
    })
    setShowStatusModal(true)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Admin</span>
      case 'facility_owner':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Facility Owner</span>
      case 'user':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">User</span>
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{role}</span>
    }
  }

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center gap-1">
        <UserCheck className="h-3 w-3" />
        Active
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center gap-1">
        <UserX className="h-3 w-3" />
        Banned
      </span>
    )
  }

  // Redirect if not admin
  if (!loading && (!isAuthenticated || currentUser?.role !== 'admin')) {
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
                User Management
              </h1>
              <p className="text-gray-600">
                Manage user accounts, roles, and status
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Roles</option>
                  <option value="user">Users</option>
                  <option value="facility_owner">Facility Owners</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
              
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Banned</option>
                </select>
              </div>
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

        {/* Users List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Users ({users.length})
            </h3>
          </div>
          
          {loadingUsers ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <div key={user._id} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="h-8 w-8 text-gray-600" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-lg font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </h4>
                            {getRoleBadge(user.role)}
                            {getStatusBadge(user.isActive)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="space-y-1">
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-2" />
                                <span>{user.email}</span>
                              </div>
                              {user.phoneNumber && (
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 mr-2" />
                                  <span>{user.phoneNumber}</span>
                                </div>
                              )}
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>Joined: {formatDate(user.createdAt)}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              {user.adminNotes && (
                                <div className="text-sm text-gray-500">
                                  <strong>Admin Notes:</strong> {user.adminNotes}
                                </div>
                              )}
                              {user.statusUpdatedAt && (
                                <div className="text-xs text-gray-400">
                                  Status updated: {formatDate(user.statusUpdatedAt)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col sm:flex-row gap-2">
                      {/* Prevent admin from modifying their own account */}
                      {user._id !== currentUser?._id ? (
                        <button
                          onClick={() => openStatusModal(user)}
                          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                            user.isActive
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {user.isActive ? (
                            <>
                              <Ban className="h-4 w-4" />
                              Ban User
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Activate User
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="px-4 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg">
                          Current User
                        </span>
                      )}
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

      {/* Status Update Modal */}
      {showStatusModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Update User Status: {selectedUser.firstName} {selectedUser.lastName}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Status
                  </label>
                  <select
                    value={statusData.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setStatusData(prev => ({ 
                      ...prev, 
                      isActive: e.target.value === 'active' 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Banned</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={statusData.adminNotes}
                    onChange={(e) => setStatusData(prev => ({ ...prev, adminNotes: e.target.value }))}
                    rows={3}
                    placeholder="Add any notes about this action..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                    statusData.isActive
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {statusData.isActive ? 'Activate User' : 'Ban User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}