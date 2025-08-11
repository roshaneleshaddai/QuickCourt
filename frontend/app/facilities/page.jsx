'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Star, Filter, X, Menu } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { facilitiesAPI } from '@/lib/api'
import Header from '@/components/Header'

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [venueSearch, setVenueSearch] = useState('')
  const [selectedSport, setSelectedSport] = useState('')
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(5500)
  const [venueType, setVenueType] = useState({ indoor: false, outdoor: false })
  const [ratingFilter, setRatingFilter] = useState('')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const sports = [
    'Badminton',
    'Tennis', 
    'Basketball',
    'Football',
    'Cricket',
    'Swimming',
    'Table Tennis',
    'Volleyball'
  ]

  // Mock facilities data to match wireframe
  const mockFacilities = Array.from({ length: 12 }, (_, i) => ({
    _id: i + 1,
    name: 'SRR Badminton',
    rating: { average: 4.5, count: 6 },
    location: 'Vaishnavdevi Cir',
    price: 200,
    sport: 'Badminton',
    type: i % 2 === 0 ? 'Indoor' : 'Outdoor',
    tags: ['Top Rated', 'Budget'],
    image: null
  }))

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true)
        // For now, using mock data to match wireframe exactly
        setTimeout(() => {
          setFacilities(mockFacilities)
          setLoading(false)
        }, 1000)
        
        // Real API call would be:
        // const response = await facilitiesAPI.getAll({ page: currentPage, limit: 12 })
        // setFacilities(response.facilities || [])
      } catch (error) {
        console.error('Error fetching facilities:', error)
        toast.error('Failed to load facilities')
        setLoading(false)
      }
    }
    
    fetchFacilities()
  }, [currentPage])

  const clearFilters = () => {
    setSearchTerm('')
    setVenueSearch('')
    setSelectedSport('')
    setMinPrice(0)
    setMaxPrice(5500)
    setVenueType({ indoor: false, outdoor: false })
    setRatingFilter('')
  }

  const FilterSidebar = ({ isMobile = false }) => (
    <div className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-lg shadow-sm border`}>
      {/* Search by venue name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search by venue name
        </label>
        <input
          type="text"
          placeholder="Search for venues"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Search for venues */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search for venues"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            value={venueSearch}
            onChange={(e) => setVenueSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filter by sport type */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by sport type
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
          value={selectedSport}
          onChange={(e) => setSelectedSport(e.target.value)}
        >
          <option value="">All Sport</option>
          {sports.map((sport) => (
            <option key={sport} value={sport}>
              {sport}
            </option>
          ))}
        </select>
      </div>

      {/* Price range */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price range (per hour)
        </label>
        <div className="px-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">₹{minPrice}.00</span>
            <span className="text-sm text-gray-600">₹{maxPrice}.00</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="5500"
              step="50"
              value={minPrice}
              onChange={(e) => setMinPrice(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${(minPrice/5500)*100}%, #e5e7eb ${(minPrice/5500)*100}%, #e5e7eb 100%)`
              }}
            />
          </div>
        </div>
      </div>

      {/* Choose Venue Type */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Choose Venue Type
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={venueType.indoor}
              onChange={(e) => setVenueType(prev => ({ ...prev, indoor: e.target.checked }))}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm text-gray-700">Indoor</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={venueType.outdoor}
              onChange={(e) => setVenueType(prev => ({ ...prev, outdoor: e.target.checked }))}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm text-gray-700">Outdoor</span>
          </label>
        </div>
      </div>

      {/* Rating filters */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Rating
        </label>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <label key={rating} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={rating}
                checked={ratingFilter === rating.toString()}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
              />
              <div className="ml-3 flex items-center">
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-700">& up</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={clearFilters}
        className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors font-medium"
      >
        Clear Filters
      </button>
    </div>
  )

  const VenueCard = ({ facility }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image placeholder */}
      <div className="h-48 bg-gray-100 flex items-center justify-center border-b">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">🖼️</div>
          <span className="text-sm">Image</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Venue name and rating */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{facility.name}</h3>
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm text-gray-600">
              {facility.rating.average} ({facility.rating.count})
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center text-gray-600 mb-2">
          <MapPin className="h-4 w-4 mr-1 text-red-500" />
          <span className="text-sm">{facility.location}</span>
        </div>

        {/* Price */}
        <div className="flex items-center text-gray-600 mb-3">
          <span className="text-sm">₹ {facility.price} per hour</span>
        </div>

        {/* Sport and type tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            {facility.sport}
          </span>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
            {facility.type}
          </span>
        </div>

        {/* Additional tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {facility.tags.map((tag, index) => (
            <span
              key={index}
              className={`px-2 py-1 text-xs rounded ${
                tag === 'Top Rated' 
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-orange-100 text-orange-800'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* View Details button */}
        <Link
          href={`/facilities/${facility._id}`}
          className="block w-full bg-green-500 text-white text-center py-2 rounded-md hover:bg-green-600 transition-colors font-medium"
        >
          View Details
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Mobile filter button */}
      <div className="lg:hidden bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">
            Sports Venues in Ahmedabad:<br />
            Discover and Book Nearby Venues
          </h1>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>
        
        {/* Mobile search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search for venues"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            value={venueSearch}
            onChange={(e) => setVenueSearch(e.target.value)}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          *clicking this will open a side panel for displaying all the same filters as in desktop
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <FilterSidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Desktop Title */}
            <div className="hidden lg:block mb-6">
              <h1 className="text-xl font-semibold text-gray-900">
                Sports Venues in Ahmedabad: Discover and Book Nearby Venues
              </h1>
            </div>

            {/* Results Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-3 w-1/2"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {facilities.map((facility) => (
                  <VenueCard key={facility._id} facility={facility} />
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-center space-x-2 mt-8">
              <button className="w-8 h-8 flex items-center justify-center text-gray-400">
                &lt;
              </button>
              <button className="w-8 h-8 flex items-center justify-center bg-black text-white rounded">
                1
              </button>
              <button className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded">
                2
              </button>
              <button className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded">
                3
              </button>
              <button className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded">
                4
              </button>
              <span className="px-2 text-gray-400">...</span>
              <button className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded">
                11
              </button>
              <button className="w-8 h-8 flex items-center justify-center text-gray-400">
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Sidebar */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setMobileFiltersOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-full max-w-sm bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <FilterSidebar isMobile={true} />
            </div>
          </div>
        </div>
      )}

      {/* Footer placeholder */}
      <div className="bg-gray-100 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">
            Footer
          </div>
        </div>
      </div>
    </div>
  )
}