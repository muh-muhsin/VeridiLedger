import React from 'react'
import { RefreshCw } from 'lucide-react'
import { useContract } from '../contexts/ContractContext'

/**
 * PlatformStats component displays real-time platform statistics
 * Shows total credits, retired credits, active credits, and transactions
 */
const PlatformStats: React.FC = () => {
  const { platformStats, refreshPlatformStats } = useContract()

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Platform Statistics</h3>
        <button
          onClick={refreshPlatformStats}
          disabled={platformStats.isLoading}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors duration-200 disabled:opacity-50"
          title="Refresh platform statistics"
        >
          <RefreshCw className={`w-4 h-4 ${platformStats.isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {platformStats.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{platformStats.error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600">
            {platformStats.isLoading ? (
              <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
            ) : (
              platformStats.totalCredits
            )}
          </div>
          <div className="text-sm text-gray-500">Total Credits</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600">
            {platformStats.isLoading ? (
              <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
            ) : (
              platformStats.totalRetired
            )}
          </div>
          <div className="text-sm text-gray-500">Credits Retired</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600">
            {platformStats.isLoading ? (
              <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
            ) : (
              platformStats.activeCredits
            )}
          </div>
          <div className="text-sm text-gray-500">Active Credits</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600">
            {platformStats.isLoading ? (
              <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
            ) : (
              platformStats.totalCredits
            )}
          </div>
          <div className="text-sm text-gray-500">Total Transactions</div>
        </div>
      </div>

      {!platformStats.isLoading && platformStats.totalCredits === 0 && !platformStats.error && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-500 text-sm">
            No carbon credits have been originated yet. Connect your wallet and start tracking carbon credits!
          </p>
        </div>
      )}
    </div>
  )
}

export default PlatformStats
