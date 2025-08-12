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
  Filler,
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
  Legend,
  Filler
)

export default function EarningsChart({ data, period }) {
  const [chartType, setChartType] = useState('line')

  if (!data || !data.earningsData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">No earnings data available</div>
      </div>
    )
  }

  const chartData = {
    labels: data.earningsData.map(item => {
      const date = new Date(item._id)
      return date.toLocaleDateString('en-IN', { 
        month: 'short', 
        day: 'numeric' 
      })
    }),
    datasets: [
      {
        label: 'Daily Earnings (₹)',
        data: data.earningsData.map(item => item.dailyEarnings),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.1,
        yAxisID: 'y',
      },
      {
        label: 'Cumulative Earnings (₹)',
        data: data.earningsData.map(item => item.cumulativeEarnings),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
        yAxisID: 'y1',
        fill: true,
      },
      {
        label: 'Average Booking Value (₹)',
        data: data.earningsData.map(item => item.averageBookingValue),
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        tension: 0.1,
        yAxisID: 'y',
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
        position: 'left',
        title: {
          display: true,
          text: 'Daily Earnings & Avg Booking (₹)',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Cumulative Earnings (₹)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: `Earnings Simulation - ${period}`,
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
        <h3 className="text-lg font-semibold text-gray-900">Earnings Simulation</h3>
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
            <div className="text-sm text-green-600 font-medium">Total Period Earnings</div>
            <div className="text-lg font-bold text-green-700">
              ₹{data.earningsData.reduce((sum, item) => sum + item.dailyEarnings, 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Average Daily Earnings</div>
            <div className="text-lg font-bold text-blue-700">
              ₹{(data.earningsData.reduce((sum, item) => sum + item.dailyEarnings, 0) / data.earningsData.length).toFixed(0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-sm text-orange-600 font-medium">Peak Daily Earnings</div>
            <div className="text-lg font-bold text-orange-700">
              ₹{Math.max(...data.earningsData.map(item => item.dailyEarnings)).toLocaleString('en-IN')}
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
