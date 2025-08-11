'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, MapPin, Clock, Phone, Mail, Globe, Users, Wifi, Car, Coffee, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { facilitiesAPI } from '@/lib/api'

export default function FacilityDetailPage() {
  const params = useParams()
  const [facility, setFacility] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSport, setSelectedSport] = useState('')
  const [activeTab, setActiveTab] = useState('overview')



  useEffect(() => {
    const fetchFacility = async () => {
      try {
        const response = await facilitiesAPI.getById(params.id)
        console.log('Facility API response:', response)
        
        // The API returns the facility object directly
        console.log('Facility data:', response)
        
        if (response && response._id) {
          setFacility(response)
        } else {
          console.error('Invalid facility data:', response)
          toast.error('Invalid facility data received')
        }
      } catch (error) {
        console.error('Error fetching facility:', error)
        toast.error('Failed to load facility details')
      } finally {
        setLoading(false)
      }
    }
    
    if (params.id) {
      fetchFacility()
    }
  }, [params.id])

  const getAmenityIcon = (iconType) => {
    switch (iconType) {
      case 'wifi': return <Wifi className="h-5 w-5" />
      case 'parking': return <Car className="h-5 w-5" />
      case 'cafeteria': return <Coffee className="h-5 w-5" />
      default: return <Check className="h-5 w-5" />
    }
  }

  const getDayName = (key) => {
    const days = {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday'
    }
    return days[key] || key
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!facility) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Facility not found</h2>
          <p className="text-gray-600 mb-4">The facility you're looking for doesn't exist.</p>
          <Link href="/facilities" className="text-green-600 hover:text-green-500">
            Back to facilities
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-green-600">QuickCourt</h1>
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/facilities" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
                Facilities
              </Link>
              <Link href="/bookings" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
                My Bookings
              </Link>
              <Link href="/profile" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
                Profile
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href="/facilities" className="inline-flex items-center text-green-600 hover:text-green-700 mb-6">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to facilities
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Facility Header */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              <div className="h-64 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <span className="text-8xl text-white opacity-80">🏸</span>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{facility.name || 'Unnamed Facility'}</h1>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span>
                        {facility.address?.street || 'Address'}, {facility.address?.city || 'City'}, {facility.address?.state || 'State'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                      <span className="font-medium text-gray-900">{facility.rating?.average || 0}</span>
                      <span className="text-gray-600 ml-1">({facility.rating?.count || 0} reviews)</span>
                      {facility.isVerified && (
                        <span className="ml-3 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">{facility.description || 'No description available.'}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {['overview', 'courts', 'amenities', 'policies'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                        activeTab === tab
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Sports Available</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.isArray(facility.sports) && facility.sports.length > 0 ? (
                          facility.sports.map((sportData, index) => {
                            // Handle both populated and unpopulated sport data
                            let sportName = 'Unknown Sport'
                            let sportIcon = '🏀'
                            let courtCount = 0
                            let minRate = 0
                            
                            if (sportData.sport) {
                              if (typeof sportData.sport === 'string') {
                                sportName = sportData.sport
                              } else if (sportData.sport.name) {
                                sportName = sportData.sport.name
                                sportIcon = sportData.sport.icon || '🏀'
                              }
                            }
                            
                            if (Array.isArray(sportData.courts)) {
                              courtCount = sportData.courts.length
                              if (courtCount > 0) {
                                minRate = Math.min(...sportData.courts.map(c => c.hourlyRate || 0))
                              }
                            }
                            
                            return (
                              <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center mb-2">
                                  <span className="text-2xl mr-3">{sportIcon}</span>
                                  <h4 className="font-medium text-gray-900">{sportName}</h4>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{courtCount} courts available</p>
                                <p className="text-sm font-medium text-green-600">
                                  Starting from ₹{minRate}/hour
                                </p>
                              </div>
                            )
                          })
                        ) : (
                          <div className="col-span-2 text-center py-8 text-gray-500">
                            No sports information available
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Operating Hours</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {facility.operatingHours && typeof facility.operatingHours === 'object' ? (
                          Object.entries(facility.operatingHours).map(([day, hours]) => (
                            <div key={day} className="flex justify-between items-center py-2">
                              <span className="font-medium text-gray-900">{getDayName(day)}</span>
                              <span className="text-gray-600">
                                {hours && hours.isOpen ? `${hours.open || 'N/A'} - ${hours.close || 'N/A'}` : 'Closed'}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 text-center py-4 text-gray-500">
                            Operating hours not available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'courts' && (
                  <div className="space-y-6">
                    {Array.isArray(facility.sports) && facility.sports.length > 0 ? (
                      facility.sports.map((sportData, index) => {
                        // Handle both populated and unpopulated sport data
                        let sportName = 'Unknown Sport'
                        let sportIcon = '🏀'
                        
                        if (sportData.sport) {
                          if (typeof sportData.sport === 'string') {
                            sportName = sportData.sport
                          } else if (sportData.sport.name) {
                            sportName = sportData.sport.name
                            sportIcon = sportData.sport.icon || '🏀'
                          }
                        }
                        
                        return (
                          <div key={index}>
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                              <span className="text-2xl mr-3">{sportIcon}</span>
                              {sportName} Courts
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {Array.isArray(sportData.courts) && sportData.courts.length > 0 ? (
                                sportData.courts.map((court, courtIndex) => (
                                  <div key={courtIndex} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                      <h4 className="font-medium text-gray-900">{court.name || 'Unnamed Court'}</h4>
                                      <span className={`px-2 py-1 text-xs rounded-full ${
                                        court.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                      }`}>
                                        {court.isActive ? 'Available' : 'Unavailable'}
                                      </span>
                                    </div>
                                    <div className="space-y-1 text-sm text-gray-600">
                                      <p>Type: {court.type || 'Standard'}</p>
                                      <p>Surface: {court.surface || 'Standard'}</p>
                                      <p>Capacity: {court.capacity || 4} players</p>
                                      <p className="font-medium text-green-600">₹{court.hourlyRate || 0}/hour</p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-2 text-center py-8 text-gray-500">
                                  No courts information available for {sportName}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No sports information available
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'amenities' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Available Amenities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.isArray(facility.amenities) && facility.amenities.length > 0 ? (
                        facility.amenities.map((amenity, index) => {
                          // Handle both string and object formats
                          let amenityName = ''
                          let amenityDescription = ''
                          
                          if (typeof amenity === 'string') {
                            amenityName = amenity
                            amenityDescription = 'Available'
                          } else if (amenity && typeof amenity === 'object') {
                            amenityName = amenity.name || amenity.icon || 'Unknown'
                            amenityDescription = amenity.description || 'Available'
                          }
                          
                          return (
                            <div key={index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                              <div className="text-green-600 mt-1">
                                {getAmenityIcon(amenityName.toLowerCase())}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{amenityName}</h4>
                                <p className="text-sm text-gray-600">{amenityDescription}</p>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="col-span-2 text-center py-8 text-gray-500">
                          No amenities information available
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'policies' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Booking Policies</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Cancellation Policy</h4>
                          <p className="text-gray-600">
                            {facility.policies?.cancellationPolicy || 'Standard cancellation policy applies. Please contact the facility for details.'}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Booking Rules</h4>
                          <ul className="text-gray-600 space-y-1">
                            <li>• Advance booking: Up to {facility.policies?.bookingAdvance || 7} days</li>
                            <li>• Maximum duration: {facility.policies?.maxBookingDuration || 4} hours per booking</li>
                            <li>• Minimum duration: {facility.policies?.minBookingDuration || 1} hour per booking</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-600">
                  <Phone className="h-5 w-5 mr-3" />
                  <span>{facility.contactInfo?.phone || 'Not available'}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Mail className="h-5 w-5 mr-3" />
                  <span>{facility.contactInfo?.email || 'Not available'}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Globe className="h-5 w-5 mr-3" />
                  <span>{facility.contactInfo?.website || 'Not available'}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href={`/book/${facility._id}`}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700 transition-colors text-center block"
                >
                  Book Now
                </Link>
                <button className="w-full border border-green-600 text-green-600 py-3 px-4 rounded-md font-medium hover:bg-green-50 transition-colors">
                  Check Availability
                </button>
                <button className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-50 transition-colors">
                  Add to Favorites
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
