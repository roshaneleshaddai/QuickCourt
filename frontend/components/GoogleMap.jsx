'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'

export default function GoogleMap({ coordinates, facilityName, address }) {
  const mapRef = useRef(null)
  const [map, setMap] = useState(null)
  const [marker, setMarker] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Check if API key is available
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    console.log('Google Maps API Key check:', {
      hasKey: !!apiKey,
      keyLength: apiKey?.length,
      keyValue: apiKey ? `${apiKey.substring(0, 10)}...` : 'none'
    })
    
    if (!apiKey || 
        apiKey === 'your_google_maps_api_key_here' ||
        apiKey === '' ||
        apiKey === 'undefined') {
      console.log('Google Maps API key not configured, showing fallback')
      setError('Google Maps API key not configured')
      setLoading(false)
      return
    }

    // Function to load Google Maps API
    const loadGoogleMapsAPI = () => {
      return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
          resolve(window.google.maps)
          return
        }

        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
        script.async = true
        script.defer = true
        
        script.onload = () => {
          if (window.google && window.google.maps) {
            resolve(window.google.maps)
          } else {
            reject(new Error('Google Maps failed to load'))
          }
        }
        
        script.onerror = () => {
          reject(new Error('Failed to load Google Maps API'))
        }
        
        document.head.appendChild(script)
      })
    }

    // Initialize map
    const initializeMap = async () => {
      try {
        // Wait for the DOM element to be available
        if (!mapRef.current) {
          console.log('Map ref not ready, waiting...')
          return
        }

        if (!coordinates || !coordinates.coordinates || coordinates.coordinates.length !== 2) {
          throw new Error('Invalid coordinates')
        }

        const maps = await loadGoogleMapsAPI()
        const [lng, lat] = coordinates.coordinates

        // Double-check that the DOM element exists
        if (!mapRef.current) {
          throw new Error('Map container element not found')
        }

        // Create map instance
        const mapInstance = new maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom: 15,
          mapTypeId: maps.MapTypeId.ROADMAP,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        })

        // Create marker
        const markerInstance = new maps.Marker({
          position: { lat, lng },
          map: mapInstance,
          title: facilityName || 'Facility Location',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="#10B981"/>
                <circle cx="16" cy="16" r="8" fill="white"/>
                <circle cx="16" cy="16" r="4" fill="#10B981"/>
              </svg>
            `),
            scaledSize: new maps.Size(32, 32),
            anchor: new maps.Point(16, 16)
          }
        })

        // Create info window
        const infoWindow = new maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 200px;">
              <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #111827;">
                ${facilityName || 'Facility'}
              </h3>
              <p style="margin: 0; font-size: 12px; color: #6B7280;">
                ${address?.street || ''} ${address?.city || ''}, ${address?.state || ''}
              </p>
            </div>
          `
        })

        // Add click listener to marker
        markerInstance.addListener('click', () => {
          infoWindow.open(mapInstance, markerInstance)
        })

        // Add click listener to map to close info window
        mapInstance.addListener('click', () => {
          infoWindow.close()
        })

        setMap(mapInstance)
        setMarker(markerInstance)
        setLoading(false)

      } catch (err) {
        console.error('Error initializing map:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    // Use a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initializeMap()
    }, 100)

    // Add a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Google Maps loading timeout, showing fallback')
        setError('Google Maps loading timeout')
        setLoading(false)
      }
    }, 10000) // 10 second timeout

    // Cleanup function
    return () => {
      clearTimeout(timer)
      clearTimeout(loadingTimeout)
      if (marker) {
        if (window.google && window.google.maps) {
          window.google.maps.event.clearInstanceListeners(marker)
        }
      }
      if (map) {
        if (window.google && window.google.maps) {
          window.google.maps.event.clearInstanceListeners(map)
        }
      }
    }
  }, [coordinates, facilityName, address, mounted])

  // Format address for display
  const formatAddress = () => {
    if (!address) return 'Address not available'
    
    const parts = []
    if (address.street) parts.push(address.street)
    if (address.city) parts.push(address.city)
    if (address.state) parts.push(address.state)
    if (address.zipCode) parts.push(address.zipCode)
    
    return parts.length > 0 ? parts.join(', ') : 'Address not available'
  }

  if (loading) {
    return (
      <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
          <span className="text-gray-600">Loading map...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm font-medium mb-1">Location</p>
          <p className="text-gray-500 text-xs px-2 leading-relaxed">
            {formatAddress()}
          </p>
          <div className="mt-2 text-xs text-gray-400">
            <p>📍 {facilityName || 'Facility'}</p>
            {coordinates?.coordinates && (
              <p className="mt-1">
                Coordinates: {coordinates.coordinates[1].toFixed(4)}, {coordinates.coordinates[0].toFixed(4)}
              </p>
            )}
          </div>
          {error === 'Google Maps API key not configured' && (
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-600">
              <p>💡 To enable interactive maps, configure your Google Maps API key</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}
