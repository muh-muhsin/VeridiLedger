/**
 * VeridiLedger API Server
 * Basic Express.js server with API endpoint stubs for carbon credit operations
 */

const express = require('express');
const cors = require('cors');
const { StacksTestnet } = require('@stacks/network');
const { callReadOnlyFunction, cvToJSON, uintCV } = require('@stacks/transactions');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Contract configuration
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const CONTRACT_NAME = process.env.CONTRACT_NAME || 'carbon-credit-tracker';
const network = new StacksTestnet();

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'VeridiLedger API'
  });
});

/**
 * Get recent platform transactions
 * TODO: Implement actual transaction fetching from Stacks API
 */
app.get('/api/transactions/recent', async (req, res) => {
  try {
    // Stub implementation - returns mock data
    const mockTransactions = [
      {
        id: 'tx1',
        type: 'origination',
        creditId: 1,
        from: null,
        to: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        blockHeight: 12345
      },
      {
        id: 'tx2',
        type: 'transfer',
        creditId: 1,
        from: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        to: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        blockHeight: 12346
      }
    ];

    res.json({
      success: true,
      transactions: mockTransactions,
      count: mockTransactions.length
    });
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent transactions'
    });
  }
});

/**
 * Get platform statistics
 */
app.get('/api/stats/platform', async (req, res) => {
  try {
    // Fetch real data from smart contract
    const [totalSupplyResult, totalRetiredResult] = await Promise.all([
      callReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'get-total-supply',
        functionArgs: [],
        network,
        senderAddress: CONTRACT_ADDRESS,
      }),
      callReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'get-total-retired',
        functionArgs: [],
        network,
        senderAddress: CONTRACT_ADDRESS,
      })
    ]);

    const totalSupply = cvToJSON(totalSupplyResult).value || 0;
    const totalRetired = cvToJSON(totalRetiredResult).value || 0;
    const activeCredits = totalSupply - totalRetired;

    res.json({
      success: true,
      stats: {
        totalCredits: totalSupply,
        totalRetired: totalRetired,
        activeCredits: activeCredits,
        totalTransactions: totalSupply // Approximation
      }
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform statistics'
    });
  }
});

/**
 * Get credit details by ID
 */
app.get('/api/credits/:id', async (req, res) => {
  try {
    const creditId = parseInt(req.params.id);
    
    if (isNaN(creditId) || creditId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid credit ID'
      });
    }

    // Fetch credit details from smart contract
    const creditDetailsResult = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-credit-details',
      functionArgs: [uintCV(creditId)],
      network,
      senderAddress: CONTRACT_ADDRESS,
    });

    const creditDetails = cvToJSON(creditDetailsResult);

    if (!creditDetails.value) {
      return res.status(404).json({
        success: false,
        error: 'Credit not found'
      });
    }

    res.json({
      success: true,
      credit: creditDetails.value
    });
  } catch (error) {
    console.error('Error fetching credit details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credit details'
    });
  }
});

/**
 * Get credits by owner
 */
app.get('/api/credits/owner/:address', async (req, res) => {
  try {
    const ownerAddress = req.params.address;
    
    // TODO: Implement actual credit enumeration
    // For now, return mock data
    res.json({
      success: true,
      credits: [],
      count: 0,
      message: 'Credit enumeration not yet implemented'
    });
  } catch (error) {
    console.error('Error fetching credits by owner:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credits by owner'
    });
  }
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

/**
 * 404 handler
 */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`VeridiLedger API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
