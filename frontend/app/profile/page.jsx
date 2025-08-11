'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Mail, Phone, MapPin, Camera, Edit3, Save, X, Bell, Shield, CreditCard, Heart } from 'lucide-react'
import toast from 'react-hot-toast'
import { userAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'

export default function ProfilePage() {
  const router = useRouter()
  const { user: authUser, updateUser, isAuthenticated, loading: authLoading } = useAuth()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [formData, setFormData] = useState({})

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, authLoading, router])

  // Redirect facility owners to their appropriate page
  useEffect(() => {
    if (!authLoading && isAuthenticated && authUser && authUser.role === 'facility_owner') {
      router.push('/facilityowner/profile')
    }
  }, [isAuthenticated, authLoading, authUser, router])

  const sports = [
    { id: 'badminton', name: 'Badminton', icon: '🏸' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'basketball', name: 'Basketball', icon: '🏀' },
    { id: 'soccer', name: 'Soccer', icon: '⚽' },
    { id: 'tabletennis', name: 'Table Tennis', icon: '🏓' },
    { id: 'volleyball', name: 'Volleyball', icon: '🏐' }
  ]

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userAPI.getProfile()
        setUser(response)
        setFormData(response)
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    
    if (authUser) {
      fetchProfile()
    }
  }, [authUser])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNestedInputChange = (parentField, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [field]: value
      }
    }))
  }

  const handleSportToggle = (sportId) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        favoriteSports: prev.preferences.favoriteSports.includes(sportId)
          ? prev.preferences.favoriteSports.filter(id => id !== sportId)
          : [...prev.preferences.favoriteSports, sportId]
      }
    }))
  }

  const handleSave = async () => {
    try {
      await userAPI.updateProfile(formData)
      setUser(formData)
      updateUser(formData)
      setEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile. Please try again.')
    }
  }

  const handleCancel = () => {
    setFormData(user)
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-green-400 to-green-600"></div>
          <div className="px-6 pb-6">
            <div className="flex items-end -mt-16 mb-4">
              <div className="relative">
                <div className="w-32 h-32 bg-white rounded-full border-4 border-white flex items-center justify-center">
                  {user?.profilePicture ? (
                    <img src={user?.profilePicture} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <button className="absolute bottom-2 right-2 bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="ml-6 flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{user?.firstName || 'User'} {user?.lastName || ''}</h1>
                <p className="text-gray-600">{user?.email || 'No email'}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Member since {user?.dateJoined ? new Date(user.dateJoined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}
                </p>
              </div>
              <div>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{user?.stats?.totalBookings || 0}</p>
                <p className="text-sm text-gray-600">Total Bookings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{user?.stats?.totalHoursPlayed || 0}</p>
                <p className="text-sm text-gray-600">Hours Played</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-purple-600">{user?.stats?.mostPlayedSport || 'Not set'}</p>
                <p className="text-sm text-gray-600">Favorite Sport</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-orange-600">{user?.stats?.favoriteTime || 'Not set'}</p>
                <p className="text-sm text-gray-600">Preferred Time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'profile', label: 'Personal Info', icon: User },
                { id: 'preferences', label: 'Preferences', icon: Heart },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'security', label: 'Security', icon: Shield }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Personal Info Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                    ) : (
                      <p className="text-gray-900">{user?.firstName || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                    ) : (
                      <p className="text-gray-900">{user?.lastName || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-gray-400 mr-2" />
                      <p className="text-gray-900">{user?.email || 'Not set'}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    {editing ? (
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                    ) : (
                      <div className="flex items-center">
                        <Phone className="w-5 h-5 text-gray-400 mr-2" />
                        <p className="text-gray-900">{user?.phoneNumber || 'Not set'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Sport Preferences</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Favorite Sports
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {sports.map((sport) => (
                      <button
                        key={sport.id}
                        onClick={() => editing && handleSportToggle(sport.id)}
                        disabled={!editing}
                        className={`p-4 border-2 rounded-lg text-left transition-colors ${
                          formData.preferences?.favoriteSports?.includes(sport.id)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${!editing ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{sport.icon}</span>
                          <span className="font-medium text-gray-900">{sport.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Email Notifications</h4>
                      <p className="text-sm text-gray-600">Receive booking confirmations and updates via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.preferences?.notifications?.email}
                        onChange={(e) => handleNestedInputChange('preferences', 'notifications', {
                          ...formData.preferences.notifications,
                          email: e.target.checked
                        })}
                        disabled={!editing}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                      <p className="text-sm text-gray-600">Receive booking reminders via SMS</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.preferences?.notifications?.sms}
                        onChange={(e) => handleNestedInputChange('preferences', 'notifications', {
                          ...formData.preferences.notifications,
                          sms: e.target.checked
                        })}
                        disabled={!editing}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Push Notifications</h4>
                      <p className="text-sm text-gray-600">Receive push notifications on your device</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.preferences?.notifications?.push}
                        onChange={(e) => handleNestedInputChange('preferences', 'notifications', {
                          ...formData.preferences.notifications,
                          push: e.target.checked
                        })}
                        disabled={!editing}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
                
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Change Password</h4>
                        <p className="text-sm text-gray-600">Update your account password</p>
                      </div>
                      <button className="text-green-600 hover:text-green-700 font-medium">
                        Change
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                      </div>
                      <button className="text-green-600 hover:text-green-700 font-medium">
                        Enable
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Login Sessions</h4>
                        <p className="text-sm text-gray-600">Manage your active login sessions</p>
                      </div>
                      <button className="text-green-600 hover:text-green-700 font-medium">
                        Manage
                      </button>
                    </div>
                  </div>

                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-red-900">Delete Account</h4>
                        <p className="text-sm text-red-700">Permanently delete your account and all data</p>
                      </div>
                      <button className="text-red-600 hover:text-red-700 font-medium">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
