import React from 'react'
import { Wallet, Coins, Leaf, Activity, RefreshCw } from 'lucide-react'
import { useWallet } from '../contexts/WalletContext'
import { useContract } from '../contexts/ContractContext'

/**
 * UserDashboard component displays user-specific information when wallet is connected
 * Shows wallet balance, owned credits, and recent activity
 */
const UserDashboard: React.FC = () => {
  const { isConnected, stxAddress, userData } = useWallet()
  const { userCredits, refreshUserCredits } = useContract()

  // Don't render if wallet is not connected
  if (!isConnected || !stxAddress) {
    return null
  }

  /**
   * Format STX address for display
   */
  const formatAddress = (address: string): string => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`
  }

  /**
   * Get user display name
   */
  const getUserDisplayName = (): string => {
    if (userData?.username) {
      return userData.username
    }
    return formatAddress(stxAddress)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">My Dashboard</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={refreshUserCredits}
            disabled={userCredits.isLoading}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors duration-200 disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${userCredits.isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Connected to Testnet</span>
          </div>
        </div>
      </div>

      {/* User Info Section */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Wallet Information</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Wallet className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Address</span>
              </div>
              <span className="text-sm text-gray-900 font-mono">
                {formatAddress(stxAddress)}
              </span>
            </div>

            {userData?.username && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Activity className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">BNS Name</span>
                </div>
                <span className="text-sm text-gray-900">
                  {userData.username}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Coins className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">STX Balance</span>
              </div>
              <span className="text-sm text-gray-900">
                Loading...
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Carbon Credits</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Leaf className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Owned Credits</span>
              </div>
              <span className="text-sm text-gray-900 font-semibold">
                {userCredits.isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : userCredits.error ? (
                  <span className="text-red-500">Error</span>
                ) : (
                  userCredits.ownedCredits
                )}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Leaf className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Retired Credits</span>
              </div>
              <span className="text-sm text-gray-900 font-semibold">
                {userCredits.isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : userCredits.error ? (
                  <span className="text-red-500">Error</span>
                ) : (
                  userCredits.retiredCredits
                )}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Total Transactions</span>
              </div>
              <span className="text-sm text-gray-900 font-semibold">
                {userCredits.isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  userCredits.ownedCredits + userCredits.retiredCredits
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No recent activity</p>
          <p className="text-gray-400 text-xs mt-1">
            Your carbon credit transactions will appear here
          </p>
        </div>
      </div>
    </div>
  )
}

export default UserDashboard
