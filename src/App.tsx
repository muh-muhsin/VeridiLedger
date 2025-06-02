import React from 'react'
import { Leaf, Shield, BarChart3, RefreshCw } from 'lucide-react'
import { WalletProvider } from './contexts/WalletContext'
import { ContractProvider } from './contexts/ContractContext'
import WalletConnection from './components/WalletConnection'
import UserDashboard from './components/UserDashboard'
import PlatformStats from './components/PlatformStats'
import RecentTransactions from './components/RecentTransactions'

/**
 * Main App component for VeridiLedger
 * A transparent Carbon Credit Tracking platform on the Stacks ecosystem
 */
function App() {
  return (
    <WalletProvider>
      <ContractProvider>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">VeridiLedger</h1>
                  <p className="text-sm text-gray-500">Carbon Credit Tracking</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <WalletConnection />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* User Dashboard (shown when wallet is connected) */}
          <UserDashboard />

          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Transparent Carbon Credit Tracking
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Track, verify, and manage carbon credits on the Stacks blockchain with complete transparency and security.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="card text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure & Transparent</h3>
              <p className="text-gray-600">
                Built on Stacks blockchain with Clarity smart contracts for maximum security and transparency.
              </p>
            </div>

            <div className="card text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mx-auto mb-4">
                <Leaf className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Carbon Credits</h3>
              <p className="text-gray-600">
                Track origination, transfers, and retirement of carbon credits with comprehensive metadata.
              </p>
            </div>

            <div className="card text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
              <p className="text-gray-600">
                Real-time analytics and reporting for carbon credit trading and retirement activities.
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <PlatformStats />

          {/* Recent Transactions Section */}
          <div className="mt-8">
            <RecentTransactions />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-500">
              <p>&copy; 2024 VeridiLedger. Built on Stacks blockchain.</p>
            </div>
          </div>
        </footer>
        </div>
      </ContractProvider>
    </WalletProvider>
  )
}

export default App
