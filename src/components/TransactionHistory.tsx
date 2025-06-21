import React, { useState, useEffect, useMemo } from 'react'
import {
  Activity,
  ArrowRight,
  Leaf,
  RefreshCw,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpDown,
  FileText,
  ExternalLink
} from 'lucide-react'
import { useWallet } from '../contexts/WalletContext'
import { format } from 'date-fns'

/**
 * Enhanced Transaction interface with comprehensive data
 */
interface Transaction {
  id: string
  type: 'origination' | 'transfer' | 'retirement'
  creditId: number
  from: string | null
  to: string
  timestamp: string
  blockHeight: number
  status: 'pending' | 'confirmed' | 'failed'
  amount?: number
  fee?: number
  txHash?: string
  metadata?: {
    projectId?: string
    methodology?: string
    quantity?: number
    retirementReason?: string
  }
}

/**
 * Transaction filter interface
 */
interface TransactionFilter {
  type: 'all' | 'origination' | 'transfer' | 'retirement'
  status: 'all' | 'pending' | 'confirmed' | 'failed'
  dateRange: 'all' | '24h' | '7d' | '30d' | 'custom'
  customStartDate?: string
  customEndDate?: string
  searchTerm?: string
}

/**
 * Pagination interface
 */
interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  startIndex: number
  endIndex: number
}

/**
 * TransactionHistory component provides comprehensive transaction management
 * Features: filtering, pagination, sorting, search, and export functionality
 */
const TransactionHistory: React.FC = () => {
  const { isConnected, stxAddress } = useWallet()

  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter and search state
  const [filters, setFilters] = useState<TransactionFilter>({
    type: 'all',
    status: 'all',
    dateRange: 'all',
    searchTerm: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Sort state
  const [sortBy, setSortBy] = useState<'timestamp' | 'type' | 'status' | 'amount'>('timestamp')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  /**
   * Fetch transactions from API or blockchain
   */
  const fetchTransactions = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Enhanced mock data with more comprehensive transaction details
      const mockTransactions: Transaction[] = [
        {
          id: 'tx_001',
          type: 'origination',
          creditId: 1,
          from: null,
          to: stxAddress || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          blockHeight: 12345,
          status: 'confirmed',
          amount: 100,
          fee: 0.001,
          txHash: '0x1234567890abcdef',
          metadata: {
            projectId: 'PROJ-001',
            methodology: 'Verified Carbon Standard',
            quantity: 100
          }
        },
        {
          id: 'tx_002',
          type: 'transfer',
          creditId: 1,
          from: stxAddress || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          to: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
          timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
          blockHeight: 12346,
          status: 'confirmed',
          amount: 50,
          fee: 0.0005,
          txHash: '0xabcdef1234567890'
        },
        {
          id: 'tx_003',
          type: 'retirement',
          creditId: 1,
          from: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
          to: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
          timestamp: new Date(Date.now() - 21600000).toISOString(), // 6 hours ago
          blockHeight: 12347,
          status: 'confirmed',
          amount: 25,
          fee: 0.0003,
          txHash: '0x567890abcdef1234',
          metadata: {
            retirementReason: 'Corporate carbon neutrality program'
          }
        },
        {
          id: 'tx_004',
          type: 'transfer',
          creditId: 2,
          from: stxAddress || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          to: 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP',
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          blockHeight: 12348,
          status: 'pending',
          amount: 75,
          fee: 0.0008,
          txHash: '0x890abcdef1234567'
        }
      ]

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      setTransactions(mockTransactions)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setError('Failed to load transaction history')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Filter and sort transactions based on current filters and sort settings
   */
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions]

    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(tx => tx.type === filters.type)
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(tx => tx.status === filters.status)
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (filters.dateRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'custom':
          if (filters.customStartDate) {
            startDate = new Date(filters.customStartDate)
            const endDate = filters.customEndDate ? new Date(filters.customEndDate) : now
            filtered = filtered.filter(tx => {
              const txDate = new Date(tx.timestamp)
              return txDate >= startDate && txDate <= endDate
            })
          }
          break
        default:
          startDate = new Date(0)
      }

      if (filters.dateRange !== 'custom') {
        filtered = filtered.filter(tx => new Date(tx.timestamp) >= startDate)
      }
    }

    // Apply search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(tx =>
        tx.id.toLowerCase().includes(searchLower) ||
        tx.type.toLowerCase().includes(searchLower) ||
        tx.txHash?.toLowerCase().includes(searchLower) ||
        tx.metadata?.projectId?.toLowerCase().includes(searchLower) ||
        tx.metadata?.methodology?.toLowerCase().includes(searchLower)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime()
          bValue = new Date(b.timestamp).getTime()
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'amount':
          aValue = a.amount || 0
          bValue = b.amount || 0
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [transactions, filters, sortBy, sortOrder])

  /**
   * Calculate pagination information
   */
  const paginationInfo = useMemo((): PaginationInfo => {
    const totalItems = filteredAndSortedTransactions.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems)

    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      startIndex,
      endIndex
    }
  }, [filteredAndSortedTransactions.length, currentPage, itemsPerPage])

  /**
   * Get paginated transactions for current page
   */
  const paginatedTransactions = useMemo(() => {
    const { startIndex, endIndex } = paginationInfo
    return filteredAndSortedTransactions.slice(startIndex, endIndex)
  }, [filteredAndSortedTransactions, paginationInfo])

  /**
   * Handle filter changes
   */
  const handleFilterChange = (key: keyof TransactionFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  /**
   * Handle sort changes
   */
  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setCurrentPage(1)
  }

  /**
   * Export transactions to CSV
   */
  const exportToCSV = () => {
    const headers = ['ID', 'Type', 'Credit ID', 'From', 'To', 'Amount', 'Status', 'Timestamp', 'Block Height', 'Fee', 'TX Hash']
    const csvData = filteredAndSortedTransactions.map(tx => [
      tx.id,
      tx.type,
      tx.creditId,
      tx.from || 'N/A',
      tx.to,
      tx.amount || 'N/A',
      tx.status,
      format(new Date(tx.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      tx.blockHeight,
      tx.fee || 'N/A',
      tx.txHash || 'N/A'
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `veridiledger-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * Get transaction type icon
   */
  const getTransactionIcon = (type: Transaction['type']) => {
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
   * Get status icon
   */
  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  /**
   * Format address for display
   */
  const formatAddress = (address: string | null): string => {
    if (!address) return 'N/A'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string): string => {
    return format(new Date(timestamp), 'MMM dd, yyyy HH:mm')
  }

  // Load transactions on component mount and when wallet connection changes
  useEffect(() => {
    if (isConnected) {
      fetchTransactions()
    }
  }, [isConnected])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters, sortBy, sortOrder])

  // Don't render if wallet is not connected
  if (!isConnected) {
    return (
      <div className="card text-center py-12">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
        <p className="text-gray-500">
          Connect your Stacks wallet to view your transaction history
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
          <p className="text-gray-600 mt-1">
            View and manage your carbon credit transactions
          </p>
        </div>
        <button
          onClick={fetchTransactions}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors duration-200"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md border transition-colors duration-200 ${
              showFilters
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>

          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.searchTerm || ''}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
            />
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
            {/* Transaction Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Types</option>
                <option value="origination">Origination</option>
                <option value="transfer">Transfer</option>
                <option value="retirement">Retirement</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Time</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Date Range */}
            {filters.dateRange === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Range
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.customStartDate || ''}
                    onChange={(e) => handleFilterChange('customStartDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <input
                    type="date"
                    value={filters.customEndDate || ''}
                    onChange={(e) => handleFilterChange('customEndDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center space-x-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-red-800 font-medium">Error loading transactions</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={fetchTransactions}
              className="ml-auto px-3 py-1 text-sm text-red-600 hover:text-red-700 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Transaction Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
            <span className="ml-3 text-gray-600">Loading transactions...</span>
          </div>
        ) : paginatedTransactions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('type')}
                        className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        <span>Type</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('amount')}
                        className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        <span>Amount</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        <span>Status</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('timestamp')}
                        className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        <span>Date</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          {getTransactionIcon(tx.type)}
                          <div>
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {tx.type}
                            </div>
                            <div className="text-sm text-gray-500">
                              Credit #{tx.creditId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">From:</span>
                            <span className="text-gray-600">{formatAddress(tx.from)}</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="font-medium">To:</span>
                            <span className="text-gray-600">{formatAddress(tx.to)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {tx.amount ? `${tx.amount} credits` : 'N/A'}
                        </div>
                        {tx.fee && (
                          <div className="text-xs text-gray-500">
                            Fee: {tx.fee} STX
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(tx.status)}
                          <span className={`text-sm font-medium capitalize ${
                            tx.status === 'confirmed' ? 'text-green-600' :
                            tx.status === 'pending' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatTimestamp(tx.timestamp)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Block #{tx.blockHeight}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {tx.txHash && (
                          <a
                            href={`https://explorer.stacks.co/txid/${tx.txHash}?chain=testnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {paginationInfo.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-700">
                  <span>
                    Showing {paginationInfo.startIndex + 1} to {paginationInfo.endIndex} of {paginationInfo.totalItems} results
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
                      let pageNum
                      if (paginationInfo.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= paginationInfo.totalPages - 2) {
                        pageNum = paginationInfo.totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            currentPage === pageNum
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === paginationInfo.totalPages}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-500">
              {Object.values(filters).some(v => v && v !== 'all')
                ? 'Try adjusting your filters to see more results'
                : 'Your transaction history will appear here once you start using carbon credits'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TransactionHistory

  // Don't render if wallet is not connected
  if (!isConnected) {
    return (
      <div className="card text-center py-12">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
        <p className="text-gray-500">
          Connect your Stacks wallet to view your transaction history
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
          <p className="text-gray-600 mt-1">
            View and manage your carbon credit transactions
          </p>
        </div>
        <button
          onClick={fetchTransactions}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors duration-200"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md border transition-colors duration-200 ${
              showFilters
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>

          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.searchTerm || ''}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
            />
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
            {/* Transaction Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Types</option>
                <option value="origination">Origination</option>
                <option value="transfer">Transfer</option>
                <option value="retirement">Retirement</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Time</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Date Range */}
            {filters.dateRange === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Range
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.customStartDate || ''}
                    onChange={(e) => handleFilterChange('customStartDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <input
                    type="date"
                    value={filters.customEndDate || ''}
                    onChange={(e) => handleFilterChange('customEndDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>