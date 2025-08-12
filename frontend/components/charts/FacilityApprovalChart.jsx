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
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { useState } from 'react'

// Register the scales we need for Chart.js v4
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export default function FacilityApprovalChart({ data, period }) {
  const [chartType, setChartType] = useState('line')

  if (!data || !data.facilityApproval) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">No facility approval data available</div>
      </div>
    )
  }

  const chartData = {
    labels: data.facilityApproval.map(item => {
      const date = new Date(item._id)
      return date.toLocaleDateString('en-IN', { 
        month: 'short', 
        day: 'numeric' 
      })
    }),
    datasets: [
      {
        label: 'Approved',
        data: data.facilityApproval.map(item => item.approved),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Rejected',
        data: data.facilityApproval.map(item => item.rejected),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Pending',
        data: data.facilityApproval.map(item => item.pending),
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        tension: 0.1,
      },
    ],
  }

  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        type: 'category',
        display: true,
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        type: 'linear',
        display: true,
        title: {
          display: true,
          text: 'Number of Facilities',
        },
        beginAtZero: true,
      },
    },
    plugins: {
      title: {
        display: true,
        text: `Facility Approval Trends - ${period}`,
      },
      legend: {
        display: true,
        position: 'top',
      },
    },
  }

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return <Line data={chartData} options={options} />
      case 'bar':
        return <Bar data={chartData} options={options} />
      default:
        return <Line data={chartData} options={options} />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Facility Approval Trends</h3>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Chart Type:</label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="line">Line</option>
            <option value="bar">Bar</option>
          </select>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Total Approved</div>
            <div className="text-lg font-bold text-green-700">
              {data.facilityApproval.reduce((sum, item) => sum + item.approved, 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-sm text-red-600 font-medium">Total Rejected</div>
            <div className="text-lg font-bold text-red-700">
              {data.facilityApproval.reduce((sum, item) => sum + item.rejected, 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-sm text-orange-600 font-medium">Total Pending</div>
            <div className="text-lg font-bold text-orange-700">
              {data.facilityApproval.reduce((sum, item) => sum + item.pending, 0).toLocaleString('en-IN')}
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
