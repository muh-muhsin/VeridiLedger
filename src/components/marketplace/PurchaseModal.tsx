import React, { useState, useEffect } from 'react'
import { X, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react'
import { MarketplaceListing, CarbonCreditMetadata, carbonCreditContract } from '../../utils/contractUtils'
import { formatStxAmount, microStxToStx } from '../../utils/marketplaceUtils'

interface PurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  tokenId: number
  listing: MarketplaceListing
  metadata: CarbonCreditMetadata | null
  userAddress?: string
  onPurchaseComplete?: () => void
}

/**
 * PurchaseModal component for confirming and executing carbon credit purchases
 */
const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  tokenId,
  listing,
  metadata,
  userAddress,
  onPurchaseComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [platformFee, setPlatformFee] = useState(0)
  const [sellerProceeds, setSellerProceeds] = useState(0)
  const [txId, setTxId] = useState<string | null>(null)

  // Calculate fees when modal opens
  useEffect(() => {
    if (isOpen && listing) {
      loadFeeCalculations()
    }
  }, [isOpen, listing])

  const loadFeeCalculations = async () => {
    try {
      const fee = await carbonCreditContract.calculatePlatformFee(listing.priceUstx)
      const proceeds = await carbonCreditContract.calculateSellerProceeds(listing.priceUstx)
      setPlatformFee(fee)
      setSellerProceeds(proceeds)
    } catch (error) {
      console.error('Error calculating fees:', error)
    }
  }

  const handlePurchase = async () => {
    if (!userAddress) {
      setError('Please connect your wallet first')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const result = await carbonCreditContract.buyCredit(tokenId, userAddress)
      
      if (result) {
        setSuccess(true)
        setTxId(result.txId || 'Transaction submitted')
        
        // Call completion callback after a delay
        setTimeout(() => {
          if (onPurchaseComplete) {
            onPurchaseComplete()
          }
          handleClose()
        }, 3000)
      }
    } catch (error: any) {
      console.error('Purchase failed:', error)
      setError(error.message || 'Purchase failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setError(null)
    setSuccess(false)
    setTxId(null)
    setIsProcessing(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {success ? 'Purchase Successful!' : 'Confirm Purchase'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Credit #{tokenId} Purchased Successfully!
                </h3>
                <p className="text-gray-600 mt-2">
                  The carbon credit has been transferred to your wallet.
                </p>
                {txId && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Transaction ID:</p>
                    <p className="text-sm font-mono text-gray-900 break-all">{txId}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Credit Details */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Credit Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Token ID:</span>
                    <span className="font-medium">#{tokenId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Project:</span>
                    <span className="font-medium">{metadata?.projectId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vintage Year:</span>
                    <span className="font-medium">{metadata?.vintageYear || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{metadata?.quantityTonnes || 0} tonnes CO₂</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registry:</span>
                    <span className="font-medium">{metadata?.issuingRegistry || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Price Breakdown</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Credit Price:</span>
                    <span className="font-medium">{formatStxAmount(listing.priceUstx)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fee:</span>
                    <span className="font-medium">{formatStxAmount(platformFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seller Receives:</span>
                    <span className="font-medium">{formatStxAmount(sellerProceeds)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">Total Cost:</span>
                      <span className="font-bold text-lg text-primary-600">
                        {formatStxAmount(listing.priceUstx)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-yellow-800 font-medium">Important Notice</p>
                    <p className="text-yellow-700 mt-1">
                      This transaction is irreversible. Please verify all details before proceeding.
                      The carbon credit will be transferred to your wallet upon successful payment.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertTriangle className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-red-800 font-medium">Purchase Failed</p>
                      <p className="text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePurchase}
              disabled={isProcessing || !userAddress}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : `Purchase for ${formatStxAmount(listing.priceUstx)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PurchaseModal
