import React from 'react'
import { Wallet, LogOut, AlertCircle, Loader2 } from 'lucide-react'
import { useWallet } from '../contexts/WalletContext'

/**
 * WalletConnection component handles wallet connection UI and state
 * Displays different states: disconnected, connecting, connected, error
 */
const WalletConnection: React.FC = () => {
  const {
    isConnected,
    isLoading,
    error,
    stxAddress,
    userData,
    connectWallet,
    disconnectWallet,
  } = useWallet()

  /**
   * Truncate address for display
   * Shows first 6 and last 4 characters with ellipsis
   */
  const truncateAddress = (address: string): string => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  /**
   * Get display name from user data
   * Falls back to truncated address if no BNS name
   */
  const getDisplayName = (): string => {
    if (userData?.username) {
      return userData.username
    }
    if (stxAddress) {
      return truncateAddress(stxAddress)
    }
    return 'Unknown'
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center space-x-2 text-red-600">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">{error}</span>
        <button
          onClick={connectWallet}
          className="text-sm text-red-600 hover:text-red-700 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Connecting...</span>
      </div>
    )
  }

  // Connected state
  if (isConnected && stxAddress) {
    return (
      <div className="flex items-center space-x-3">
        {/* User info */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <Wallet className="w-4 h-4 text-primary-600" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-gray-900">
              {getDisplayName()}
            </div>
            <div className="text-xs text-gray-500">
              {truncateAddress(stxAddress)}
            </div>
          </div>
        </div>

        {/* Disconnect button */}
        <button
          onClick={disconnectWallet}
          className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors duration-200"
          title="Disconnect wallet"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Disconnect</span>
        </button>
      </div>
    )
  }

  // Disconnected state
  return (
    <button
      onClick={connectWallet}
      className="btn-primary flex items-center space-x-2"
      disabled={isLoading}
    >
      <Wallet className="w-4 h-4" />
      <span>Connect Wallet</span>
    </button>
  )
}

export default WalletConnection
