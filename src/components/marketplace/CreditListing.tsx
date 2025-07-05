import React, { useState } from 'react'
import { Calendar, MapPin, Award, Clock, ShoppingCart, Eye } from 'lucide-react'
import { MarketplaceListing, CarbonCreditMetadata } from '../../utils/contractUtils'
import { 
  formatStxAmount, 
  formatTimeRemaining, 
  formatTimestamp,
  truncateAddress 
} from '../../utils/marketplaceUtils'

interface CreditListingProps {
  tokenId: number
  listing: MarketplaceListing
  metadata: CarbonCreditMetadata | null
  currentBlock: number
  viewMode: 'grid' | 'list'
  onPurchase: () => void
  onViewDetails?: () => void
}

/**
 * CreditListing component for displaying individual carbon credit listings
 */
const CreditListing: React.FC<CreditListingProps> = ({
  tokenId,
  listing,
  metadata,
  currentBlock,
  viewMode,
  onPurchase,
  onViewDetails
}) => {
  const [isLoading, setIsLoading] = useState(false)

  const handlePurchase = async () => {
    setIsLoading(true)
    try {
      await onPurchase()
    } catch (error) {
      console.error('Purchase failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const isExpired = currentBlock >= listing.expiresAt
  const timeRemaining = formatTimeRemaining(listing.expiresAt, currentBlock)

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Credit Info */}
            <div>
              <h3 className="font-semibold text-gray-900">#{tokenId}</h3>
              <p className="text-sm text-gray-600">{metadata?.projectId || 'Unknown Project'}</p>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <Calendar className="w-3 h-3 mr-1" />
                {metadata?.vintageYear || 'N/A'}
              </div>
            </div>

            {/* Registry & Methodology */}
            <div>
              <div className="flex items-center text-sm text-gray-600">
                <Award className="w-4 h-4 mr-1" />
                {metadata?.issuingRegistry || 'N/A'}
              </div>
              <p className="text-xs text-gray-500 mt-1">{metadata?.methodology || 'N/A'}</p>
            </div>

            {/* Quantity */}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {metadata?.quantityTonnes || 0} tonnes CO₂
              </p>
              <p className="text-xs text-gray-500">Carbon credits</p>
            </div>

            {/* Price & Time */}
            <div>
              <p className="text-lg font-bold text-primary-600">
                {formatStxAmount(listing.priceUstx)}
              </p>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                {isExpired ? 'Expired' : timeRemaining}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 ml-4">
            {onViewDetails && (
              <button
                onClick={onViewDetails}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handlePurchase}
              disabled={isExpired || isLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isExpired
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {isLoading ? 'Processing...' : isExpired ? 'Expired' : 'Buy Now'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Credit #{tokenId}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isExpired 
              ? 'bg-red-100 text-red-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {isExpired ? 'Expired' : 'Active'}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">{metadata?.projectId || 'Unknown Project'}</p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Registry & Methodology */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Award className="w-4 h-4 mr-2" />
            {metadata?.issuingRegistry || 'N/A'}
          </div>
          <p className="text-xs text-gray-500 pl-6">{metadata?.methodology || 'N/A'}</p>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-1" />
              Vintage
            </div>
            <p className="font-medium">{metadata?.vintageYear || 'N/A'}</p>
          </div>
          <div>
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-1" />
              Quantity
            </div>
            <p className="font-medium">{metadata?.quantityTonnes || 0} tonnes</p>
          </div>
        </div>

        {/* Seller */}
        <div className="text-xs text-gray-500">
          Seller: {truncateAddress(listing.seller)}
        </div>

        {/* Time remaining */}
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="w-4 h-4 mr-2" />
          {isExpired ? 'Expired' : `${timeRemaining} remaining`}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-primary-600">
              {formatStxAmount(listing.priceUstx)}
            </p>
            <p className="text-xs text-gray-500">
              Listed {formatTimestamp(listing.listedAt)}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {onViewDetails && (
              <button
                onClick={onViewDetails}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handlePurchase}
              disabled={isExpired || isLoading}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                isExpired
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {isLoading ? 'Processing...' : isExpired ? 'Expired' : 'Buy Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreditListing
