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
}

// Export a singleton instance
export const carbonCreditContract = new CarbonCreditContract()
