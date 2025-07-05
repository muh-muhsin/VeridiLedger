import {
  makeContractCall,
  makeContractSTXPostCondition,
  PostConditionMode,
  FungibleConditionCode,
  createAssetInfo,
  makeStandardNonFungiblePostCondition,
  NonFungibleConditionCode,
  bufferCVFromString,
  uintCV,
  principalCV,
  stringAsciiCV,
  stringUtf8CV,
  tupleCV,
  listCV,
  contractPrincipalCV,
  callReadOnlyFunction,
  cvToJSON,
  hexToCV,
} from '@stacks/transactions'
import { StacksTestnet, StacksMainnet } from '@stacks/network'
import { openContractCall } from '@stacks/connect'

/**
 * Contract configuration
 */
export const CONTRACT_CONFIG = {
  contractAddress: process.env.VITE_CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  contractName: process.env.VITE_CONTRACT_NAME || 'carbon-credit-tracker',
  network: process.env.VITE_STACKS_NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet(),
}

/**
 * Carbon credit metadata interface
 */
export interface CarbonCreditMetadata {
  projectId: string
  vintageYear: number
  quantityTonnes: number
  issuingRegistry: string
  methodology: string
  uniqueIdentifier: string
  originationDate?: number
  isRetired?: boolean
}

/**
 * Marketplace listing interface
 */
export interface MarketplaceListing {
  seller: string
  priceUstx: number
  listedAt: number
  expiresAt: number
  isActive: boolean
}

/**
 * Marketplace statistics interface
 */
export interface MarketplaceStats {
  totalSales: number
  totalPurchases: number
  totalVolumeUstx: number
}

/**
 * Price history entry interface
 */
export interface PriceHistoryEntry {
  priceUstx: number
  timestamp: number
  transactionType: string
}

/**
 * Contract interaction utilities for carbon credit operations
 */
export class CarbonCreditContract {
  private contractAddress: string
  private contractName: string
  private network: StacksTestnet | StacksMainnet

  constructor() {
    this.contractAddress = CONTRACT_CONFIG.contractAddress
    this.contractName = CONTRACT_CONFIG.contractName
    this.network = CONTRACT_CONFIG.network
  }

  /**
   * Originate a new carbon credit
   */
  async originateCredit(
    recipient: string,
    metadata: CarbonCreditMetadata,
    senderAddress: string
  ) {
    const functionArgs = [
      principalCV(recipient),
      stringAsciiCV(metadata.projectId),
      uintCV(metadata.vintageYear),
      uintCV(metadata.quantityTonnes),
      stringAsciiCV(metadata.issuingRegistry),
      stringAsciiCV(metadata.methodology),
      stringAsciiCV(metadata.uniqueIdentifier),
    ]

    const txOptions = {
      contractAddress: this.contractAddress,
      contractName: this.contractName,
      functionName: 'originate-credit',
      functionArgs,
      senderKey: senderAddress,
      network: this.network,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
    }

    return openContractCall(txOptions)
  }

  /**
   * Transfer a carbon credit to another principal
   */
  async transferCredit(
    tokenId: number,
    sender: string,
    recipient: string,
    senderAddress: string
  ) {
    const functionArgs = [
      uintCV(tokenId),
      principalCV(sender),
      principalCV(recipient),
    ]

    const txOptions = {
      contractAddress: this.contractAddress,
      contractName: this.contractName,
      functionName: 'transfer',
      functionArgs,
      senderKey: senderAddress,
      network: this.network,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
    }

    return openContractCall(txOptions)
  }

  /**
   * Retire a carbon credit
   */
  async retireCredit(
    tokenId: number,
    retirementReason: string,
    senderAddress: string
  ) {
    const functionArgs = [
      uintCV(tokenId),
      stringAsciiCV(retirementReason),
    ]

    const txOptions = {
      contractAddress: this.contractAddress,
      contractName: this.contractName,
      functionName: 'retire-credit',
      functionArgs,
      senderKey: senderAddress,
      network: this.network,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
    }

    return openContractCall(txOptions)
  }

  /**
   * Get credit details (read-only)
   */
  async getCreditDetails(tokenId: number) {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-credit-details',
        functionArgs: [uintCV(tokenId)],
        network: this.network,
        senderAddress: this.contractAddress,
      })

      return cvToJSON(result)
    } catch (error) {
      console.error('Error fetching credit details:', error)
      return null
    }
  }

  /**
   * Get total supply of credits (read-only)
   */
  async getTotalSupply() {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-total-supply',
        functionArgs: [],
        network: this.network,
        senderAddress: this.contractAddress,
      })

      return cvToJSON(result).value
    } catch (error) {
      console.error('Error fetching total supply:', error)
      return 0
    }
  }

  /**
   * Get total retired credits (read-only)
   */
  async getTotalRetired() {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-total-retired',
        functionArgs: [],
        network: this.network,
        senderAddress: this.contractAddress,
      })

      return cvToJSON(result).value
    } catch (error) {
      console.error('Error fetching total retired:', error)
      return 0
    }
  }

  /**
   * Get active credits count (read-only)
   */
  async getActiveCredits() {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-active-credits',
        functionArgs: [],
        network: this.network,
        senderAddress: this.contractAddress,
      })

      return cvToJSON(result).value
    } catch (error) {
      console.error('Error fetching active credits:', error)
      return 0
    }
  }

  /**
   * Get balance for a specific owner (read-only)
   */
  async getBalance(owner: string) {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-balance',
        functionArgs: [principalCV(owner)],
        network: this.network,
        senderAddress: this.contractAddress,
      })

      return cvToJSON(result).value
    } catch (error) {
      console.error('Error fetching balance:', error)
      return 0
    }
  }

  /**
   * Check if a credit is retired (read-only)
   */
  async isCreditRetired(tokenId: number) {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'is-credit-retired',
        functionArgs: [uintCV(tokenId)],
        network: this.network,
        senderAddress: this.contractAddress,
      })

      return cvToJSON(result).value
    } catch (error) {
      console.error('Error checking retirement status:', error)
      return false
    }
  }

  /**
   * Get owner of a specific token (read-only)
   */
  async getOwner(tokenId: number) {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-owner',
        functionArgs: [uintCV(tokenId)],
        network: this.network,
        senderAddress: this.contractAddress,
      })

      const jsonResult = cvToJSON(result)
      return jsonResult.value ? jsonResult.value.value : null
    } catch (error) {
      console.error('Error fetching owner:', error)
      return null
    }
  }

  /**
   * List a carbon credit for sale on the marketplace
   */
  async listCreditForSale(
    tokenId: number,
    priceUstx: number,
    durationBlocks: number,
    senderAddress: string
  ) {
    const functionArgs = [
      uintCV(tokenId),
      uintCV(priceUstx),
      uintCV(durationBlocks),
    ]

    const txOptions = {
      contractAddress: this.contractAddress,
      contractName: this.contractName,
      functionName: 'list-credit-for-sale',
      functionArgs,
      senderKey: senderAddress,
      network: this.network,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
    }

    return openContractCall(txOptions)
  }

  /**
   * Buy a carbon credit from the marketplace
   */
  async buyCredit(tokenId: number, senderAddress: string) {
    const functionArgs = [uintCV(tokenId)]

    const txOptions = {
      contractAddress: this.contractAddress,
      contractName: this.contractName,
      functionName: 'buy-credit',
      functionArgs,
      senderKey: senderAddress,
      network: this.network,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
    }

    return openContractCall(txOptions)
  }

  /**
   * Cancel a marketplace listing
   */
  async cancelListing(tokenId: number, senderAddress: string) {
    const functionArgs = [uintCV(tokenId)]

    const txOptions = {
      contractAddress: this.contractAddress,
      contractName: this.contractName,
      functionName: 'cancel-listing',
      functionArgs,
      senderKey: senderAddress,
      network: this.network,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
    }

    return openContractCall(txOptions)
  }

  /**
   * Update listing price
   */
  async updateListingPrice(
    tokenId: number,
    newPriceUstx: number,
    senderAddress: string
  ) {
    const functionArgs = [uintCV(tokenId), uintCV(newPriceUstx)]

    const txOptions = {
      contractAddress: this.contractAddress,
      contractName: this.contractName,
      functionName: 'update-listing-price',
      functionArgs,
      senderKey: senderAddress,
      network: this.network,
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
    }

    return openContractCall(txOptions)
  }

  /**
   * Get marketplace listing details (read-only)
   */
  async getListing(tokenId: number): Promise<MarketplaceListing | null> {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-listing',
        functionArgs: [uintCV(tokenId)],
        network: this.network,
        senderAddress: this.contractAddress,
      })

      const jsonResult = cvToJSON(result)
      if (jsonResult.value) {
        const listing = jsonResult.value.value
        return {
          seller: listing.seller.value,
          priceUstx: parseInt(listing['price-ustx'].value),
          listedAt: parseInt(listing['listed-at'].value),
          expiresAt: parseInt(listing['expires-at'].value),
          isActive: listing['is-active'].value,
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching listing:', error)
      return null
    }
  }

  /**
   * Check if a credit is listed for sale (read-only)
   */
  async isCreditListed(tokenId: number): Promise<boolean> {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'is-credit-listed',
        functionArgs: [uintCV(tokenId)],
        network: this.network,
        senderAddress: this.contractAddress,
      })

      return cvToJSON(result).value
    } catch (error) {
      console.error('Error checking if credit is listed:', error)
      return false
    }
  }

  /**
   * Get price history for a token (read-only)
   */
  async getPriceHistory(tokenId: number): Promise<PriceHistoryEntry[]> {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-price-history',
        functionArgs: [uintCV(tokenId)],
        network: this.network,
        senderAddress: this.contractAddress,
      })

      const jsonResult = cvToJSON(result)
      if (jsonResult.value) {
        return jsonResult.value.map((entry: any) => ({
          priceUstx: parseInt(entry.value['price-ustx'].value),
          timestamp: parseInt(entry.value.timestamp.value),
          transactionType: entry.value['transaction-type'].value,
        }))
      }
      return []
    } catch (error) {
      console.error('Error fetching price history:', error)
      return []
    }
  }

  /**
   * Get marketplace statistics for a user (read-only)
   */
  async getMarketplaceStats(user: string): Promise<MarketplaceStats | null> {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-marketplace-stats',
        functionArgs: [principalCV(user)],
        network: this.network,
        senderAddress: this.contractAddress,
      })

      const jsonResult = cvToJSON(result)
      if (jsonResult.value) {
        const stats = jsonResult.value.value
        return {
          totalSales: parseInt(stats['total-sales'].value),
          totalPurchases: parseInt(stats['total-purchases'].value),
          totalVolumeUstx: parseInt(stats['total-volume-ustx'].value),
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching marketplace stats:', error)
      return null
    }
  }

  /**
   * Get total marketplace volume (read-only)
   */
  async getTotalMarketplaceVolume(): Promise<number> {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-total-marketplace-volume',
        functionArgs: [],
        network: this.network,
        senderAddress: this.contractAddress,
      })

      return cvToJSON(result).value
    } catch (error) {
      console.error('Error fetching total marketplace volume:', error)
      return 0
    }
  }

  /**
   * Calculate platform fee for a given price (read-only)
   */
  async calculatePlatformFee(priceUstx: number): Promise<number> {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'calculate-platform-fee',
        functionArgs: [uintCV(priceUstx)],
        network: this.network,
        senderAddress: this.contractAddress,
      })

      return cvToJSON(result).value
    } catch (error) {
      console.error('Error calculating platform fee:', error)
      return 0
    }
  }

  /**
   * Calculate seller proceeds after fee (read-only)
   */
  async calculateSellerProceeds(priceUstx: number): Promise<number> {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'calculate-seller-proceeds',
        functionArgs: [uintCV(priceUstx)],
        network: this.network,
        senderAddress: this.contractAddress,
      })

      return cvToJSON(result).value
    } catch (error) {
      console.error('Error calculating seller proceeds:', error)
      return 0
    }
  }
}

// Export a singleton instance
export const carbonCreditContract = new CarbonCreditContract()
