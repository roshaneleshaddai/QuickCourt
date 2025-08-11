'use client'

import { useState, useEffect } from 'react'
import { Star, X } from 'lucide-react'
import { reviewsAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function ReviewModal({ 
  isOpen, 
  onClose, 
  facility, 
  booking, 
  existingReview = null,
  onReviewSubmitted 
}) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    rating: 0,
    comment: ''
  })
  const [hoverRating, setHoverRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Initialize form with existing review data if editing
  useEffect(() => {
    if (existingReview) {
      setFormData({
        rating: existingReview.rating || 0,
        comment: existingReview.comment || ''
      })
    } else {
      setFormData({
        rating: 0,
        comment: ''
      })
    }
  }, [existingReview, isOpen])

  const handleStarClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }))
  }

  const handleStarHover = (rating) => {
    setHoverRating(rating)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    console.log('=== REVIEW SUBMISSION START ===')
    console.log('User:', user)
    console.log('Facility:', facility)
    console.log('Form data:', formData)
    console.log('Existing review:', existingReview)
    
    // Validation
    if (formData.rating === 0) {
      console.log('❌ Validation failed: No rating selected')
      toast.error('Please select a rating')
      return
    }
    
    if (formData.comment.trim().length < 10) {
      console.log('❌ Validation failed: Comment too short')
      toast.error('Please write at least 10 characters in your review')
      return
    }

    if (!facility || !facility._id) {
      console.log('❌ Validation failed: Missing facility information')
      toast.error('Facility information is missing')
      return
    }

    if (!user || !user._id) {
      console.log('❌ Validation failed: User not authenticated')
      toast.error('You must be logged in to submit a review')
      return
    }

    try {
      setSubmitting(true)
      
      const reviewData = {
        facility: facility._id,
        rating: formData.rating,
        comment: formData.comment.trim()
      }

      console.log('✅ Submitting review data:', reviewData)
      console.log('📡 API endpoint:', existingReview ? `PUT /reviews/${existingReview._id}` : 'POST /reviews')

      let response
      if (existingReview) {
        // Update existing review
        console.log('🔄 Updating existing review:', existingReview._id)
        response = await reviewsAPI.update(existingReview._id, reviewData)
        console.log('✅ Update response:', response)
        toast.success('Review updated successfully!')
      } else {
        // Create new review
        console.log('🆕 Creating new review...')
        response = await reviewsAPI.create(reviewData)
        console.log('✅ Create response:', response)
        toast.success('Review submitted successfully!')
      }

      console.log('📝 Final API response:', response)

      // Call callback to update parent component
      if (onReviewSubmitted) {
        console.log('📞 Calling onReviewSubmitted callback')
        onReviewSubmitted(response.review || response)
      }

      console.log('🎉 Review submission completed successfully!')
      
      // Close modal
      onClose()
    } catch (error) {
      console.error('💥 Error submitting review:', error)
      console.error('💥 Error details:', error.message)
      console.error('💥 Full error object:', error)
      
      // Enhanced error handling
      let errorMessage = 'Failed to submit review. Please try again.'
      
      if (error.message.includes('already reviewed')) {
        errorMessage = 'You have already reviewed this facility'
      } else if (error.message.includes('Validation failed')) {
        errorMessage = 'Please check your review details and try again'
      } else if (error.message.includes('Facility not found')) {
        errorMessage = 'Facility not found. Please try again.'
      } else if (error.message.includes('Route not found')) {
        errorMessage = 'Backend server is not running. Please contact support.'
      } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
        errorMessage = 'Please log in again to submit your review'
      } else if (error.message.includes('Network Error') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.'
      } else {
        errorMessage = `Error: ${error.message}`
      }
      
      toast.error(errorMessage)
      console.log('=== REVIEW SUBMISSION FAILED ===')
    } finally {
      setSubmitting(false)
    }
  }

  const displayRating = hoverRating || formData.rating

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {existingReview ? 'Edit Review' : 'Rate Facility'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Facility Info */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-1">{facility?.name}</h4>
            <p className="text-sm text-gray-600">
              {facility?.address?.city}, {facility?.address?.state}
            </p>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Your Rating *
            </label>
            <div className="flex items-center space-x-1 mb-2">
              {Array.from({ length: 5 }, (_, i) => {
                const starValue = i + 1
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleStarClick(starValue)}
                    onMouseEnter={() => handleStarHover(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        starValue <= displayRating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                )
              })}
            </div>
            <p className="text-sm text-gray-600">
              {displayRating === 1 && 'Poor'}
              {displayRating === 2 && 'Fair'}
              {displayRating === 3 && 'Good'}
              {displayRating === 4 && 'Very Good'}
              {displayRating === 5 && 'Excellent'}
              {displayRating === 0 && 'Click to rate'}
            </p>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review *
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Share your experience with this facility..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 resize-none"
              maxLength={500}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.comment.length}/500 characters (min. 10 required)
            </p>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || formData.rating === 0 || formData.comment.trim().length < 10}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
