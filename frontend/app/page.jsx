'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Star, Calendar, Clock, Users, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { sportsAPI, facilitiesAPI } from '@/lib/api'
import Header from '@/components/Header'

export default function Home() {
  const [sports, setSports] = useState([])
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSport, setSelectedSport] = useState('')
  const [selectedCity, setSelectedCity] = useState('')



  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sportsData, facilitiesData] = await Promise.all([
          sportsAPI.getAll({ limit: 6 }),
          facilitiesAPI.getAll({ limit: 3 })
        ])
        
        setSports(sportsData.sports || [])
        setFacilities(facilitiesData.facilities || [])
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const handleSearch = () => {
    if (!searchTerm && !selectedSport && !selectedCity) {
      toast.error('Please enter search criteria')
      return
    }
    toast.success('Search functionality coming soon!')
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Book Your Perfect Court
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-green-100">
              Find and book sports facilities near you. Badminton, Tennis, Basketball and more.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg p-2 flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search facilities, sports, or locations..."
                    className="w-full pl-10 pr-4 py-3 border-0 focus:ring-0 text-gray-900 placeholder-gray-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="px-4 py-3 border-0 focus:ring-0 text-gray-900 bg-gray-50 rounded"
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                >
                  <option value="">All Sports</option>
                  {sports.map((sport) => (
                    <option key={sport._id} value={sport._id}>
                      {sport.name}
                    </option>
                  ))}
                </select>
                <select
                  className="px-4 py-3 border-0 focus:ring-0 text-gray-900 bg-gray-50 rounded"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                >
                  <option value="">All Cities</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Bangalore">Bangalore</option>
                </select>
                <button
                  onClick={handleSearch}
                  className="bg-green-600 text-white px-8 py-3 rounded font-medium hover:bg-green-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sports Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Popular Sports
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {sports.map((sport) => (
              <Link
                key={sport._id}
                href={`/facilities?sport=${sport.name.toLowerCase()}`}
                className="text-center p-6 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors cursor-pointer block"
              >
                <div className="text-4xl mb-3">{sport.icon}</div>
                <h4 className="font-semibold text-gray-900 mb-2">{sport.name}</h4>
                <p className="text-sm text-gray-600 capitalize">{sport.category}</p>
                <div className="flex items-center justify-center mt-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600 ml-1">{sport.popularity}%</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900">
              Featured Facilities
            </h3>
            <Link href="/facilities" className="flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium">
              <Filter className="h-5 w-5" />
              <span>View All</span>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {facilities.map((facility) => (
              <div key={facility._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <span className="text-6xl text-white opacity-80">
                    {facility.sports.some(sport => 
                      (typeof sport === 'string' && sport === 'Badminton') || 
                      (sport.sport?.name === 'Badminton')
                    ) ? '🏸' : 
                     facility.sports.some(sport => 
                       (typeof sport === 'string' && sport === 'Tennis') || 
                       (sport.sport?.name === 'Tennis')
                     ) ? '🎾' : '🏀'}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <Link href={`/facilities/${facility._id}`} className="text-xl font-semibold text-gray-900 hover:text-green-600 transition-colors">
                      {facility.name}
                    </Link>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="ml-1 text-gray-700">{facility.rating.average}</span>
                      <span className="text-gray-500 text-sm ml-1">({facility.rating.count})</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{facility.address.city}, {facility.address.state}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{facility.totalCourts} courts</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-green-600">₹{facility.hourlyRate}/hr</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {facility.sports.map((sport, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                      >
                        {typeof sport === 'string' ? sport : sport.sport?.name || 'Unknown Sport'}
                      </span>
                    ))}
                  </div>
                  
                  <Link
                    href={`/book/${facility._id}`}
                    className="w-full bg-green-600 text-white py-3 rounded-md font-medium hover:bg-green-700 transition-colors text-center block"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Play?
          </h3>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of players who book their favorite courts through QuickCourt
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="bg-green-600 text-white px-8 py-3 rounded-md font-medium hover:bg-green-700 transition-colors text-center">
              Get Started
            </Link>
            <Link href="/facilities" className="border border-green-600 text-green-600 px-8 py-3 rounded-md font-medium hover:bg-green-50 transition-colors text-center">
              Browse Facilities
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-xl font-bold text-green-400 mb-4">QuickCourt</h4>
              <p className="text-gray-400">
                Your one-stop solution for sports facility booking.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Quick Links</h5>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/facilities" className="hover:text-white">Facilities</Link></li>
                <li><Link href="/sports" className="hover:text-white">Sports</Link></li>
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Booking Guide</a></li>
                <li><a href="#" className="hover:text-white">Cancellation Policy</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Connect</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Facebook</a></li>
                <li><a href="#" className="hover:text-white">Twitter</a></li>
                <li><a href="#" className="hover:text-white">Instagram</a></li>
                <li><a href="#" className="hover:text-white">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 QuickCourt. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
