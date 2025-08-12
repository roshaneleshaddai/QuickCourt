'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { useState } from 'react'

// Register the scales we need for Chart.js v4
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export default function SportsActivityChart({ data, period }) {
  const [chartType, setChartType] = useState('bar')

  if (!data || !data.sportsActivity) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">No sports activity data available</div>
      </div>
    )
  }

  const chartData = {
    labels: data.sportsActivity.map(item => item.sport),
    datasets: [
      {
        label: 'Total Bookings',
        data: data.sportsActivity.map(item => item.bookingCount),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(251, 146, 60)',
          'rgb(168, 85, 247)',
          'rgb(236, 72, 153)',
        ],
        borderWidth: 1,
      },
      {
        label: 'Facility Count',
        data: data.sportsActivity.map(item => item.facilityCount),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const doughnutData = {
    labels: data.sportsActivity.map(item => item.sport),
    datasets: [
      {
        data: data.sportsActivity.map(item => item.bookingCount),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(251, 146, 60)',
          'rgb(168, 85, 247)',
          'rgb(236, 72, 153)',
        ],
        borderWidth: 2,
      },
    ],
  }

  const barOptions = {
    responsive: true,
    scales: {
      x: {
        type: 'category',
        display: true,
        title: {
          display: true,
          text: 'Sports',
        },
      },
      y: {
        type: 'linear',
        display: true,
        title: {
          display: true,
          text: 'Count',
        },
        beginAtZero: true,
      },
    },
    plugins: {
      title: {
        display: true,
        text: `Most Active Sports - ${period}`,
      },
      legend: {
        display: true,
        position: 'top',
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `Sports Activity Distribution - ${period}`,
      },
      legend: {
        display: true,
        position: 'right',
      },
    },
  }

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return <Bar data={chartData} options={barOptions} />
      case 'doughnut':
        return <Doughnut data={doughnutData} options={doughnutOptions} />
      default:
        return <Bar data={chartData} options={barOptions} />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Most Active Sports</h3>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Chart Type:</label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="bar">Bar</option>
            <option value="doughnut">Doughnut</option>
          </select>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Most Popular Sport</div>
            <div className="text-lg font-bold text-blue-700">
              {data.sportsActivity[0]?.sport || 'N/A'}
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Total Bookings</div>
            <div className="text-lg font-bold text-green-700">
              {data.sportsActivity.reduce((sum, item) => sum + item.bookingCount, 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">Total Facilities</div>
            <div className="text-lg font-bold text-purple-700">
              {data.sportsActivity.reduce((sum, item) => sum + item.facilityCount, 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      <div className="h-80">
        {renderChart()}
      </div>
    </div>
  )
}
