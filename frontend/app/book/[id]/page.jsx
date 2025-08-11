'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Users, CreditCard, MapPin, Star, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { facilitiesAPI, bookingsAPI } from '@/lib/api'
import Header from '@/components/Header'

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const [facility, setFacility] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingData, setBookingData] = useState({
    sport: '',
    court: '',
    date: '',
    startTime: '',
    duration: 1,
    players: [{ name: '', email: '', phone: '' }],
    specialRequests: ''
  })

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [bookedSlots, setBookedSlots] = useState([])

  // Helper function to format date consistently and avoid timezone issues
  const formatDateToLocalString = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  useEffect(() => {
    const fetchFacility = async () => {
      try {
        const response = await facilitiesAPI.getById(params.id)
        setFacility(response.facility || response)
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

  // Fetch booked slots when date changes
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!bookingData.date || !facility) return
      
      try {
        const response = await bookingsAPI.getFacilityAvailability(params.id, bookingData.date)
        setBookedSlots(response.bookings || [])
      } catch (error) {
        console.error('Error fetching booked slots:', error)
        setBookedSlots([])
      }
    }
    
    fetchBookedSlots()
  }, [bookingData.date, facility, params.id])

  // Check if a time slot is available
  const isTimeSlotAvailable = (time) => {
    if (!bookedSlots.length) return true
    
    const selectedStart = new Date(`2000-01-01 ${time}`)
    const selectedEnd = new Date(selectedStart.getTime() + (bookingData.duration * 60 * 60 * 1000))
    
    return !bookedSlots.some(booking => {
      const bookingStart = new Date(`2000-01-01 ${booking.startTime}`)
      const bookingEnd = new Date(`2000-01-01 ${booking.endTime}`)
      
      // Check for overlap
      return (selectedStart < bookingEnd && selectedEnd > bookingStart)
    })
  }

  // Filter available time slots based on booked slots
  const getAvailableTimeSlots = (date) => {
    const allSlots = generateTimeSlots(date)
    return allSlots.filter(slot => isTimeSlotAvailable(slot.value))
  }

  // Generate time slots based on facility operating hours
  const generateTimeSlots = (date) => {
    if (!facility || !date) return []
    
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()
    console.log('Generating time slots for:', dayOfWeek, 'Facility:', facility.name)
    console.log('Operating hours:', facility.operatingHours)
    
    // Fallback operating hours if facility doesn't have them
    const defaultOperatingHours = {
      mon: { open: "06:00", close: "23:00", isOpen: true },
      tue: { open: "06:00", close: "23:00", isOpen: true },
      wed: { open: "06:00", close: "23:00", isOpen: true },
      thu: { open: "06:00", close: "23:00", isOpen: true },
      fri: { open: "06:00", close: "23:00", isOpen: true },
      sat: { open: "07:00", close: "23:00", isOpen: true },
      sun: { open: "07:00", close: "22:00", isOpen: true }
    }
    
    // Try to find operating hours in different formats
    let operatingHours = facility.operatingHours?.[dayOfWeek]
    
    if (!operatingHours) {
      // Try with long format
      const longDay = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      operatingHours = facility.operatingHours?.[longDay]
    }
    
    if (!operatingHours) {
      // Try with capitalized format
      const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)
      operatingHours = facility.operatingHours?.[capitalizedDay]
    }
    
    if (!operatingHours) {
      // Use default operating hours
      console.log('Using default operating hours for:', dayOfWeek)
      operatingHours = defaultOperatingHours[dayOfWeek]
    }
    
    console.log('Day operating hours:', operatingHours)
    
    if (!operatingHours || !operatingHours.isOpen) {
      console.log('No operating hours or facility closed for:', dayOfWeek)
      return []
    }
    
    const slots = []
    const openHour = parseInt(operatingHours.open.split(':')[0])
    const closeHour = parseInt(operatingHours.close.split(':')[0])
    
    console.log('Open hour:', openHour, 'Close hour:', closeHour)
    
    // Generate slots from open to close (excluding the last hour to allow for duration)
    for (let hour = openHour; hour < closeHour; hour++) {
      const timeString = hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`
      slots.push({
        value: `${hour.toString().padStart(2, '0')}:00`,
        display: timeString
      })
    }
    
    console.log('Generated slots:', slots)
    return slots
  }

  // Get available dates (next 7 days, excluding past dates)
  const getAvailableDates = () => {
    const dates = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    console.log('Getting available dates. Facility:', facility?.name)
    console.log('Operating hours:', facility?.operatingHours)
    
    // Fallback operating hours if facility doesn't have them
    const defaultOperatingHours = {
      mon: { open: "06:00", close: "23:00", isOpen: true },
      tue: { open: "06:00", close: "23:00", isOpen: true },
      wed: { open: "06:00", close: "23:00", isOpen: true },
      thu: { open: "06:00", close: "23:00", isOpen: true },
      fri: { open: "06:00", close: "23:00", isOpen: true },
      sat: { open: "07:00", close: "23:00", isOpen: true },
      sun: { open: "07:00", close: "22:00", isOpen: true }
    }
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()
      
      // Try to find operating hours in different formats
      let operatingHours = facility?.operatingHours?.[dayOfWeek]
      
      if (!operatingHours) {
        // Try with long format
        const longDay = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        operatingHours = facility?.operatingHours?.[longDay]
      }
      
      if (!operatingHours) {
        // Try with capitalized format
        const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)
        operatingHours = facility?.operatingHours?.[capitalizedDay]
      }
      
      if (!operatingHours) {
        // Use default operating hours
        operatingHours = defaultOperatingHours[dayOfWeek]
      }
      
      console.log(`Day ${i} (${dayOfWeek}):`, operatingHours)
      
      if (operatingHours && operatingHours.isOpen) {
        dates.push({
          date: date,
          day: date.getDate(),
          month: date.getMonth(),
          year: date.getFullYear(),
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          isToday: i === 0
        })
      }
    }
    
    console.log('Available dates:', dates)
    return dates
  }

  // Get month name and year for calendar header
  const getMonthYear = () => {
    return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      newMonth.setMonth(prev.getMonth() - 1)
      return newMonth
    })
  }

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      newMonth.setMonth(prev.getMonth() + 1)
      return newMonth
    })
  }

  // Get calendar days for current month
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Fallback operating hours if facility doesn't have them
    const defaultOperatingHours = {
      mon: { open: "06:00", close: "23:00", isOpen: true },
      tue: { open: "06:00", close: "23:00", isOpen: true },
      wed: { open: "06:00", close: "23:00", isOpen: true },
      thu: { open: "06:00", close: "23:00", isOpen: true },
      fri: { open: "06:00", close: "23:00", isOpen: true },
      sat: { open: "07:00", close: "23:00", isOpen: true },
      sun: { open: "07:00", close: "22:00", isOpen: true }
    }
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()
      
      // Try to find operating hours in different formats
      let operatingHours = facility?.operatingHours?.[dayOfWeek]
      
      if (!operatingHours) {
        // Try with long format
        const longDay = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        operatingHours = facility?.operatingHours?.[longDay]
      }
      
      if (!operatingHours) {
        // Try with capitalized format
        const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)
        operatingHours = facility?.operatingHours?.[capitalizedDay]
      }
      
      if (!operatingHours) {
        // Use default operating hours
        operatingHours = defaultOperatingHours[dayOfWeek]
      }
      
      const isCurrentMonth = date.getMonth() === month
      const isPast = date < today
      const isAvailable = operatingHours && operatingHours.isOpen && !isPast
      const isSelected = bookingData.date === formatDateToLocalString(date)
      
      days.push({
        date: date,
        day: date.getDate(),
        isCurrentMonth,
        isPast,
        isAvailable,
        isSelected,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' })
      })
      
      if (date.getMonth() > month && i > 0) break
    }
    
    return days
  }

  const handleInputChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Reset time if date changes
    if (field === 'date') {
      setBookingData(prev => ({
        ...prev,
        [field]: value,
        startTime: ''
      }))
    }
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
    return facility?.sports?.find(s => s.sport._id === bookingData.sport)
  }

  const getSelectedCourt = () => {
    const sportData = getSelectedSportData()
    return sportData?.courts?.find(c => c.name === bookingData.court)
  }

  const calculateTotal = () => {
    const court = getSelectedCourt()
    return court ? court.hourlyRate * bookingData.duration : 0
  }

  const handleBooking = async () => {
    try {
      // Validate that the selected time slot is still available
      if (!isTimeSlotAvailable(bookingData.startTime)) {
        toast.error('Selected time slot is no longer available. Please choose another time.')
        return
      }

             // Validate players - ensure at least one player with a name
       let validPlayers = bookingData.players.filter(player => player.name && player.name.trim())
       if (validPlayers.length === 0) {
         // Add a default player if none provided
         validPlayers.push({
           name: 'Player 1',
           email: '',
           phone: ''
         })
       }

       // Clean up player data - only include fields that have values
       validPlayers = validPlayers.map(player => {
         const cleanPlayer = { name: player.name.trim() }
         if (player.email && player.email.trim()) {
           cleanPlayer.email = player.email.trim()
         }
         if (player.phone && player.phone.trim()) {
           cleanPlayer.phone = player.phone.trim()
         }
         return cleanPlayer
       })

      setBookingLoading(true)
      const bookingPayload = {
        facility: params.id,
        sport: bookingData.sport,
        court: { name: bookingData.court },
        date: bookingData.date,
        startTime: bookingData.startTime,
        duration: bookingData.duration,
        players: validPlayers,
        specialRequests: bookingData.specialRequests
      }

      console.log('Booking payload:', bookingPayload)
      console.log('Facility ID:', params.id)
      console.log('Selected sport:', bookingData.sport)
      console.log('Selected court:', bookingData.court)
      console.log('Selected date:', bookingData.date)
      console.log('Selected time:', bookingData.startTime)

      const response = await bookingsAPI.createBooking(bookingPayload)
      toast.success('Booking confirmed! You will receive a confirmation email shortly.')
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Booking failed:', error)
      if (error.message?.includes('Time slot is not available')) {
        toast.error('This time slot is no longer available. Please choose another time.')
        // Refresh booked slots
        const response = await bookingsAPI.getFacilityAvailability(params.id, bookingData.date)
        setBookedSlots(response.bookings || [])
      } else {
        toast.error(`Booking failed: ${error.message}`)
      }
    } finally {
      setBookingLoading(false)
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

  const timeSlots = generateTimeSlots(bookingData.date)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

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
                  <span className="text-gray-500 text-sm ml-1">({facility.rating?.count || 0})</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Court Booking</h2>
              
              <div className="space-y-6">
                {/* Sport Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Sport
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
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={bookingData.date ? new Date(bookingData.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : ''}
                      readOnly
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 cursor-pointer"
                      placeholder="Select date"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  
                  {/* Date Picker Popup */}
                  {showDatePicker && (
                    <div className="absolute z-10 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 min-w-[300px]">
                      <div className="flex items-center justify-between mb-4">
                        <button 
                          onClick={goToPreviousMonth}
                          className="text-gray-500 hover:text-gray-700 p-1"
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h3 className="font-medium">{getMonthYear()}</h3>
                        <button 
                          onClick={goToNextMonth}
                          className="text-gray-500 hover:text-gray-700 p-1"
                        >
                          <ArrowLeft className="h-5 w-5 rotate-180" />
                        </button>
                      </div>
                      
                      {/* Quick Date Selection */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Quick Select:</p>
                        <div className="flex flex-wrap gap-2">
                          {getAvailableDates().map((dateInfo) => (
                            <button
                              key={dateInfo.date.toISOString()}
                              onClick={() => {
                                // Fix timezone issue by using local date formatting
                                const year = dateInfo.date.getFullYear()
                                const month = String(dateInfo.date.getMonth() + 1).padStart(2, '0')
                                const day = String(dateInfo.date.getDate()).padStart(2, '0')
                                const localDateString = `${year}-${month}-${day}`
                                handleInputChange('date', localDateString)
                                setShowDatePicker(false)
                              }}
                              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                dateInfo.isToday 
                                  ? 'bg-green-500 text-white border-green-500' 
                                  : 'border-gray-300 hover:border-green-300 hover:bg-green-50'
                              }`}
                            >
                              {dateInfo.dayName} {dateInfo.day}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-sm text-gray-500 py-2 font-medium">{day}</div>
                        ))}
                        {getCalendarDays().map((dayInfo, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              if (dayInfo.isAvailable) {
                                handleInputChange('date', formatDateToLocalString(dayInfo.date))
                                setShowDatePicker(false)
                              }
                            }}
                            disabled={!dayInfo.isAvailable}
                            className={`p-2 text-sm rounded transition-colors ${
                              dayInfo.isSelected
                                ? 'bg-green-500 text-white'
                                : dayInfo.isCurrentMonth && dayInfo.isAvailable
                                ? 'text-gray-700 hover:bg-gray-100'
                                : dayInfo.isCurrentMonth && !dayInfo.isAvailable
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-300 cursor-not-allowed'
                            }`}
                          >
                            {dayInfo.day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Start Time Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={bookingData.startTime ? timeSlots.find(slot => slot.value === bookingData.startTime)?.display || bookingData.startTime : ''}
                      readOnly
                      onClick={() => setShowTimePicker(!showTimePicker)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 cursor-pointer"
                      placeholder="Select time"
                      disabled={!bookingData.date}
                    />
                    <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  
                  {/* Time Picker Popup */}
                  {showTimePicker && timeSlots.length > 0 && (
                    <div className="absolute z-10 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-64">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">Select Time</h4>
                        <button
                          onClick={async () => {
                            try {
                              const response = await bookingsAPI.getFacilityAvailability(params.id, bookingData.date)
                              setBookedSlots(response.bookings || [])
                              toast.success('Availability updated')
                            } catch (error) {
                              toast.error('Failed to refresh availability')
                            }
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 underline"
                        >
                          Refresh
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {getAvailableTimeSlots(bookingData.date).map((slot) => (
                          <button
                            key={slot.value}
                            onClick={() => {
                              handleInputChange('startTime', slot.value)
                              setShowTimePicker(false)
                            }}
                            className={`py-2 px-3 text-sm border rounded-md transition-colors ${
                              bookingData.startTime === slot.value
                                ? 'border-green-500 bg-green-50 text-green-600'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {slot.display}
                          </button>
                        ))}
                      </div>
                      
                      {/* Show booked slots */}
                      {bookedSlots.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs text-gray-500 mb-2">Booked slots:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {bookedSlots.map((booking, index) => (
                              <div
                                key={index}
                                className="py-2 px-3 text-sm border border-red-200 bg-red-50 text-red-600 rounded-md text-center"
                              >
                                {booking.startTime} - {booking.endTime}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!bookingData.date && (
                    <p className="text-sm text-gray-500 mt-1">Please select a date first</p>
                  )}
                  
                  {bookingData.date && timeSlots.length === 0 && (
                    <p className="text-sm text-red-500 mt-1">No available time slots for this date</p>
                  )}
                  
                  {bookingData.date && timeSlots.length > 0 && getAvailableTimeSlots(bookingData.date).length === 0 && (
                    <p className="text-sm text-red-500 mt-1">All time slots are booked for this date</p>
                  )}
                </div>

                {/* Duration Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => handleInputChange('duration', Math.max(1, bookingData.duration - 1))}
                      className="w-10 h-10 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      -
                    </button>
                    <span className="text-lg font-medium min-w-[4rem] text-center">
                      {bookingData.duration} Hour{bookingData.duration > 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => handleInputChange('duration', Math.min(4, bookingData.duration + 1))}
                      className="w-10 h-10 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 text-center">
                    Min: 1 hour, Max: 4 hours
                  </p>
                </div>

                {/* Court Selection */}
                {bookingData.sport && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Court
                    </label>
                    <select
                      value={bookingData.court}
                      onChange={(e) => handleInputChange('court', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">--Select Court--</option>
                      {getSelectedSportData()?.courts?.map((court, index) => (
                        <option key={index} value={court.name}>
                          {court.name} - ₹{court.hourlyRate}/hour
                        </option>
                      ))}
                    </select>
                    
                    {/* Selected Courts Display */}
                    {bookingData.court && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                          <span>{bookingData.court}</span>
                          <button
                            onClick={() => handleInputChange('court', '')}
                            className="text-green-600 hover:text-green-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                                 {/* Player Details */}
                 <div>
                   <div className="flex items-center justify-between mb-3">
                     <label className="block text-sm font-medium text-gray-700">
                       Player Details
                     </label>
                     <button
                       type="button"
                       onClick={addPlayer}
                       disabled={bookingData.players.length >= 4}
                       className="text-sm text-green-600 hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                     >
                       + Add Player
                     </button>
                   </div>
                   
                   <div className="space-y-4">
                     {bookingData.players.map((player, index) => (
                       <div key={index} className="border border-gray-200 rounded-lg p-4">
                         <div className="flex items-center justify-between mb-3">
                           <h4 className="text-sm font-medium text-gray-900">
                             Player {index + 1}
                           </h4>
                           {bookingData.players.length > 1 && (
                             <button
                               type="button"
                               onClick={() => removePlayer(index)}
                               className="text-red-600 hover:text-red-700"
                             >
                               <X className="h-4 w-4" />
                             </button>
                           )}
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                           <div>
                             <label className="block text-xs font-medium text-gray-700 mb-1">
                               Name {index === 0 ? '(Required)' : '(Optional)'}
                             </label>
                             <input
                               type="text"
                               value={player.name}
                               onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                               className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
                               placeholder="Enter player name"
                               required={index === 0}
                             />
                           </div>
                           
                           <div>
                             <label className="block text-xs font-medium text-gray-700 mb-1">
                               Email (Optional)
                             </label>
                             <input
                               type="email"
                               value={player.email}
                               onChange={(e) => handlePlayerChange(index, 'email', e.target.value)}
                               className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-green-500 focus:border-green-500 ${
                                 player.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(player.email)
                                   ? 'border-red-300 bg-red-50'
                                   : 'border-gray-300'
                               }`}
                               placeholder="player@example.com"
                             />
                             {player.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(player.email) && (
                               <p className="text-xs text-red-600 mt-1">Please enter a valid email address</p>
                             )}
                           </div>
                           
                           <div>
                             <label className="block text-xs font-medium text-gray-700 mb-1">
                               Phone (Optional)
                             </label>
                             <input
                               type="tel"
                               value={player.phone}
                               onChange={(e) => handlePlayerChange(index, 'phone', e.target.value)}
                               className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
                               placeholder="+91 9999999999"
                             />
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                   
                   <p className="text-xs text-gray-500 mt-2">
                     Add up to 4 players. At least one player name is required.
                   </p>
                 </div>

                 {/* Special Requests */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Special Requests (Optional)
                   </label>
                   <textarea
                     value={bookingData.specialRequests}
                     onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                     rows={3}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                     placeholder="Any special requirements or notes..."
                     maxLength={500}
                   />
                   <p className="text-xs text-gray-500 mt-1">
                     {bookingData.specialRequests.length}/500 characters
                   </p>
                 </div>

                 {/* Continue to Payment Button */}
                 <div className="pt-6">
                   <button
                     onClick={handleBooking}
                     disabled={!bookingData.sport || !bookingData.court || !bookingData.date || !bookingData.startTime || !bookingData.players[0]?.name?.trim() || bookingLoading}
                     className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {bookingLoading ? 'Booking...' : `Continue to Payment - ₹${calculateTotal()}.00`}
                   </button>
                 </div>
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
                   {bookingData.date && (
                     <div className="flex justify-between">
                       <span className="text-gray-600">Date:</span>
                       <span className="font-medium">
                         {new Date(bookingData.date).toLocaleDateString('en-US', { 
                           weekday: 'short', 
                           month: 'short', 
                           day: 'numeric' 
                         })}
                       </span>
                     </div>
                   )}
                   {bookingData.startTime && (
                     <div className="flex justify-between">
                       <span className="text-gray-600">Time:</span>
                       <span className="font-medium">{bookingData.startTime}</span>
                     </div>
                   )}
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
                   
                   {/* Players Summary */}
                   {bookingData.players.some(player => player.name.trim()) && (
                     <div className="border-t pt-3">
                       <div className="mb-2">
                         <span className="text-gray-600 text-xs font-medium">Players:</span>
                       </div>
                       <div className="space-y-1">
                         {bookingData.players
                           .filter(player => player.name.trim())
                           .map((player, index) => (
                             <div key={index} className="text-xs text-gray-700">
                               <div className="font-medium">{player.name}</div>
                               {player.email && (
                                 <div className="text-gray-500">{player.email}</div>
                               )}
                               {player.phone && (
                                 <div className="text-gray-500">{player.phone}</div>
                               )}
                             </div>
                           ))
                         }
                       </div>
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
