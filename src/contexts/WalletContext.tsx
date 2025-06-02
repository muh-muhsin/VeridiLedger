import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AppConfig, UserSession, showConnect } from '@stacks/connect'
import { StacksTestnet } from '@stacks/network'

/**
 * Wallet state interface defining the shape of wallet-related data
 */
interface WalletState {
  isConnected: boolean
  userSession: UserSession | null
  userData: any | null
  stxAddress: string | null
  network: StacksTestnet
  isLoading: boolean
  error: string | null
}

/**
 * Wallet context interface defining available actions and state
 */
interface WalletContextType extends WalletState {
  connectWallet: () => void
  disconnectWallet: () => void
  refreshUserData: () => void
}

/**
 * App configuration for Stacks authentication
 * Defines the app's identity and permissions
 */
const appConfig = new AppConfig(['store_write', 'publish_data'])

/**
 * Default wallet state
 */
const defaultWalletState: WalletState = {
  isConnected: false,
  userSession: null,
  userData: null,
  stxAddress: null,
  network: new StacksTestnet(),
  isLoading: false,
  error: null,
}

/**
 * Wallet context for managing Stacks wallet connection state
 */
const WalletContext = createContext<WalletContextType | undefined>(undefined)

/**
 * Props for the WalletProvider component
 */
interface WalletProviderProps {
  children: ReactNode
}

/**
 * WalletProvider component that manages wallet state and provides context
 * Handles wallet connection, disconnection, and user session management
 */
export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [walletState, setWalletState] = useState<WalletState>(defaultWalletState)

  // Initialize user session
  const userSession = new UserSession({ appConfig })

  /**
   * Initialize wallet state on component mount
   * Checks if user is already authenticated
   */
  useEffect(() => {
    const initializeWallet = () => {
      setWalletState(prev => ({ ...prev, isLoading: true, userSession }))

      try {
        if (userSession.isSignInPending()) {
          // Handle pending sign-in
          userSession.handlePendingSignIn().then((userData) => {
            setWalletState(prev => ({
              ...prev,
              isConnected: true,
              userData,
              stxAddress: userData.profile.stxAddress.testnet,
              isLoading: false,
              error: null,
            }))
          }).catch((error) => {
            console.error('Error handling pending sign-in:', error)
            setWalletState(prev => ({
              ...prev,
              isLoading: false,
              error: 'Failed to complete wallet connection',
            }))
          })
        } else if (userSession.isUserSignedIn()) {
          // User is already signed in
          const userData = userSession.loadUserData()
          setWalletState(prev => ({
            ...prev,
            isConnected: true,
            userData,
            stxAddress: userData.profile.stxAddress.testnet,
            isLoading: false,
            error: null,
          }))
        } else {
          // User is not signed in
          setWalletState(prev => ({
            ...prev,
            isLoading: false,
          }))
        }
      } catch (error) {
        console.error('Error initializing wallet:', error)
        setWalletState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to initialize wallet connection',
        }))
      }
    }

    initializeWallet()
  }, [])

  /**
   * Connect wallet function
   * Initiates the wallet connection flow using Stacks Connect
   */
  const connectWallet = () => {
    setWalletState(prev => ({ ...prev, isLoading: true, error: null }))

    showConnect({
      appDetails: {
        name: 'VeridiLedger',
        icon: window.location.origin + '/favicon.ico',
      },
      redirectTo: '/',
      onFinish: () => {
        // This will be handled by the useEffect hook
        window.location.reload()
      },
      onCancel: () => {
        setWalletState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Wallet connection cancelled',
        }))
      },
      userSession,
    })
  }

  /**
   * Disconnect wallet function
   * Signs out the user and resets wallet state
   */
  const disconnectWallet = () => {
    try {
      userSession.signUserOut()
      setWalletState({
        ...defaultWalletState,
        userSession,
        network: new StacksTestnet(),
      })
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
      setWalletState(prev => ({
        ...prev,
        error: 'Failed to disconnect wallet',
      }))
    }
  }

  /**
   * Refresh user data function
   * Reloads user data from the current session
   */
  const refreshUserData = () => {
    if (userSession.isUserSignedIn()) {
      try {
        const userData = userSession.loadUserData()
        setWalletState(prev => ({
          ...prev,
          userData,
          stxAddress: userData.profile.stxAddress.testnet,
          error: null,
        }))
      } catch (error) {
        console.error('Error refreshing user data:', error)
        setWalletState(prev => ({
          ...prev,
          error: 'Failed to refresh user data',
        }))
      }
    }
  }

  const contextValue: WalletContextType = {
    ...walletState,
    connectWallet,
    disconnectWallet,
    refreshUserData,
  }

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  )
}

/**
 * Custom hook to use the wallet context
 * Provides easy access to wallet state and functions
 * 
 * @returns WalletContextType - The wallet context value
 * @throws Error if used outside of WalletProvider
 */
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
