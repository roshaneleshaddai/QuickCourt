import React from 'react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-green-400 mb-2">
            QuickCourt
          </h3>
          <p className="text-gray-300 text-sm">
            Find your perfect sports venue
          </p>
        </div>
        
        <div className="flex justify-center space-x-8 mb-6">
          <Link href="/facilities" className="text-gray-300 hover:text-green-400 text-sm">
            Venues
          </Link>
          <Link href="/sports" className="text-gray-300 hover:text-green-400 text-sm">
            Sports
          </Link>
          <Link href="/about" className="text-gray-300 hover:text-green-400 text-sm">
            About
          </Link>
        </div>
        
        <div className="border-t border-gray-700 pt-4">
          <p className="text-gray-400 text-xs">
            &copy; 2025 QuickCourt. Made with 💚 for sports enthusiasts.
          </p>
        </div>
      </div>
    </footer>
  )
}