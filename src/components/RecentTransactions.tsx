import React, { useState, useEffect } from 'react'
import { Activity, ArrowRight, Leaf, RefreshCw } from 'lucide-react'

/**
 * Transaction interface
 */
interface Transaction {
  id: string
  type: 'origination' | 'transfer' | 'retirement'
  creditId: number
  from: string | null
  to: string
  timestamp: string
  blockHeight: number
}

/**
 * RecentTransactions component displays the latest platform transactions
 * Shows origination, transfer, and retirement activities
 */
const RecentTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch recent transactions from API
   */
  const fetchTransactions = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // For now, use mock data since API endpoints are stubs
      const mockTransactions: Transaction[] = [
        {
          id: 'tx1',
          type: 'origination',
          creditId: 1,
          from: null,
          to: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          blockHeight: 12345
        },
        {
          id: 'tx2',
          type: 'transfer',
          creditId: 1,
          from: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          to: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          blockHeight: 12346
        },
        {
          id: 'tx3',
          type: 'retirement',
          creditId: 1,
          from: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
          to: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          blockHeight: 12347
        }
      ]

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      setTransactions(mockTransactions)
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError('Failed to load recent transactions')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Load transactions on component mount
   */
  useEffect(() => {
    fetchTransactions()
  }, [])

  /**
   * Format address for display
   */
  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`
  }

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  /**
   * Get transaction type icon and color
   */
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'origination':
        return <Leaf className="w-4 h-4 text-green-600" />
      case 'transfer':
        return <ArrowRight className="w-4 h-4 text-blue-600" />
      case 'retirement':
        return <Activity className="w-4 h-4 text-red-600" />
      default:
        return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  /**
   * Get transaction description
   */
  const getTransactionDescription = (tx: Transaction): string => {
    switch (tx.type) {
      case 'origination':
        return `Credit #${tx.creditId} originated to ${formatAddress(tx.to)}`
      case 'transfer':
        return `Credit #${tx.creditId} transferred from ${formatAddress(tx.from!)} to ${formatAddress(tx.to)}`
      case 'retirement':
        return `Credit #${tx.creditId} retired by ${formatAddress(tx.from!)}`
      default:
        return `Unknown transaction type`
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Platform Transactions</h3>
        <button
          onClick={fetchTransactions}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors duration-200 disabled:opacity-50"
          title="Refresh transactions"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full border border-gray-200">
                {getTransactionIcon(tx.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {getTransactionDescription(tx)}
                </p>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(tx.timestamp)}
                  </span>
                  <span className="text-xs text-gray-500">
                    Block #{tx.blockHeight}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  tx.type === 'origination' ? 'bg-green-100 text-green-800' :
                  tx.type === 'transfer' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {tx.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No recent transactions</p>
          <p className="text-gray-400 text-xs mt-1">
            Platform transactions will appear here as they occur
          </p>
        </div>
      )}
    </div>
  )
}

export default RecentTransactions
