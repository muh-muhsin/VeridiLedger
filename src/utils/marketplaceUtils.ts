/**
 * Marketplace utility functions for VeridiLedger
 * Provides helper functions for marketplace operations, formatting, and calculations
 */

/**
 * Convert microSTX to STX
 */
export function microStxToStx(microStx: number): number {
  return microStx / 1000000
}

/**
 * Convert STX to microSTX
 */
export function stxToMicroStx(stx: number): number {
  return Math.floor(stx * 1000000)
}

/**
 * Format STX amount for display
 */
export function formatStxAmount(microStx: number, decimals: number = 2): string {
  const stx = microStxToStx(microStx)
  return `${stx.toFixed(decimals)} STX`
}

/**
 * Format USD amount for display (assuming STX price)
 */
export function formatUsdAmount(microStx: number, stxPriceUsd: number = 1, decimals: number = 2): string {
  const stx = microStxToStx(microStx)
  const usd = stx * stxPriceUsd
  return `$${usd.toFixed(decimals)}`
}

/**
 * Calculate percentage change between two prices
 */
export function calculatePriceChange(oldPrice: number, newPrice: number): number {
  if (oldPrice === 0) return 0
  return ((newPrice - oldPrice) / oldPrice) * 100
}

/**
 * Format percentage change for display
 */
export function formatPriceChange(change: number): string {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}

/**
 * Get price change color class
 */
export function getPriceChangeColor(change: number): string {
  if (change > 0) return 'text-green-600'
  if (change < 0) return 'text-red-600'
  return 'text-gray-600'
}

/**
 * Format timestamp to readable date
 */
export function formatTimestamp(timestamp: number): string {
  // Assuming timestamp is block height, convert to approximate date
  // This is a simplified conversion - in production you'd want to use actual block timestamps
  const blockTime = 10 * 60 * 1000 // 10 minutes per block in milliseconds
  const genesisTime = new Date('2021-01-14').getTime() // Stacks 2.0 genesis
  const estimatedTime = genesisTime + (timestamp * blockTime)
  
  return new Date(estimatedTime).toLocaleDateString()
}

/**
 * Format time remaining until expiry
 */
export function formatTimeRemaining(expiresAt: number, currentBlock: number): string {
  const blocksRemaining = expiresAt - currentBlock
  if (blocksRemaining <= 0) return 'Expired'
  
  const hoursRemaining = Math.floor((blocksRemaining * 10) / 60) // 10 min blocks
  const daysRemaining = Math.floor(hoursRemaining / 24)
  
  if (daysRemaining > 0) {
    return `${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`
  } else if (hoursRemaining > 0) {
    return `${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}`
  } else {
    return `${blocksRemaining} block${blocksRemaining > 1 ? 's' : ''}`
  }
}

/**
 * Validate listing price
 */
export function validateListingPrice(price: string): { isValid: boolean; error?: string } {
  const numPrice = parseFloat(price)
  
  if (isNaN(numPrice)) {
    return { isValid: false, error: 'Price must be a valid number' }
  }
  
  if (numPrice <= 0) {
    return { isValid: false, error: 'Price must be greater than 0' }
  }
  
  if (numPrice > 1000000) { // 1M STX max
    return { isValid: false, error: 'Price cannot exceed 1,000,000 STX' }
  }
  
  return { isValid: true }
}

/**
 * Validate listing duration
 */
export function validateListingDuration(duration: string): { isValid: boolean; error?: string } {
  const numDuration = parseInt(duration)
  
  if (isNaN(numDuration)) {
    return { isValid: false, error: 'Duration must be a valid number' }
  }
  
  if (numDuration < 1) {
    return { isValid: false, error: 'Duration must be at least 1 day' }
  }
  
  if (numDuration > 365) {
    return { isValid: false, error: 'Duration cannot exceed 365 days' }
  }
  
  return { isValid: true }
}

/**
 * Convert days to blocks (assuming 10 minute blocks)
 */
export function daysToBlocks(days: number): number {
  return Math.floor(days * 24 * 6) // 6 blocks per hour
}

/**
 * Convert blocks to days
 */
export function blocksToDays(blocks: number): number {
  return blocks / (24 * 6)
}

/**
 * Sort listings by various criteria
 */
export function sortListings<T extends { priceUstx: number; listedAt: number }>(
  listings: T[],
  sortBy: 'price-asc' | 'price-desc' | 'newest' | 'oldest'
): T[] {
  return [...listings].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.priceUstx - b.priceUstx
      case 'price-desc':
        return b.priceUstx - a.priceUstx
      case 'newest':
        return b.listedAt - a.listedAt
      case 'oldest':
        return a.listedAt - b.listedAt
      default:
        return 0
    }
  })
}

/**
 * Filter listings by price range
 */
export function filterListingsByPrice<T extends { priceUstx: number }>(
  listings: T[],
  minPrice: number,
  maxPrice: number
): T[] {
  return listings.filter(listing => 
    listing.priceUstx >= stxToMicroStx(minPrice) && 
    listing.priceUstx <= stxToMicroStx(maxPrice)
  )
}

/**
 * Get marketplace statistics summary
 */
export function getMarketplaceSummary(listings: Array<{ priceUstx: number }>) {
  if (listings.length === 0) {
    return {
      totalListings: 0,
      averagePrice: 0,
      minPrice: 0,
      maxPrice: 0,
      totalValue: 0
    }
  }

  const prices = listings.map(l => l.priceUstx)
  const totalValue = prices.reduce((sum, price) => sum + price, 0)
  
  return {
    totalListings: listings.length,
    averagePrice: totalValue / listings.length,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    totalValue
  }
}

/**
 * Generate mock price chart data (for development)
 */
export function generateMockPriceData(days: number = 30) {
  const data = []
  const basePrice = 1000000 // 1 STX in microSTX
  
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - i))
    
    // Generate some realistic price movement
    const volatility = 0.1 // 10% daily volatility
    const change = (Math.random() - 0.5) * 2 * volatility
    const price = basePrice * (1 + change)
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: Math.floor(price),
      volume: Math.floor(Math.random() * 10) + 1
    })
  }
  
  return data
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (address.length <= startChars + endChars) return address
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

/**
 * Get transaction type display name
 */
export function getTransactionTypeDisplay(type: string): string {
  switch (type) {
    case 'listing':
      return 'Listed'
    case 'sale':
      return 'Sold'
    case 'delisting':
      return 'Delisted'
    default:
      return type
  }
}

/**
 * Get transaction type color
 */
export function getTransactionTypeColor(type: string): string {
  switch (type) {
    case 'listing':
      return 'text-blue-600'
    case 'sale':
      return 'text-green-600'
    case 'delisting':
      return 'text-gray-600'
    default:
      return 'text-gray-600'
  }
}
