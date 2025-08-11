'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Users, CreditCard, MapPin, Star, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { facilitiesAPI } from '@/lib/api'

export default function BookingPage() {
  const params = useParams()
  const [facility, setFacility] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [bookingData, setBookingData] = useState({
    sport: '',
    court: '',
    date: '',
    startTime: '',
    duration: 1,
    players: [{ name: '', email: '', phone: '' }],
    specialRequests: ''
  })



  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00'
  ]

  useEffect(() => {
    const fetchFacility = async () => {
      try {
        const response = await facilitiesAPI.getById(params.id)
        setFacility(response.facility)
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

  const handleInputChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePlayerChange = (index, field, value) => {
    setBookingData(prev => ({
      ...prev,
      players: prev.players.map((player, i) => 
        i === index ? { ...player, [field]: value } : player
      )
    }))
  }

  const addPlayer = () => {
    if (bookingData.players.length < 4) {
      setBookingData(prev => ({
        ...prev,
        players: [...prev.players, { name: '', email: '', phone: '' }]
      }))
    }
  }

  const removePlayer = (index) => {
    if (bookingData.players.length > 1) {
      setBookingData(prev => ({
        ...prev,
        players: prev.players.filter((_, i) => i !== index)
      }))
    }
  }

  const getSelectedSportData = () => {
    return facility?.sports.find(s => s.sport._id === bookingData.sport)
  }

  const getSelectedCourt = () => {
    const sportData = getSelectedSportData()
    return sportData?.courts.find(c => c.name === bookingData.court)
  }

  const calculateTotal = () => {
    const court = getSelectedCourt()
    return court ? court.hourlyRate * bookingData.duration : 0
  }

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleBooking = async () => {
    try {
      // TODO: Implement actual booking API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Booking confirmed! You will receive a confirmation email shortly.')
      // Redirect to bookings page
    } catch (error) {
      toast.error('Booking failed. Please try again.')
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

  const steps = [
    { number: 1, title: 'Select Sport & Court', icon: Users },
    { number: 2, title: 'Choose Date & Time', icon: Calendar },
    { number: 3, title: 'Player Details', icon: Users },
    { number: 4, title: 'Payment', icon: CreditCard }
  ]

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
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href={`/facilities/${params.id}`} className="inline-flex items-center text-green-600 hover:text-green-700 mb-6">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to facility
        </Link>

        {/* Facility Info */}
        {facility && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{facility.name || 'Unnamed Facility'}</h1>
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{facility.address?.city || 'Unknown City'}, {facility.address?.state || 'Unknown State'}</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                  <span className="font-medium text-gray-900">{facility.rating?.average || 0}</span>
                  <span className="text-gray-600 ml-1">({facility.rating?.count || 0} reviews)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'border-gray-300 text-gray-500'
                }`}>
                  {currentStep > step.number ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Booking Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Step 1: Select Sport & Court */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Select Sport & Court</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Choose Sport
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {facility?.sports?.map((sportData, index) => (
                          <button
                            key={index}
                            onClick={() => handleInputChange('sport', sportData.sport._id)}
                            className={`p-4 border-2 rounded-lg text-left transition-colors ${
                              bookingData.sport === sportData.sport._id
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center mb-2">
                              <span className="text-2xl mr-3">{sportData.sport?.icon || '🏀'}</span>
                              <h3 className="font-medium text-gray-900">{sportData.sport?.name || 'Unknown Sport'}</h3>
                            </div>
                            <p className="text-sm text-gray-600">{sportData.courts?.length || 0} courts available</p>
                            <p className="text-sm font-medium text-green-600 mt-1">
                              From ₹{sportData.courts?.length ? Math.min(...sportData.courts.map(c => c.hourlyRate || 0)) : 0}/hour
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {bookingData.sport && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Choose Court
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {getSelectedSportData()?.courts?.map((court, index) => (
                            <button
                              key={index}
                              onClick={() => handleInputChange('court', court.name)}
                              disabled={!court.isActive}
                              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                                bookingData.court === court.name
                                  ? 'border-green-500 bg-green-50'
                                  : court.isActive
                                  ? 'border-gray-200 hover:border-gray-300'
                                  : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                              }`}
                            >
                              <h3 className="font-medium text-gray-900">{court.name || 'Unnamed Court'}</h3>
                              <p className="text-sm text-gray-600 capitalize">{court.type || 'Unknown Type'}</p>
                              <p className="text-sm font-medium text-green-600 mt-1">
                                ₹{court.hourlyRate || 0}/hour
                              </p>
                              {!court.isActive && (
                                <p className="text-sm text-red-600 mt-1">Currently unavailable</p>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Date & Time */}
              {currentStep === 2 && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Choose Date & Time</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Date
                      </label>
                      <input
                        type="date"
                        value={bookingData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                        {timeSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => handleInputChange('startTime', time)}
                            className={`py-2 px-3 text-sm border rounded-md transition-colors ${
                              bookingData.startTime === time
                                ? 'border-green-500 bg-green-50 text-green-600'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (hours)
                      </label>
                      <select
                        value={bookingData.duration}
                        onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      >
                        {[1, 2, 3, 4].map((duration) => (
                          <option key={duration} value={duration}>
                            {duration} hour{duration > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Player Details */}
              {currentStep === 3 && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Player Details</h2>
                  
                  <div className="space-y-6">
                    {bookingData.players.map((player, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-medium text-gray-900">Player {index + 1}</h3>
                          {index > 0 && (
                            <button
                              onClick={() => removePlayer(index)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={player.name}
                            onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                          />
                          <input
                            type="email"
                            placeholder="Email"
                            value={player.email}
                            onChange={(e) => handlePlayerChange(index, 'email', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                          />
                          <input
                            type="tel"
                            placeholder="Phone"
                            value={player.phone}
                            onChange={(e) => handlePlayerChange(index, 'phone', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                      </div>
                    ))}
                    
                    {bookingData.players.length < 4 && (
                      <button
                        onClick={addPlayer}
                        className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 transition-colors"
                      >
                        + Add Player
                      </button>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Special Requests (Optional)
                      </label>
                      <textarea
                        value={bookingData.specialRequests}
                        onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        placeholder="Any special requirements or requests..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Payment */}
              {currentStep === 4 && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Payment</h2>
                  
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-4">Booking Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Sport:</span>
                          <span>{getSelectedSportData()?.sport.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Court:</span>
                          <span>{bookingData.court}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Date:</span>
                          <span>{bookingData.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Time:</span>
                          <span>{bookingData.startTime} ({bookingData.duration}h)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Players:</span>
                          <span>{bookingData.players.length}</span>
                        </div>
                        <div className="border-t pt-2 font-medium">
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span>₹{calculateTotal()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Payment Method</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input type="radio" name="payment" className="mr-3" defaultChecked />
                          <span>Credit/Debit Card</span>
                        </label>
                        <label className="flex items-center">
                          <input type="radio" name="payment" className="mr-3" />
                          <span>UPI</span>
                        </label>
                        <label className="flex items-center">
                          <input type="radio" name="payment" className="mr-3" />
                          <span>Net Banking</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {currentStep < 4 ? (
                  <button
                    onClick={handleNextStep}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleBooking}
                    className="px-8 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Confirm Booking
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
              {bookingData.sport && bookingData.court && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sport:</span>
                    <span className="font-medium">{getSelectedSportData()?.sport.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Court:</span>
                    <span className="font-medium">{bookingData.court}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rate:</span>
                    <span className="font-medium">₹{getSelectedCourt()?.hourlyRate}/hour</span>
                  </div>
                  {bookingData.duration && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{bookingData.duration} hour{bookingData.duration > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span className="text-green-600">₹{calculateTotal()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
