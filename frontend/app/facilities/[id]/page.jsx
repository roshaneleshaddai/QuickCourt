'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, MapPin, Clock, Phone, Mail, Globe, Users, Wifi, Car, Coffee, Check, X, BookOpen, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { facilitiesAPI } from '@/lib/api'
import Header from '@/components/Header'
import GoogleMap from '@/components/GoogleMap'
import ReviewDisplay from '@/components/ReviewDisplay'


export default function FacilityDetailPage() {
  const params = useParams()
  const [facility, setFacility] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSport, setSelectedSport] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showPricingModal, setShowPricingModal] = useState(false)

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
              <p className="text-sm text-gray-600 mb-4">Click on sports to view pricing and court details</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.isArray(facility.sports) && facility.sports.length > 0 ? (
                  facility.sports.map((sportData, index) => {
                    let sportName = 'Unknown Sport'
                    let sportIcon = '🏀'
                    let courtCount = 0
                    let minPrice = Infinity
                    let maxPrice = 0
                    
                    if (sportData.sport) {
                      if (typeof sportData.sport === 'string') {
                        sportName = sportData.sport
                      } else if (sportData.sport.name) {
                        sportName = sportData.sport.name
                        sportIcon = sportData.sport.icon || '🏀'
                      }
                    }
                    
                    // Calculate pricing from courts
                    if (sportData.courts && Array.isArray(sportData.courts)) {
                      courtCount = sportData.courts.length
                      sportData.courts.forEach(court => {
                        if (court.hourlyRate) {
                          minPrice = Math.min(minPrice, court.hourlyRate)
                          maxPrice = Math.max(maxPrice, court.hourlyRate)
                        }
                      })
                    }
                    
                    const priceRange = minPrice === maxPrice 
                      ? `₹${minPrice}/hr` 
                      : `₹${minPrice}-${maxPrice}/hr`
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedSport(sportData)
                          setShowPricingModal(true)
                        }}
                        className="border border-gray-200 rounded-lg p-4 text-center hover:border-green-300 hover:bg-green-50 transition-colors group"
                      >
                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{sportIcon}</div>
                        <h4 className="font-medium text-gray-900 mb-2">{sportName}</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="font-semibold text-green-600">{priceRange}</p>
                          <p>{courtCount} Court{courtCount !== 1 ? 's' : ''}</p>
                        </div>
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
              <div className="space-y-3 text-gray-700">
                {facility.description && (
                  <p className="leading-relaxed">{facility.description}</p>
                )}
                
                {/* Contact Information */}
                {facility.contactInfo && (
                  <div className="pt-3 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                    <div className="space-y-2">
                      {facility.contactInfo.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-green-600" />
                          <span>{facility.contactInfo.phone}</span>
                        </div>
                      )}
                      {facility.contactInfo.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-green-600" />
                          <span>{facility.contactInfo.email}</span>
                        </div>
                      )}
                      {facility.contactInfo.website && (
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-green-600" />
                          <span>{facility.contactInfo.website}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Facility Status */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${facility.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm text-gray-600">
                        {facility.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {facility.isVerified && (
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-600">Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Player Reviews & Ratings Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <ReviewDisplay facilityId={facility._id} />
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
                  {facility.location && facility.location.coordinates ? (
                    <div className="relative">
                      <GoogleMap 
                        coordinates={facility.location}
                        facilityName={facility.name}
                        address={facility.address}
                      />
                      {/* Overlay message for Google Maps setup */}
                      <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded opacity-90">
                        Interactive Map
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm font-medium mb-1">Location</p>
                        <p className="text-gray-500 text-xs px-2 leading-relaxed">
                          {facility.address?.street && `${facility.address.street}, `}
                          {facility.address?.city && `${facility.address.city}, `}
                          {facility.address?.state && `${facility.address.state}`}
                          {!facility.address?.street && !facility.address?.city && !facility.address?.state && 'Address not available'}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          📍 {facility.name || 'Facility'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Modal */}
      {showPricingModal && selectedSport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowPricingModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedSport.sport?.name || 'Sport'} - Pricing & Availability
              </h3>
              <button
                onClick={() => setShowPricingModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Pricing Disclaimer */}
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 text-center">
                  Pricing is subject to change and is controlled by the venue
                </p>
              </div>

              {/* Court Details */}
              {selectedSport.courts && Array.isArray(selectedSport.courts) && (
                <div className="space-y-6">
                  {selectedSport.courts.map((court, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-900">{court.name}</h4>
                        <span className="text-2xl font-bold text-green-600">₹{court.hourlyRate}/hr</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Type</p>
                          <p className="font-medium text-gray-900 capitalize">{court.type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Surface</p>
                          <p className="font-medium text-gray-900">{court.surface}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Capacity</p>
                          <p className="font-medium text-gray-900">{court.capacity} players</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Status</p>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            court.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {court.isActive ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                      </div>

                      {/* Court Amenities */}
                      {court.amenities && court.amenities.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Court Amenities</p>
                          <div className="flex flex-wrap gap-2">
                            {court.amenities.map((amenity, amenityIndex) => (
                              <span key={amenityIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Operating Hours */}
              {facility.operatingHours && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Operating Hours</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(facility.operatingHours).map(([day, hours]) => (
                      <div key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900 capitalize">
                          {getDayName(day)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {hours.isOpen ? `${hours.open} - ${hours.close}` : 'Closed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Booking Policies */}
              {facility.policies && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Booking Policies</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Cancellation Policy</span>
                      <span className="text-sm text-gray-900">{facility.policies.cancellationPolicy}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Advance Booking</span>
                      <span className="text-sm text-gray-900">{facility.policies.bookingAdvance} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Min Duration</span>
                      <span className="text-sm text-gray-900">{facility.policies.minBookingDuration} hour(s)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Max Duration</span>
                      <span className="text-sm text-gray-900">{facility.policies.maxBookingDuration} hour(s)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <button
                onClick={() => setShowPricingModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <Link
                href={`/book/${facility._id}`}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
