import React, { useState, useEffect } from 'react'
import { Plus, AlertTriangle, CheckCircle } from 'lucide-react'
import { CarbonCreditMetadata, carbonCreditContract } from '../../utils/contractUtils'
import { 
  validateListingPrice, 
  validateListingDuration, 
  daysToBlocks, 
  stxToMicroStx,
  formatStxAmount 
} from '../../utils/marketplaceUtils'

interface ListingFormProps {
  userAddress?: string
  userCredits?: Array<{ tokenId: number; metadata: CarbonCreditMetadata }>
  onListingComplete?: () => void
}

/**
 * ListingForm component for creating new marketplace listings
 */
const ListingForm: React.FC<ListingFormProps> = ({
  userAddress,
  userCredits = [],
  onListingComplete
}) => {
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null)
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('7') // Default 7 days
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Reset form when success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false)
        setShowForm(false)
        setSelectedTokenId(null)
        setPrice('')
        setDuration('7')
        setError(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userAddress) {
      setError('Please connect your wallet first')
      return
    }

    if (!selectedTokenId) {
      setError('Please select a credit to list')
      return
    }

    // Validate inputs
    const priceValidation = validateListingPrice(price)
    if (!priceValidation.isValid) {
      setError(priceValidation.error!)
      return
    }

    const durationValidation = validateListingDuration(duration)
    if (!durationValidation.isValid) {
      setError(durationValidation.error!)
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const priceInMicroStx = stxToMicroStx(parseFloat(price))
      const durationInBlocks = daysToBlocks(parseInt(duration))

      const result = await carbonCreditContract.listCreditForSale(
        selectedTokenId,
        priceInMicroStx,
        durationInBlocks,
        userAddress
      )

      if (result) {
        setSuccess(true)
        if (onListingComplete) {
          onListingComplete()
        }
      }
    } catch (error: any) {
      console.error('Listing failed:', error)
      setError(error.message || 'Failed to create listing. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const selectedCredit = userCredits.find(credit => credit.tokenId === selectedTokenId)

  if (!userAddress) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
          <div className="text-sm">
            <p className="text-yellow-800 font-medium">Wallet Required</p>
            <p className="text-yellow-700 mt-1">
              Please connect your wallet to list carbon credits for sale.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (userCredits.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-center">
          <p className="text-gray-600">You don't own any carbon credits to list.</p>
          <p className="text-sm text-gray-500 mt-1">
            Purchase or receive carbon credits to start selling on the marketplace.
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <div>
            <h3 className="text-lg font-medium text-green-900">
              Credit Listed Successfully!
            </h3>
            <p className="text-green-700 mt-2">
              Your carbon credit is now available on the marketplace.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!showForm) {
    return (
      <div className="text-center">
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          List Credit for Sale
        </button>
        <p className="text-sm text-gray-600 mt-2">
          You own {userCredits.length} carbon credit{userCredits.length !== 1 ? 's' : ''}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">List Credit for Sale</h3>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Credit Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Credit to List
          </label>
          <select
            value={selectedTokenId || ''}
            onChange={(e) => setSelectedTokenId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          >
            <option value="">Choose a credit...</option>
            {userCredits.map((credit) => (
              <option key={credit.tokenId} value={credit.tokenId}>
                #{credit.tokenId} - {credit.metadata.projectId} ({credit.metadata.quantityTonnes} tonnes)
              </option>
            ))}
          </select>
        </div>

        {/* Selected Credit Details */}
        {selectedCredit && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Credit Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Project:</span>
                <p className="font-medium">{selectedCredit.metadata.projectId}</p>
              </div>
              <div>
                <span className="text-gray-600">Vintage:</span>
                <p className="font-medium">{selectedCredit.metadata.vintageYear}</p>
              </div>
              <div>
                <span className="text-gray-600">Quantity:</span>
                <p className="font-medium">{selectedCredit.metadata.quantityTonnes} tonnes CO₂</p>
              </div>
              <div>
                <span className="text-gray-600">Registry:</span>
                <p className="font-medium">{selectedCredit.metadata.issuingRegistry}</p>
              </div>
            </div>
          </div>
        )}

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price (STX)
          </label>
          <input
            type="number"
            step="0.000001"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Enter price in STX"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
          {price && (
            <p className="text-sm text-gray-600 mt-1">
              ≈ {formatStxAmount(stxToMicroStx(parseFloat(price) || 0))}
            </p>
          )}
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Listing Duration (days)
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          >
            <option value="1">1 day</option>
            <option value="3">3 days</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
              <div className="text-sm">
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            disabled={isProcessing}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isProcessing || !selectedTokenId || !price || !duration}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Creating Listing...' : 'List for Sale'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ListingForm
