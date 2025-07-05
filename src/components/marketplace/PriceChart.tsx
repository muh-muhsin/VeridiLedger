import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { PriceHistoryEntry } from '../../utils/contractUtils'
import { 
  formatStxAmount, 
  calculatePriceChange, 
  formatPriceChange, 
  getPriceChangeColor,
  getTransactionTypeDisplay,
  getTransactionTypeColor,
  formatTimestamp 
} from '../../utils/marketplaceUtils'

interface PriceChartProps {
  tokenId: number
  priceHistory: PriceHistoryEntry[]
  className?: string
}

/**
 * PriceChart component for displaying carbon credit price history
 * Note: This is a simplified version. In production, you'd want to use a proper charting library like Chart.js or Recharts
 */
const PriceChart: React.FC<PriceChartProps> = ({
  tokenId,
  priceHistory,
  className = ''
}) => {
  const [selectedEntry, setSelectedEntry] = useState<PriceHistoryEntry | null>(null)

  if (priceHistory.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Price History</h3>
          <p className="text-gray-600">
            Price history will appear here once the credit has marketplace activity.
          </p>
        </div>
      </div>
    )
  }

  // Calculate price change from first to last entry
  const firstPrice = priceHistory[priceHistory.length - 1]?.priceUstx || 0
  const lastPrice = priceHistory[0]?.priceUstx || 0
  const priceChange = calculatePriceChange(firstPrice, lastPrice)

  // Get min and max prices for scaling
  const prices = priceHistory.map(entry => entry.priceUstx)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Price History - Credit #{tokenId}
          </h3>
          <div className="flex items-center mt-1">
            <span className="text-2xl font-bold text-gray-900 mr-3">
              {formatStxAmount(lastPrice)}
            </span>
            <div className={`flex items-center ${getPriceChangeColor(priceChange)}`}>
              {priceChange >= 0 ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              <span className="text-sm font-medium">
                {formatPriceChange(priceChange)}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Transactions</p>
          <p className="text-xl font-semibold text-gray-900">{priceHistory.length}</p>
        </div>
      </div>

      {/* Simple Line Chart */}
      <div className="mb-6">
        <div className="relative h-32 bg-gray-50 rounded-lg p-4">
          <svg className="w-full h-full" viewBox="0 0 400 100">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Price line */}
            {priceHistory.length > 1 && (
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                points={priceHistory
                  .map((entry, index) => {
                    const x = (index / (priceHistory.length - 1)) * 380 + 10
                    const y = priceRange > 0 
                      ? 90 - ((entry.priceUstx - minPrice) / priceRange) * 80
                      : 50
                    return `${x},${y}`
                  })
                  .join(' ')}
              />
            )}
            
            {/* Data points */}
            {priceHistory.map((entry, index) => {
              const x = (index / Math.max(priceHistory.length - 1, 1)) * 380 + 10
              const y = priceRange > 0 
                ? 90 - ((entry.priceUstx - minPrice) / priceRange) * 80
                : 50
              
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#2563eb"
                  className="cursor-pointer hover:r-6 transition-all"
                  onClick={() => setSelectedEntry(entry)}
                />
              )
            })}
          </svg>
          
          {/* Price labels */}
          <div className="absolute left-0 top-0 text-xs text-gray-500">
            {formatStxAmount(maxPrice)}
          </div>
          <div className="absolute left-0 bottom-0 text-xs text-gray-500">
            {formatStxAmount(minPrice)}
          </div>
        </div>
      </div>

      {/* Selected Entry Details */}
      {selectedEntry && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Transaction Details</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-blue-700">Price:</span>
              <p className="font-medium text-blue-900">{formatStxAmount(selectedEntry.priceUstx)}</p>
            </div>
            <div>
              <span className="text-blue-700">Type:</span>
              <p className={`font-medium ${getTransactionTypeColor(selectedEntry.transactionType)}`}>
                {getTransactionTypeDisplay(selectedEntry.transactionType)}
              </p>
            </div>
            <div>
              <span className="text-blue-700">Block:</span>
              <p className="font-medium text-blue-900">{selectedEntry.timestamp}</p>
            </div>
            <div>
              <span className="text-blue-700">Date:</span>
              <p className="font-medium text-blue-900">{formatTimestamp(selectedEntry.timestamp)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Table */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Block
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {priceHistory.slice(0, 5).map((entry, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getTransactionTypeColor(entry.transactionType)}`}>
                      {getTransactionTypeDisplay(entry.transactionType)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {formatStxAmount(entry.priceUstx)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {entry.timestamp}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formatTimestamp(entry.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {priceHistory.length > 5 && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            Showing 5 of {priceHistory.length} transactions
          </p>
        )}
      </div>
    </div>
  )
}

export default PriceChart
