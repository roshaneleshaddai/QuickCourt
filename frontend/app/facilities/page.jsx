'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Star, Filter, Grid, List, Clock, Users, Wifi, Car, Coffee } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { facilitiesAPI } from '@/lib/api'

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSport, setSelectedSport] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [rating, setRating] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

  const sports = [
    { id: 1, name: 'Badminton', icon: '🏸' },
    { id: 2, name: 'Tennis', icon: '🎾' },
    { id: 3, name: 'Basketball', icon: '🏀' },
    { id: 4, name: 'Soccer', icon: '⚽' }
  ]

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        // Only include parameters that have values
        const params = {}
        if (searchTerm) params.search = searchTerm
        if (selectedSport) params.sport = selectedSport
        if (selectedCity) params.city = selectedCity
        if (rating) params.rating = rating
        params.page = 1
        params.limit = 20

        console.log('Sending params to facilities API:', params)
        const response = await facilitiesAPI.getAll(params)
        console.log('Facilities API response:', response)
        console.log('Facilities data structure:', response.facilities?.[0])
        console.log('First facility sports:', response.facilities?.[0]?.sports)
        console.log('First facility amenities:', response.facilities?.[0]?.amenities)
        
        // Ensure we have an array of facilities
        if (response.facilities && Array.isArray(response.facilities)) {
          setFacilities(response.facilities)
        } else {
          console.warn('Facilities data is not an array:', response.facilities)
          setFacilities([])
        }
      } catch (error) {
        console.error('Error fetching facilities:', error)
        toast.error('Failed to load facilities')
      } finally {
        setLoading(false)
      }
    }
    
    fetchFacilities()
  }, [searchTerm, selectedSport, selectedCity, rating])

  const getAmenityIcon = (amenity) => {
    // Ensure amenity is a string
    if (typeof amenity !== 'string') {
      return <span className="h-4 w-4 bg-gray-300 rounded-full"></span>
    }
    
    switch (amenity.toLowerCase()) {
      case 'wifi': return <Wifi className="h-4 w-4" />
      case 'parking': return <Car className="h-4 w-4" />
      case 'cafeteria': return <Coffee className="h-4 w-4" />
      default: return <span className="h-4 w-4 bg-gray-300 rounded-full"></span>
    }
  }

  const FacilityCard = ({ facility }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
             <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
         <span className="text-6xl text-white opacity-80">
           {(() => {
             // Get the first sport to determine the icon
             const firstSport = Array.isArray(facility.sports) && facility.sports[0]
             if (!firstSport) return '🏀'
             
             let sportName = ''
             
             if (typeof firstSport === 'string') {
               sportName = firstSport
             } else if (firstSport.sport) {
               if (typeof firstSport.sport === 'string') {
                 sportName = firstSport.sport
               } else if (firstSport.sport.name) {
                 sportName = firstSport.sport.name
               }
             }
             
             if (sportName.includes('Badminton')) return '🏸'
             if (sportName.includes('Tennis')) return '🎾'
             if (sportName.includes('Basketball')) return '🏀'
             if (sportName.includes('Soccer')) return '⚽'
             return '🏀'
           })()}
         </span>
       </div>
      <div className="p-6">
                 <div className="flex items-start justify-between mb-3">
           <h3 className="text-xl font-semibold text-gray-900">{facility.name || 'Unnamed Facility'}</h3>
           <div className="flex items-center">
             <Star className="h-5 w-5 text-yellow-400 fill-current" />
             <span className="ml-1 text-gray-700">{facility.rating?.average || 0}</span>
             <span className="text-gray-500 text-sm ml-1">({facility.rating?.count || 0})</span>
           </div>
         </div>
        
                 <div className="flex items-center text-gray-600 mb-3">
           <MapPin className="h-4 w-4 mr-2" />
           <span className="text-sm">{facility.address?.city || 'Unknown City'} • {facility.distance || 'N/A'}</span>
         </div>
        
        <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center space-x-4 text-sm text-gray-600">
             <div className="flex items-center">
               <Users className="h-4 w-4 mr-1" />
               <span>{facility.totalCourts || 0} courts</span>
             </div>
             <div className="flex items-center">
               <Clock className="h-4 w-4 mr-1" />
               <span>
                 {(() => {
                   // Handle operating hours structure
                   if (facility.operatingHours) {
                     // Check if it's the new structure with day-based hours
                     if (facility.operatingHours.monday) {
                       return `${facility.operatingHours.monday.open || 'N/A'} - ${facility.operatingHours.monday.close || 'N/A'}`
                     }
                     // Check if it's the old structure with direct open/close
                     if (facility.operatingHours.open && facility.operatingHours.close) {
                       return `${facility.operatingHours.open} - ${facility.operatingHours.close}`
                     }
                   }
                   return 'N/A - N/A'
                 })()}
               </span>
             </div>
           </div>
           <div className="flex items-center">
             <span className="font-medium text-green-600">
               ₹{(() => {
                 // Try to get hourly rate from different sources
                 if (facility.hourlyRate && facility.hourlyRate > 0) {
                   return facility.hourlyRate
                 }
                 // Try to get from sports courts
                 if (facility.sports && facility.sports.length > 0) {
                   const firstSport = facility.sports[0]
                   if (firstSport.courts && firstSport.courts.length > 0) {
                     return firstSport.courts[0].hourlyRate || 0
                   }
                 }
                 return 0
               })()}/hr
             </span>
           </div>
        </div>
        
                 <div className="flex flex-wrap gap-2 mb-4">
           {Array.isArray(facility.sports) && facility.sports.map((sportItem, index) => {
             // Handle both string and object formats
             let sportName = 'Unknown Sport'
             
             if (typeof sportItem === 'string') {
               sportName = sportItem
             } else if (sportItem.sport) {
               // Check if sport is populated (has name) or is an ObjectId
               if (typeof sportItem.sport === 'string') {
                 sportName = sportItem.sport
               } else if (sportItem.sport.name) {
                 sportName = sportItem.sport.name
               } else {
                 sportName = 'Unknown Sport'
               }
             }
             
             return (
               <span
                 key={index}
                 className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full"
               >
                 {sportName}
               </span>
             )
           })}
         </div>

        <div className="flex items-center gap-2 mb-4">
          {Array.isArray(facility.amenities) && facility.amenities.slice(0, 4).map((amenity, index) => {
            // Handle both string and object formats for amenities
            let amenityName = ''
            if (typeof amenity === 'string') {
              amenityName = amenity
            } else if (amenity && typeof amenity === 'object') {
              amenityName = amenity.name || amenity.icon || 'Unknown'
            }
            
            return (
              <div key={index} className="flex items-center text-gray-500" title={amenityName}>
                {getAmenityIcon(amenityName)}
              </div>
            )
          })}
          {Array.isArray(facility.amenities) && facility.amenities.length > 4 && (
            <span className="text-xs text-gray-500">+{facility.amenities.length - 4} more</span>
          )}
        </div>
        
        <div className="flex gap-2">
                     <Link
             href={`/facilities/${facility._id || '#'}`}
             className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md font-medium hover:bg-green-700 transition-colors text-center"
           >
             View Details
           </Link>
           <Link
             href={`/book/${facility._id || '#'}`}
             className="flex-1 border border-green-600 text-green-600 py-2 px-4 rounded-md font-medium hover:bg-green-50 transition-colors text-center"
           >
             Book Now
           </Link>
        </div>
      </div>
    </div>
  )

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
              <Link href="/facilities" className="text-green-600 px-3 py-2 rounded-md text-sm font-medium">
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

      {/* Search and Filters */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="md:col-span-2 lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search facilities..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
            >
              <option value="">All Sports</option>
              {sports.map((sport) => (
                <option key={sport.id} value={sport.name}>
                  {sport.name}
                </option>
              ))}
            </select>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              <option value="">All Cities</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bangalore">Bangalore</option>
            </select>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
            >
              <option value="">All Prices</option>
              <option value="0-500">₹0 - ₹500</option>
              <option value="500-1000">₹500 - ₹1000</option>
              <option value="1000+">₹1000+</option>
            </select>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Sports Facilities in Mumbai ({facilities.length} results)
          </h2>
          <button className="flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium">
            <Filter className="h-5 w-5" />
            <span>More Filters</span>
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-300"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
          }>
                         {facilities.map((facility) => (
               <FacilityCard key={facility._id || `facility-${Math.random()}`} facility={facility} />
             ))}
          </div>
        )}

        {!loading && facilities.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏸</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No facilities found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}
