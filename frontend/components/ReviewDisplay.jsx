'use client'

import { useState, useEffect } from 'react'
import { Star, User, Clock } from 'lucide-react'
import { reviewsAPI } from '@/lib/api'
import toast from 'react-hot-toast'

export default function ReviewDisplay({ facilityId }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [rating, setRating] = useState({ average: 0, count: 0 })

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true)
        console.log('Fetching reviews for facility:', facilityId)
        
        const response = await reviewsAPI.getFacilityReviews(facilityId, { limit: 10 })
        console.log('Reviews API response:', response)
        
        if (response.success !== false) {
          setReviews(response.reviews || [])
          setPagination(response.pagination || {})
          setRating(response.rating || { average: 0, count: 0 })
        } else {
          console.error('API returned error:', response.message)
          setReviews([])
          setRating({ average: 0, count: 0 })
        }
      } catch (error) {
        console.error('Error fetching reviews:', error)
        
        // Handle different types of errors gracefully
        if (error.message.includes('Route not found')) {
          console.log('Reviews API endpoint not available yet - this is normal during development')
          // Don't show error for missing endpoint
        } else if (error.message.includes('No reviews found')) {
          console.log('No reviews found for this facility - this is normal')
          // Don't show error for no reviews
        } else if (error.message.includes('Network error')) {
          console.log('Network error - backend server might not be running')
          // Don't show error for network issues during development
        } else {
          console.error('Error details:', error.message)
          toast.error('Failed to load reviews')
        }
        
        // Set empty state
        setReviews([])
        setRating({ average: 0, count: 0 })
      } finally {
        setLoading(false)
      }
    }

    if (facilityId) {
      fetchReviews()
    } else {
      setLoading(false)
    }
  }, [facilityId])

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Player Reviews & Ratings
        </h3>
        {rating.count > 0 && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {renderStars(rating.average)}
            </div>
            <span className="text-sm font-medium text-gray-900">
              {rating.average.toFixed(1)}
            </span>
            <span className="text-sm text-gray-600">
              ({rating.count} review{rating.count !== 1 ? 's' : ''})
            </span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="mb-4">
            <Star className="h-16 w-16 text-gray-300 mx-auto" />
          </div>
          <h4 className="text-xl font-medium text-gray-900 mb-2">No reviews yet</h4>
          <p className="text-gray-600 mb-4">Be the first to review this facility!</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-blue-700">
              📝 To leave a review, book this facility and complete your session. 
              You can then rate and review from your dashboard.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {review.user?.firstName} {review.user?.lastName}
                    </h4>
                    <div className="flex items-center space-x-1">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-2">{review.comment}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{formatDate(review.createdAt)}</span>
                    {review.isVerified && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-blue-600">Verified</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {pagination.totalPages > 1 && (
            <div className="text-center pt-4">
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                Load more reviews
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
