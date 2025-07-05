import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

/**
 * Comprehensive test suite for the carbon credit marketplace functionality
 * Tests marketplace listing, buying, escrow, and price tracking features
 */

// Helper function to originate a test credit
function originateTestCredit(chain: Chain, deployer: Account, recipient: Account, tokenId: number = 1) {
    return chain.mineBlock([
        Tx.contractCall('carbon-credit-tracker', 'originate-credit', [
            types.principal(recipient.address),
            types.ascii(`TEST-PROJECT-${tokenId.toString().padStart(3, '0')}`),
            types.uint(2023),
            types.uint(100),
            types.ascii("Verra"),
            types.ascii("VM0001"),
            types.ascii(`TEST-UNIQUE-ID-${tokenId.toString().padStart(3, '0')}`)
        ], deployer.address),
    ]);
}

Clarinet.test({
    name: "Marketplace: Ensure credit can be listed for sale",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const seller = accounts.get('wallet_1')!;
        
        // Originate a credit
        let block = originateTestCredit(chain, deployer, seller);
        block.receipts[0].result.expectOk(types.uint(1));
        
        // List the credit for sale
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'list-credit-for-sale', [
                types.uint(1),
                types.uint(1000000), // 1 STX in microSTX
                types.uint(144) // 1 day in blocks (assuming 10 min blocks)
            ], seller.address),
        ]);
        
        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk(types.uint(1));
        
        // Verify listing exists
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'get-listing', [types.uint(1)], deployer.address),
            Tx.contractCall('carbon-credit-tracker', 'is-credit-listed', [types.uint(1)], deployer.address),
        ]);
        
        assertEquals(block.receipts.length, 2);
        const listing = block.receipts[0].result.expectSome();
        assertEquals(block.receipts[1].result, types.bool(true));
        
        // Verify listing details
        const listingData = listing.expectTuple();
        assertEquals(listingData['seller'], types.principal(seller.address));
        assertEquals(listingData['price-ustx'], types.uint(1000000));
        assertEquals(listingData['is-active'], types.bool(true));
    },
});

Clarinet.test({
    name: "Marketplace: Ensure only owner can list credit for sale",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const owner = accounts.get('wallet_1')!;
        const nonOwner = accounts.get('wallet_2')!;
        
        // Originate a credit
        let block = originateTestCredit(chain, deployer, owner);
        block.receipts[0].result.expectOk(types.uint(1));
        
        // Try to list credit as non-owner (should fail)
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'list-credit-for-sale', [
                types.uint(1),
                types.uint(1000000),
                types.uint(144)
            ], nonOwner.address),
        ]);
        
        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectErr(types.uint(100)); // ERR_UNAUTHORIZED
        
        // List credit as owner (should succeed)
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'list-credit-for-sale', [
                types.uint(1),
                types.uint(1000000),
                types.uint(144)
            ], owner.address),
        ]);
        
        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk(types.uint(1));
    },
});

Clarinet.test({
    name: "Marketplace: Ensure retired credits cannot be listed",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const owner = accounts.get('wallet_1')!;
        
        // Originate and retire a credit
        let block = originateTestCredit(chain, deployer, owner);
        block.receipts[0].result.expectOk(types.uint(1));
        
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'retire-credit', [
                types.uint(1),
                types.ascii("Test retirement")
            ], owner.address),
        ]);
        block.receipts[0].result.expectOk(types.bool(true));
        
        // Try to list retired credit (should fail)
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'list-credit-for-sale', [
                types.uint(1),
                types.uint(1000000),
                types.uint(144)
            ], owner.address),
        ]);
        
        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectErr(types.uint(104)); // ERR_CREDIT_RETIRED
    },
});

Clarinet.test({
    name: "Marketplace: Ensure credit purchase works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const seller = accounts.get('wallet_1')!;
        const buyer = accounts.get('wallet_2')!;
        const price = 1000000; // 1 STX
        
        // Originate and list a credit
        let block = originateTestCredit(chain, deployer, seller);
        block.receipts[0].result.expectOk(types.uint(1));
        
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'list-credit-for-sale', [
                types.uint(1),
                types.uint(price),
                types.uint(144)
            ], seller.address),
        ]);
        block.receipts[0].result.expectOk(types.uint(1));
        
        // Get initial balances
        const initialSellerBalance = chain.getAssetsMaps().assets['STX'][seller.address] || 0;
        const initialBuyerBalance = chain.getAssetsMaps().assets['STX'][buyer.address] || 0;
        
        // Buy the credit
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'buy-credit', [
                types.uint(1)
            ], buyer.address),
        ]);
        
        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk(types.bool(true));
        
        // Verify ownership transfer
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'get-owner', [types.uint(1)], deployer.address),
            Tx.contractCall('carbon-credit-tracker', 'get-balance', [types.principal(seller.address)], deployer.address),
            Tx.contractCall('carbon-credit-tracker', 'get-balance', [types.principal(buyer.address)], deployer.address),
        ]);
        
        assertEquals(block.receipts.length, 3);
        block.receipts[0].result.expectSome(types.principal(buyer.address)); // new owner
        assertEquals(block.receipts[1].result, types.uint(0)); // seller balance
        assertEquals(block.receipts[2].result, types.uint(1)); // buyer balance
        
        // Verify listing is removed
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'get-listing', [types.uint(1)], deployer.address),
            Tx.contractCall('carbon-credit-tracker', 'is-credit-listed', [types.uint(1)], deployer.address),
        ]);
        
        assertEquals(block.receipts.length, 2);
        block.receipts[0].result.expectNone(); // no listing
        assertEquals(block.receipts[1].result, types.bool(false)); // not listed
    },
});

Clarinet.test({
    name: "Marketplace: Ensure seller cannot buy their own listing",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const seller = accounts.get('wallet_1')!;
        
        // Originate and list a credit
        let block = originateTestCredit(chain, deployer, seller);
        block.receipts[0].result.expectOk(types.uint(1));
        
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'list-credit-for-sale', [
                types.uint(1),
                types.uint(1000000),
                types.uint(144)
            ], seller.address),
        ]);
        block.receipts[0].result.expectOk(types.uint(1));
        
        // Try to buy own listing (should fail)
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'buy-credit', [
                types.uint(1)
            ], seller.address),
        ]);
        
        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectErr(types.uint(113)); // ERR_CANNOT_BUY_OWN_LISTING
    },
});

Clarinet.test({
    name: "Marketplace: Ensure listing can be cancelled",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const seller = accounts.get('wallet_1')!;
        
        // Originate and list a credit
        let block = originateTestCredit(chain, deployer, seller);
        block.receipts[0].result.expectOk(types.uint(1));
        
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'list-credit-for-sale', [
                types.uint(1),
                types.uint(1000000),
                types.uint(144)
            ], seller.address),
        ]);
        block.receipts[0].result.expectOk(types.uint(1));
        
        // Cancel the listing
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'cancel-listing', [
                types.uint(1)
            ], seller.address),
        ]);
        
        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk(types.bool(true));
        
        // Verify listing is removed
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'get-listing', [types.uint(1)], deployer.address),
            Tx.contractCall('carbon-credit-tracker', 'is-credit-listed', [types.uint(1)], deployer.address),
        ]);
        
        assertEquals(block.receipts.length, 2);
        block.receipts[0].result.expectNone(); // no listing
        assertEquals(block.receipts[1].result, types.bool(false)); // not listed
    },
});

Clarinet.test({
    name: "Marketplace: Ensure listing price can be updated",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const seller = accounts.get('wallet_1')!;

        // Originate and list a credit
        let block = originateTestCredit(chain, deployer, seller);
        block.receipts[0].result.expectOk(types.uint(1));

        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'list-credit-for-sale', [
                types.uint(1),
                types.uint(1000000), // 1 STX
                types.uint(144)
            ], seller.address),
        ]);
        block.receipts[0].result.expectOk(types.uint(1));

        // Update listing price
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'update-listing-price', [
                types.uint(1),
                types.uint(2000000) // 2 STX
            ], seller.address),
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk(types.bool(true));

        // Verify updated price
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'get-listing', [types.uint(1)], deployer.address),
        ]);

        const listing = block.receipts[0].result.expectSome().expectTuple();
        assertEquals(listing['price-ustx'], types.uint(2000000));
    },
});

Clarinet.test({
    name: "Marketplace: Ensure platform fee calculation works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const price = 1000000; // 1 STX

        // Test fee calculation
        let block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'calculate-platform-fee', [
                types.uint(price)
            ], deployer.address),
            Tx.contractCall('carbon-credit-tracker', 'calculate-seller-proceeds', [
                types.uint(price)
            ], deployer.address),
            Tx.contractCall('carbon-credit-tracker', 'get-marketplace-fee-rate', [], deployer.address),
        ]);

        assertEquals(block.receipts.length, 3);

        const feeRate = block.receipts[2].result.expectUint();
        const expectedFee = Math.floor((price * Number(feeRate)) / 10000);
        const expectedProceeds = price - expectedFee;

        assertEquals(block.receipts[0].result, types.uint(expectedFee));
        assertEquals(block.receipts[1].result, types.uint(expectedProceeds));
    },
});

Clarinet.test({
    name: "Marketplace: Ensure marketplace statistics are updated correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const seller = accounts.get('wallet_1')!;
        const buyer = accounts.get('wallet_2')!;

        // Originate and sell a credit
        let block = originateTestCredit(chain, deployer, seller);
        block.receipts[0].result.expectOk(types.uint(1));

        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'list-credit-for-sale', [
                types.uint(1),
                types.uint(1000000),
                types.uint(144)
            ], seller.address),
        ]);
        block.receipts[0].result.expectOk(types.uint(1));

        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'buy-credit', [
                types.uint(1)
            ], buyer.address),
        ]);
        block.receipts[0].result.expectOk(types.bool(true));

        // Check marketplace statistics
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'get-marketplace-stats', [
                types.principal(seller.address)
            ], deployer.address),
            Tx.contractCall('carbon-credit-tracker', 'get-marketplace-stats', [
                types.principal(buyer.address)
            ], deployer.address),
            Tx.contractCall('carbon-credit-tracker', 'get-total-marketplace-volume', [], deployer.address),
        ]);

        assertEquals(block.receipts.length, 3);

        // Seller stats
        const sellerStats = block.receipts[0].result.expectSome().expectTuple();
        assertEquals(sellerStats['total-sales'], types.uint(1));
        assertEquals(sellerStats['total-purchases'], types.uint(0));
        assertEquals(sellerStats['total-volume-ustx'], types.uint(1000000));

        // Buyer stats
        const buyerStats = block.receipts[1].result.expectSome().expectTuple();
        assertEquals(buyerStats['total-sales'], types.uint(0));
        assertEquals(buyerStats['total-purchases'], types.uint(1));
        assertEquals(buyerStats['total-volume-ustx'], types.uint(1000000));

        // Total volume
        assertEquals(block.receipts[2].result, types.uint(1000000));
    },
});

Clarinet.test({
    name: "Marketplace: Ensure administrative functions work correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const nonOwner = accounts.get('wallet_1')!;

        // Test fee rate update (only owner)
        let block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'set-marketplace-fee-rate', [
                types.uint(300) // 3%
            ], deployer.address),
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk(types.bool(true));

        // Verify fee rate updated
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'get-marketplace-fee-rate', [], deployer.address),
        ]);

        assertEquals(block.receipts[0].result, types.uint(300));

        // Test non-owner cannot update fee rate
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'set-marketplace-fee-rate', [
                types.uint(400)
            ], nonOwner.address),
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectErr(types.uint(100)); // ERR_UNAUTHORIZED
    },
});
