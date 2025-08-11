'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Star } from 'lucide-react'
import Link from 'next/link'
import { sportsAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import Header from '@/components/Header'

export default function SportsPage() {
  const [sports, setSports] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const response = await sportsAPI.getAll()
        setSports(response.sports || [])
      } catch (error) {
        console.error('Error fetching sports:', error)
        toast.error('Failed to load sports')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSports()
  }, [])

  const filteredSports = sports.filter(sport => {
    const matchesSearch = sport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sport.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || sport.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = ['indoor', 'outdoor', 'both']

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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">All Sports</h1>
          <p className="text-gray-600">Discover and explore all available sports at QuickCourt facilities</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search sports..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category} className="capitalize">
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSports.map((sport) => (
            <div
              key={sport.id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="text-center mb-4">
                <div className="text-5xl mb-3">{sport.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{sport.name}</h3>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full capitalize">
                  {sport.category}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm text-center mb-4">{sport.description}</p>
              
              <div className="flex items-center justify-center">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600 ml-1">{sport.popularity}% popularity</span>
              </div>
              
              <div className="mt-4 text-center">
                <Link
                  href={`/facilities?sport=${sport.name.toLowerCase()}`}
                  className="text-green-600 hover:text-green-700 font-medium text-sm"
                >
                  Find Facilities →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredSports.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No sports found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}
