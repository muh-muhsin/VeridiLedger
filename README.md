# VeridiLedger

A transparent Carbon Credit Tracking platform built on the Stacks ecosystem, providing secure and verifiable carbon credit management through blockchain technology.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Smart Contracts](#smart-contracts)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Overview

VeridiLedger is a comprehensive platform for tracking carbon credits on the Stacks blockchain. It enables transparent origination, transfer, and retirement of carbon credits while providing real-time analytics and verification capabilities for businesses and individuals.

### Why VeridiLedger?

- **Transparency**: All carbon credit transactions are recorded on the blockchain
- **Security**: Built with Clarity smart contracts for maximum security
- **Verifiability**: Complete audit trail for all carbon credit activities
- **Integration**: APIs for business integration and automated reporting

## Features

### Current Features (Phase 1.1 Complete)
- ✅ **Stacks Wallet Integration** - Complete wallet connection with session persistence
- ✅ **Carbon Credit NFT Smart Contract** - SIP-009 compliant smart contract deployed on testnet
- ✅ **Dashboard with Platform Statistics** - Real-time blockchain data and analytics
- ✅ **Comprehensive Transaction History** - Advanced filtering, pagination, search, and export
- ✅ **Responsive Design** - Mobile-first design with Tailwind CSS
- ✅ **Professional Navigation** - Multi-page routing with React Router

### Advanced Features (Transaction History)
- 🔍 **Advanced Filtering** - Filter by transaction type, status, and date ranges
- 📊 **Real-time Search** - Search across transaction IDs, hashes, and metadata
- 📄 **Pagination** - Efficient handling of large transaction datasets
- 📈 **Sorting** - Sort by timestamp, amount, type, or status
- 📋 **CSV Export** - Export transaction data for external analysis
- 🔗 **Blockchain Explorer Integration** - Direct links to Stacks Explorer

### Planned Features (Phase 1.2+)
- 🔄 Carbon credit origination and minting interface
- 🔄 Credit transfer functionality with approval workflows
- 🔄 Credit retirement with verification and certificates
- 🔄 Advanced analytics and reporting dashboards
- 🔄 RESTful API for business integration
- 🔄 Multi-signature wallet support

## Tech Stack

| Category | Technology | Justification |
|----------|------------|---------------|
| Blockchain | Stacks | Bitcoin L2 for security and settlement |
| Smart Contracts | Clarity | Native language emphasizing security and predictability |
| Frontend | React + TypeScript | Modern component-based UI with type safety |
| Styling | Tailwind CSS | Utility-first approach for custom design |
| Build Tool | Vite | Fast development and optimized builds |
| Stacks Integration | Stacks.js | Official library for blockchain interaction |
| State Management | React Context | Simple state management, scalable to Zustand/Redux |
| Testing | Jest + RTL | Comprehensive testing for frontend components |

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Stacks wallet (Hiro Wallet, Xverse, etc.)
- Git

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd veridiledger
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment configuration:
```bash
cp .env.example .env
```

## Configuration

Edit the `.env` file with your configuration:

```env
# Stacks Network Configuration
VITE_STACKS_NETWORK=testnet
VITE_STACKS_API_URL=https://api.testnet.hiro.so

# Smart Contract Configuration
VITE_CONTRACT_ADDRESS=your_contract_address_here
VITE_CONTRACT_NAME=carbon-credit-tracker

# Optional configurations
VITE_STACKS_API_KEY=your_stacks_api_key_here
```

## Running the Application

### Development
```bash
npm run dev
```
The application will be available at `http://localhost:3000`

### Production Build
```bash
npm run build
npm run preview
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## Smart Contracts

### Carbon Credit Tracker Contract

The main smart contract implements SIP-009 NFT standard for carbon credits:

- **Contract Name**: `carbon-credit-tracker`
- **Standard**: SIP-009 (Non-Fungible Token)
- **Network**: Stacks Testnet (development)

#### Key Functions
- `originate-credit`: Create new carbon credit NFT
- `transfer`: Transfer credit between principals
- `retire-credit`: Permanently retire a credit
- `get-credit-details`: Retrieve credit metadata

*Note: Contract deployment instructions will be added in Phase 1.2*

## API Reference

*API documentation will be available after backend implementation*

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Contributing

*Contribution guidelines will be established in future phases*

## License

MIT License - see [LICENSE](LICENSE) file for details.

---
