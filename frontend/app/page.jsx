'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Star, Users, Filter, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'
import { sportsAPI, facilitiesAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

// Custom Header Component for this page
function CustomHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-green-600"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-green-600">QUICKCOURT</h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/facilities" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
              Facilities
            </Link>
            <Link href="/sports" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
              Sports
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/profile" className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">
                  Profile
                </Link>
              </>
            )}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link
                  href="/facilities"
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Book
                </Link>
                <span className="text-gray-700 text-sm">Hi, {user?.firstName || 'User'}</span>
                <button
                  onClick={logout}
                  className="text-gray-600 hover:text-red-600 text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/facilities"
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Book
                </Link>
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-green-600 text-sm"
                >
                  Login
                </Link>
                <span className="text-gray-400">/</span>
                <Link
                  href="/auth/register"
                  className="text-gray-700 hover:text-green-600 text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Auth */}
          <div className="md:hidden">
            {isAuthenticated ? (
              <span className="text-sm text-gray-600">Hi, {user?.firstName || 'User'}</span>
            ) : (
              <Link href="/auth/login" className="text-green-600 text-sm font-medium">
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
            <div className="px-4 py-2 space-y-1">
              <Link href="/facilities" className="block px-3 py-2 text-gray-700 hover:text-green-600">
                Facilities
              </Link>
              <Link href="/sports" className="block px-3 py-2 text-gray-700 hover:text-green-600">
                Sports
              </Link>
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="block px-3 py-2 text-gray-700 hover:text-green-600">
                    Dashboard
                  </Link>
                  <Link href="/profile" className="block px-3 py-2 text-gray-700 hover:text-green-600">
                    Profile
                  </Link>
                  <button onClick={logout} className="block w-full text-left px-3 py-2 text-gray-700 hover:text-red-600">
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/auth/register" className="block px-3 py-2 text-gray-700 hover:text-green-600">
                  Sign Up
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default function Home() {
  const [sports, setSports] = useState([])
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSport, setSelectedSport] = useState('')
  const [selectedCity, setSelectedCity] = useState('')

  // Horizontal scrollers
  const facilityScrollRef = useRef(null)
  const sportsScrollRef = useRef(null)

  const scrollByAmount = (ref, amount) => {
    if (!ref?.current) return
    ref.current.scrollBy({ left: amount, behavior: 'smooth' })
  }

  // City suggestions for quick selection (India)
  const citySuggestions = [
    'Ahmedabad', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune',
    'Kolkata', 'Jaipur', 'Surat', 'Lucknow', 'Indore', 'Bhopal', 'Nagpur',
    'Coimbatore', 'Kochi', 'Chandigarh', 'Noida', 'Gurugram', 'Thane'
  ]

  // Sports data with images and emoji fallbacks
  const sportsData = {
    'Badminton': { 
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&h=200&fit=crop',
      emoji: '🏸',
      gradient: 'from-orange-400 to-orange-600'
    },
    'Football': { 
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&h=200&fit=crop',
      emoji: '⚽',
      gradient: 'from-green-400 to-green-600'
    },
    'Cricket': { 
      image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200&h=200&fit=crop',
      emoji: '🏏',
      gradient: 'from-blue-400 to-blue-600'
    },
    'Swimming': { 
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop',
      emoji: '🏊‍♂️',
      gradient: 'from-cyan-400 to-cyan-600'
    },
    'Tennis': { 
      image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=200&h=200&fit=crop',
      emoji: '🎾',
      gradient: 'from-yellow-400 to-yellow-600'
    },
    'Table Tennis': { 
      image: 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=200&h=200&fit=crop',
      emoji: '🏓',
      gradient: 'from-red-400 to-red-600'
    },
    'Basketball': { 
      image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&h=200&fit=crop',
      emoji: '🏀',
      gradient: 'from-orange-400 to-orange-600'
    },
    'Volleyball': {
      image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=200&h=200&fit=crop',
      emoji: '🏐',
      gradient: 'from-purple-400 to-purple-600'
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sportsData, facilitiesData] = await Promise.all([
          sportsAPI.getAll({ limit: 8 }),
          facilitiesAPI.getAll({ limit: 6 })
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
    // Navigate to facilities with search params
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (selectedSport) params.set('sport', selectedSport)
    if (selectedCity) params.set('city', selectedCity)
    window.location.href = `/facilities?${params.toString()}`
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
      {/* Custom Header */}
      <CustomHeader />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[500px] py-12">
            {/* Left: Content */}
            <div>
              <div className="flex items-center mb-6">
                <MapPin className="h-6 w-6 mr-3 text-green-200" />
                <span className="text-lg text-green-100">Ahmedabad</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                FIND PLAYERS & VENUES<br />
                <span className="text-green-200">NEARBY</span>
              </h1>
              
              <p className="text-lg md:text-xl text-green-100 mb-8 max-w-lg">
                Seamlessly explore sports venues and play with sports enthusiasts just like you!
              </p>

              {/* Search Form */}
              <div className="bg-white rounded-xl p-6 max-w-md">
                <div className="space-y-4">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      list="city-suggestions"
                      placeholder="Ahmedabad"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                    />
                    <datalist id="city-suggestions">
                      {citySuggestions.map((city) => (
                        <option key={city} value={city} />
                      ))}
                    </datalist>
                  </div>
                  
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                  >
                    <option value="">Select Sport</option>
                    {sports.map((sport) => (
                      <option key={sport._id} value={sport._id}>
                        {sport.name}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={handleSearch}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <Search className="h-5 w-5 mr-2" />
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Hero Image (Desktop only) */}
            <div className="hidden lg:block">
              <div className="relative h-96">
                <div className="w-full h-full bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-8xl mb-4">🏸</div>
                    <p className="text-xl text-white/80">Sports & Recreation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Book Venues Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Book Venues</h2>
            <Link href="/facilities" className="text-green-600 hover:text-green-700 font-semibold text-lg">
              See all venues &gt;
            </Link>
          </div>

          <div className="relative">
            {/* Desktop Navigation Arrows */}
            <button
              onClick={() => scrollByAmount(facilityScrollRef, -400)}
              className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg hover:shadow-xl border border-gray-200 text-gray-600 hover:text-green-600 transition-all"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => scrollByAmount(facilityScrollRef, 400)}
              className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg hover:shadow-xl border border-gray-200 text-gray-600 hover:text-green-600 transition-all"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Scrollable Venues */}
            <div
              ref={facilityScrollRef}
              className="flex gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 lg:px-12"
            >
              {facilities.map((facility) => (
                <div key={facility._id} className="min-w-[280px] md:min-w-[320px] bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow snap-start border border-gray-100">
                  {/* Venue Image */}
                  <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 rounded-t-xl flex items-center justify-center relative overflow-hidden">
                    <span className="text-6xl text-white/80">
                      {facility.sports.some(sport => 
                        (typeof sport === 'string' && sport === 'Badminton') || 
                        (sport.sport?.name === 'Badminton')
                      ) ? '🏸' : 
                        facility.sports.some(sport => 
                          (typeof sport === 'string' && sport === 'Tennis') || 
                          (sport.sport?.name === 'Tennis')
                        ) ? '🎾' : '🏀'}
                    </span>
                    {/* Rating Badge */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                      <span className="text-sm font-semibold text-gray-800">
                        {facility.rating?.average || '4.5'}
                      </span>
                    </div>
                  </div>

                  {/* Venue Details */}
                  <div className="p-6">
                    <div className="mb-3">
                      <Link href={`/facilities/${facility._id}`} className="text-xl font-bold text-gray-900 hover:text-green-600 transition-colors line-clamp-2">
                        {facility.name}
                      </Link>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm truncate">{facility.address?.city}, {facility.address?.state}</span>
                    </div>

                    {/* Sports Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {facility.sports.slice(0, 3).map((sport, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                          {typeof sport === 'string' ? sport : sport.sport?.name || 'Sport'}
                        </span>
                      ))}
                      {facility.sports.length > 3 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                          +{facility.sports.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Price and Book Button */}
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-green-600">
                        ₹{facility.hourlyRate || '500'}/hr
                      </div>
                      <Link 
                        href={`/book/${facility._id}`}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Sports Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Popular Sports</h2>

          <div className="relative">
            {/* Desktop Navigation Arrows */}
            <button
              onClick={() => scrollByAmount(sportsScrollRef, -400)}
              className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg hover:shadow-xl border border-gray-200 text-gray-600 hover:text-green-600 transition-all"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => scrollByAmount(sportsScrollRef, 400)}
              className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg hover:shadow-xl border border-gray-200 text-gray-600 hover:text-green-600 transition-all"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Scrollable Sports */}
            <div 
              ref={sportsScrollRef}
              className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 lg:px-12"
            >
              {sports.map((sport) => {
                const sportInfo = sportsData[sport.name] || { 
                  emoji: sport.icon || '🏀', 
                  gradient: 'from-green-400 to-green-600' 
                }
                
                return (
                  <Link
                    key={sport._id}
                    href={`/facilities?sport=${sport.name.toLowerCase()}`}
                    className="min-w-[140px] md:min-w-[160px] bg-white rounded-xl shadow-md hover:shadow-lg transition-all snap-start border border-gray-100 overflow-hidden group"
                  >
                    <div className="h-32 md:h-36 relative overflow-hidden">
                      {sportInfo.image ? (
                        <>
          <Image
                            src={sportInfo.image}
                            alt={sport.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              // Fallback to gradient background if image fails to load
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                          <div className={`h-full bg-gradient-to-br ${sportInfo.gradient} items-center justify-center hidden`}>
                            <span className="text-4xl text-white/80">{sportInfo.emoji}</span>
                          </div>
                        </>
                      ) : (
                        <div className={`h-full bg-gradient-to-br ${sportInfo.gradient} flex items-center justify-center`}>
                          <span className="text-4xl text-white/80">{sportInfo.emoji}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <div className="text-white font-semibold text-sm md:text-base">{sport.name}</div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-xl font-bold text-green-400 mb-4">QUICKCOURT</h4>
              <p className="text-gray-400">
                Your one-stop solution for sports facility booking and finding playing partners.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Quick Links</h5>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/facilities" className="hover:text-white transition-colors">Facilities</Link></li>
                <li><Link href="/sports" className="hover:text-white transition-colors">Sports</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Booking Guide</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cancellation Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Connect</h5>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Facebook</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Twitter</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Instagram</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">LinkedIn</Link></li>
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