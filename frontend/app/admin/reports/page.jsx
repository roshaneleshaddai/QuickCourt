'use client'

import { useState } from 'react'
import { AlertTriangle, FileText, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function AdminReports() {
  const [reports] = useState([]) // Placeholder for future reports

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reports & Moderation
          </h1>
          <p className="text-gray-600">
            Manage user-submitted reports and moderation actions
          </p>
        </div>

        {/* Placeholder Content */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              User Reports
            </h3>
          </div>
          
          <div className="p-6 text-center">
            <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Reports System Coming Soon
            </h3>
            <p className="text-gray-600 mb-4">
              The reports and moderation system is currently under development.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
              <div className="flex items-center justify-center">
                <FileText className="h-5 w-5 mr-2" />
                Report Management
              </div>
              <div className="flex items-center justify-center">
                <Clock className="h-5 w-5 mr-2" />
                Moderation Actions
              </div>
              <div className="flex items-center justify-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Resolution Tracking
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
