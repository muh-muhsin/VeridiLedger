import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { carbonCreditContract, CarbonCreditMetadata } from '../utils/contractUtils'
import { useWallet } from './WalletContext'

/**
 * Platform statistics interface
 */
interface PlatformStats {
  totalCredits: number
  totalRetired: number
  activeCredits: number
  isLoading: boolean
  error: string | null
}

/**
 * User credit information interface
 */
interface UserCredits {
  ownedCredits: number
  retiredCredits: number
  isLoading: boolean
  error: string | null
}

/**
 * Contract context interface
 */
interface ContractContextType {
  platformStats: PlatformStats
  userCredits: UserCredits
  refreshPlatformStats: () => Promise<void>
  refreshUserCredits: () => Promise<void>
  originateCredit: (recipient: string, metadata: CarbonCreditMetadata) => Promise<any>
  transferCredit: (tokenId: number, recipient: string) => Promise<any>
  retireCredit: (tokenId: number, reason: string) => Promise<any>
  getCreditDetails: (tokenId: number) => Promise<any>
}

/**
 * Default state values
 */
const defaultPlatformStats: PlatformStats = {
  totalCredits: 0,
  totalRetired: 0,
  activeCredits: 0,
  isLoading: false,
  error: null,
}

const defaultUserCredits: UserCredits = {
  ownedCredits: 0,
  retiredCredits: 0,
  isLoading: false,
  error: null,
}

/**
 * Contract context
 */
const ContractContext = createContext<ContractContextType | undefined>(undefined)

/**
 * Props for ContractProvider
 */
interface ContractProviderProps {
  children: ReactNode
}

/**
 * ContractProvider component that manages contract interactions and state
 */
export const ContractProvider: React.FC<ContractProviderProps> = ({ children }) => {
  const { isConnected, stxAddress } = useWallet()
  const [platformStats, setPlatformStats] = useState<PlatformStats>(defaultPlatformStats)
  const [userCredits, setUserCredits] = useState<UserCredits>(defaultUserCredits)

  /**
   * Refresh platform statistics from the contract
   */
  const refreshPlatformStats = async () => {
    setPlatformStats(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const [totalCredits, totalRetired, activeCredits] = await Promise.all([
        carbonCreditContract.getTotalSupply(),
        carbonCreditContract.getTotalRetired(),
        carbonCreditContract.getActiveCredits(),
      ])

      setPlatformStats({
        totalCredits: totalCredits || 0,
        totalRetired: totalRetired || 0,
        activeCredits: activeCredits || 0,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error('Error refreshing platform stats:', error)
      setPlatformStats(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load platform statistics',
      }))
    }
  }

  /**
   * Refresh user credit information from the contract
   */
  const refreshUserCredits = async () => {
    if (!isConnected || !stxAddress) {
      setUserCredits(defaultUserCredits)
      return
    }

    setUserCredits(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const ownedCredits = await carbonCreditContract.getBalance(stxAddress)

      setUserCredits({
        ownedCredits: ownedCredits || 0,
        retiredCredits: 0, // TODO: Implement retired credits tracking for user
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error('Error refreshing user credits:', error)
      setUserCredits(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load user credits',
      }))
    }
  }

  /**
   * Originate a new carbon credit
   */
  const originateCredit = async (recipient: string, metadata: CarbonCreditMetadata) => {
    if (!isConnected || !stxAddress) {
      throw new Error('Wallet not connected')
    }

    try {
      const result = await carbonCreditContract.originateCredit(
        recipient,
        metadata,
        stxAddress
      )

      // Refresh stats after successful origination
      setTimeout(() => {
        refreshPlatformStats()
        refreshUserCredits()
      }, 2000) // Wait for transaction to be processed

      return result
    } catch (error) {
      console.error('Error originating credit:', error)
      throw error
    }
  }

  /**
   * Transfer a carbon credit
   */
  const transferCredit = async (tokenId: number, recipient: string) => {
    if (!isConnected || !stxAddress) {
      throw new Error('Wallet not connected')
    }

    try {
      const result = await carbonCreditContract.transferCredit(
        tokenId,
        stxAddress,
        recipient,
        stxAddress
      )

      // Refresh stats after successful transfer
      setTimeout(() => {
        refreshPlatformStats()
        refreshUserCredits()
      }, 2000)

      return result
    } catch (error) {
      console.error('Error transferring credit:', error)
      throw error
    }
  }

  /**
   * Retire a carbon credit
   */
  const retireCredit = async (tokenId: number, reason: string) => {
    if (!isConnected || !stxAddress) {
      throw new Error('Wallet not connected')
    }

    try {
      const result = await carbonCreditContract.retireCredit(
        tokenId,
        reason,
        stxAddress
      )

      // Refresh stats after successful retirement
      setTimeout(() => {
        refreshPlatformStats()
        refreshUserCredits()
      }, 2000)

      return result
    } catch (error) {
      console.error('Error retiring credit:', error)
      throw error
    }
  }

  /**
   * Get credit details
   */
  const getCreditDetails = async (tokenId: number) => {
    try {
      return await carbonCreditContract.getCreditDetails(tokenId)
    } catch (error) {
      console.error('Error getting credit details:', error)
      throw error
    }
  }

  /**
   * Load initial data when component mounts or wallet connection changes
   */
  useEffect(() => {
    refreshPlatformStats()
  }, [])

  useEffect(() => {
    if (isConnected && stxAddress) {
      refreshUserCredits()
    } else {
      setUserCredits(defaultUserCredits)
    }
  }, [isConnected, stxAddress])

  const contextValue: ContractContextType = {
    platformStats,
    userCredits,
    refreshPlatformStats,
    refreshUserCredits,
    originateCredit,
    transferCredit,
    retireCredit,
    getCreditDetails,
  }

  return (
    <ContractContext.Provider value={contextValue}>
      {children}
    </ContractContext.Provider>
  )
}

/**
 * Custom hook to use the contract context
 */
export const useContract = (): ContractContextType => {
  const context = useContext(ContractContext)
  if (context === undefined) {
    throw new Error('useContract must be used within a ContractProvider')
  }
  return context
}
