'use client'

import { useEffect, useState } from 'react'
import { MapPin, ExternalLink } from 'lucide-react'

export default function GoogleMap({ coordinates, facilityName, address }) {
  const [mapContainer, setMapContainer] = useState(null)
  const [mapError, setMapError] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (!mapContainer) return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      console.error('Invalid API key')
      setMapError(true)
      return
    }

    if (!coordinates?.coordinates || coordinates.coordinates.length !== 2) {
      console.error('Invalid coordinates')
      setMapError(true)
      return
    }

    const [lng, lat] = coordinates.coordinates

    // Simple direct initialization
    const loadMap = () => {
      try {
        const map = new google.maps.Map(mapContainer, {
          center: { lat, lng },
          zoom: 15,
          disableDefaultUI: false
        })

        new google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: facilityName || 'Location'
        })

        setMapLoaded(true)
      } catch (error) {
        console.error('Map creation failed:', error)
        setMapError(true)
      }
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      loadMap()
    } else {
      // Load Google Maps script
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
      script.async = true
      script.onload = loadMap
      script.onerror = () => setMapError(true)
      document.head.appendChild(script)
    }
  }, [mapContainer, coordinates, facilityName])

  const formatAddress = () => {
    if (!address) return 'Address not available'
    const parts = []
    if (address.street) parts.push(address.street)
    if (address.city) parts.push(address.city)
    if (address.state) parts.push(address.state)
    if (address.zipCode) parts.push(address.zipCode)
    return parts.join(', ')
  }

  const lat = coordinates?.coordinates?.[1]
  const lng = coordinates?.coordinates?.[0]

  // If there's an error or no API key, show the nice fallback
  if (mapError || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="w-full h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-4">
        <div className="h-full flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {facilityName || 'Location'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatAddress()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              📍 {lat?.toFixed(4)}, {lng?.toFixed(4)}
            </span>
            {lat && lng && (
              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
              >
                View on Maps
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render the map container
  return (
    <div className="w-full h-32 bg-gray-200 rounded-lg overflow-hidden relative">
      <div 
        ref={setMapContainer}
        className="w-full h-full"
      />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
            <span className="text-xs text-gray-600">Loading map...</span>
          </div>
        </div>
      )}
    </div>
  )
}