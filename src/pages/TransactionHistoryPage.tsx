import React from 'react'
import TransactionHistory from '../components/TransactionHistory'

/**
 * Transaction History Page Component
 * Dedicated page for viewing comprehensive transaction history
 */
const TransactionHistoryPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <TransactionHistory />
    </div>
  )
}

export default TransactionHistoryPage
