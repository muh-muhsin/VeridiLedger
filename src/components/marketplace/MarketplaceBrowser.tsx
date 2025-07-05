import React, { useState, useEffect } from 'react'
import { Search, Filter, SortAsc, SortDesc, Grid, List } from 'lucide-react'
import { carbonCreditContract, MarketplaceListing, CarbonCreditMetadata } from '../../utils/contractUtils'
import { 
  formatStxAmount, 
  formatTimeRemaining, 
  sortListings, 
  filterListingsByPrice,
  getMarketplaceSummary 
} from '../../utils/marketplaceUtils'
import CreditListing from './CreditListing'

interface ListingWithMetadata extends MarketplaceListing {
  tokenId: number
  metadata: CarbonCreditMetadata | null
}

interface MarketplaceBrowserProps {
  currentBlock?: number
  onPurchase?: (tokenId: number) => void
}

/**
 * MarketplaceBrowser component for browsing and filtering carbon credit listings
 */
const MarketplaceBrowser: React.FC<MarketplaceBrowserProps> = ({ 
  currentBlock = 0, 
  onPurchase 
}) => {
  const [listings, setListings] = useState<ListingWithMetadata[]>([])
  const [filteredListings, setFilteredListings] = useState<ListingWithMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'newest' | 'oldest'>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [priceFilter, setPriceFilter] = useState({ min: '', max: '' })
  const [showFilters, setShowFilters] = useState(false)

  // Load marketplace listings
  useEffect(() => {
    loadListings()
  }, [])

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...listings]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(listing => 
        listing.metadata?.projectId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.metadata?.methodology.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.metadata?.issuingRegistry.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Price filter
    if (priceFilter.min || priceFilter.max) {
      const min = priceFilter.min ? parseFloat(priceFilter.min) : 0
      const max = priceFilter.max ? parseFloat(priceFilter.max) : Infinity
      filtered = filterListingsByPrice(filtered, min, max)
    }

    // Sort
    filtered = sortListings(filtered, sortBy)

    setFilteredListings(filtered)
  }, [listings, searchTerm, sortBy, priceFilter])

  const loadListings = async () => {
    setLoading(true)
    try {
      // In a real implementation, you'd have an API endpoint or indexer
      // that returns all active listings. For now, we'll simulate this
      // by checking a range of token IDs
      const mockListings: ListingWithMetadata[] = []
      
      for (let tokenId = 1; tokenId <= 10; tokenId++) {
        const listing = await carbonCreditContract.getListing(tokenId)
        if (listing && listing.isActive) {
          const metadata = await carbonCreditContract.getCreditDetails(tokenId)
          mockListings.push({
            ...listing,
            tokenId,
            metadata
          })
        }
      }

      setListings(mockListings)
    } catch (error) {
      console.error('Error loading listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = (tokenId: number) => {
    if (onPurchase) {
      onPurchase(tokenId)
    }
    // Refresh listings after purchase
    setTimeout(loadListings, 2000)
  }

  const marketplaceSummary = getMarketplaceSummary(filteredListings)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Carbon Credit Marketplace</h2>
          <p className="text-gray-600">
            {marketplaceSummary.totalListings} credits available • 
            Average price: {formatStxAmount(marketplaceSummary.averagePrice)}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by project, methodology, or registry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Price Filter */}
        {showFilters && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Price Range (STX)</h3>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                placeholder="Min"
                value={priceFilter.min}
                onChange={(e) => setPriceFilter(prev => ({ ...prev, min: e.target.value }))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="number"
                placeholder="Max"
                value={priceFilter.max}
                onChange={(e) => setPriceFilter(prev => ({ ...prev, max: e.target.value }))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={() => setPriceFilter({ min: '', max: '' })}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Listings */}
      {filteredListings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No credits found</div>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredListings.map((listing) => (
            <CreditListing
              key={listing.tokenId}
              tokenId={listing.tokenId}
              listing={listing}
              metadata={listing.metadata}
              currentBlock={currentBlock}
              viewMode={viewMode}
              onPurchase={() => handlePurchase(listing.tokenId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default MarketplaceBrowser
