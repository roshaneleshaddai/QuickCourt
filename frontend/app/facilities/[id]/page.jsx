'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, MapPin, Clock, Phone, Mail, Globe, Users, Wifi, Car, Coffee, Check, X, BookOpen, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { facilitiesAPI } from '@/lib/api'
import Header from '@/components/Header'
import GoogleMap from '@/components/GoogleMap'

export default function FacilityDetailPage() {
  const params = useParams()
  const [facility, setFacility] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSport, setSelectedSport] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const fetchFacility = async () => {
      try {
        const response = await facilitiesAPI.getById(params.id)
        console.log('Facility API response:', response)
        
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
    switch (iconType.toLowerCase()) {
      case 'wifi': return <Wifi className="h-5 w-5" />
      case 'parking': return <Car className="h-5 w-5" />
      case 'cafeteria':
      case 'refreshments': return <Coffee className="h-5 w-5" />
      case 'restroom': return <Users className="h-5 w-5" />
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

  const nextImage = () => {
    if (facility?.images && facility.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % facility.images.length)
    }
  }

  const prevImage = () => {
    if (facility?.images && facility.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + facility.images.length) % facility.images.length)
    }
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
      <Header />

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
              {/* Image Gallery */}
              <div className="h-64 bg-gradient-to-br from-green-400 to-green-600 relative overflow-hidden">
                {facility.images && facility.images.length > 0 ? (
                  <div className="relative h-full">
                    <img 
                      src={facility.images[currentImageIndex]} 
                      alt={`${facility.name} - Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Navigation Arrows */}
                    <button 
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition-all"
                    >
                      <ArrowLeft className="h-5 w-5 text-gray-700" />
                    </button>
                    <button 
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition-all"
                    >
                      <ArrowLeft className="h-5 w-5 text-gray-700 rotate-180" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-8xl text-white opacity-80">🏸</span>
                  </div>
                )}
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
                      <span className="text-gray-600 ml-1">({facility.rating?.count || 0})</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">{facility.description || 'No description available.'}</p>
              </div>
            </div>

            {/* Sports Available Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Sports Available</h3>
              <p className="text-sm text-gray-600 mb-4">(Click on sports to view price chart)</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.isArray(facility.sports) && facility.sports.length > 0 ? (
                  facility.sports.map((sportData, index) => {
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
                      <button
                        key={index}
                        onClick={() => setSelectedSport(sportData.sport._id || sportData.sport)}
                        className="border border-gray-200 rounded-lg p-4 text-center hover:border-green-300 hover:bg-green-50 transition-colors"
                      >
                        <div className="text-3xl mb-2">{sportIcon}</div>
                        <h4 className="font-medium text-gray-900">{sportName}</h4>
                      </button>
                    )
                  })
                ) : (
                  <div className="col-span-3 text-center py-8 text-gray-500">
                    No sports information available
                  </div>
                )}
              </div>
            </div>

            {/* Amenities Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Amenities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.isArray(facility.amenities) && facility.amenities.length > 0 ? (
                  facility.amenities.map((amenity, index) => {
                    let amenityName = ''
                    
                    if (typeof amenity === 'string') {
                      amenityName = amenity
                    } else if (amenity && typeof amenity === 'object') {
                      amenityName = amenity.name || amenity.icon || 'Unknown'
                    }
                    
                    return (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="text-green-600">
                          <Check className="h-5 w-5" />
                        </div>
                        <span className="text-gray-700">{amenityName}</span>
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

            {/* About Venue Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">About Venue</h3>
              <div className="space-y-2 text-gray-700">
                <p>• Tournament Training Venue</p>
                <p>• For more than 2 players Rs. 50 extra per person</p>
                <p>• Equipment available on rent</p>
                <p>• ...</p>
              </div>
            </div>

            {/* Player Reviews & Ratings Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Player Reviews & Ratings</h3>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((review, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">Mitchell Admin</h4>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className="h-4 w-4 text-yellow-400 fill-current" />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">Nice turf, well maintained</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>10 June 2025, 5:30 PM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-center">
                  <button className="text-blue-600 hover:text-blue-700 font-medium">
                    Load more reviews
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <Link
                href={`/book/${facility._id}`}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700 transition-colors text-center block mb-6"
              >
                Book This Venue
              </Link>

              <div className="space-y-6">
                {/* Operating Hours */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Operating Hours
                  </h4>
                  <p className="text-gray-700">7:00 AM - 11:00 PM</p>
                </div>

                {/* Address */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Address
                  </h4>
                  <p className="text-gray-700 text-sm">
                    {facility.address?.street || '2nd Floor, Aangan Banquet Hall'}, {facility.address?.city || 'Satellite'}, {facility.address?.state || 'Ahmedabad'}, {facility.address?.zipCode || '380051'}
                  </p>
                </div>

                {/* Location Map */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Location Map</h4>
                  <GoogleMap 
                    coordinates={facility.location}
                    facilityName={facility.name}
                    address={facility.address}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
