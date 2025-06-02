import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

/**
 * Test suite for the carbon-credit-tracker smart contract
 * Tests core functionality including origination, transfer, and retirement
 */

Clarinet.test({
    name: "Ensure that contract initializes correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        
        // Check initial state
        let block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'get-total-supply', [], deployer.address),
            Tx.contractCall('carbon-credit-tracker', 'get-total-retired', [], deployer.address),
            Tx.contractCall('carbon-credit-tracker', 'get-active-credits', [], deployer.address),
        ]);
        
        assertEquals(block.receipts.length, 3);
        assertEquals(block.receipts[0].result, types.uint(0));
        assertEquals(block.receipts[1].result, types.uint(0));
        assertEquals(block.receipts[2].result, types.uint(0));
    },
});

Clarinet.test({
    name: "Ensure that only authorized users can originate credits",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        
        // Try to originate credit as non-authorized user (should fail)
        let block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'originate-credit', [
                types.principal(wallet1.address),
                types.ascii("TEST-PROJECT-001"),
                types.uint(2023),
                types.uint(100),
                types.ascii("Verra"),
                types.ascii("VM0001"),
                types.ascii("TEST-UNIQUE-ID-001")
            ], wallet1.address),
        ]);
        
        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectErr(types.uint(100)); // ERR_UNAUTHORIZED
        
        // Originate credit as deployer (should succeed)
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'originate-credit', [
                types.principal(wallet1.address),
                types.ascii("TEST-PROJECT-001"),
                types.uint(2023),
                types.uint(100),
                types.ascii("Verra"),
                types.ascii("VM0001"),
                types.ascii("TEST-UNIQUE-ID-001")
            ], deployer.address),
        ]);
        
        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk(types.uint(1));
    },
});

Clarinet.test({
    name: "Ensure that credit origination updates contract state correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        
        // Originate a credit
        let block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'originate-credit', [
                types.principal(wallet1.address),
                types.ascii("TEST-PROJECT-001"),
                types.uint(2023),
                types.uint(100),
                types.ascii("Verra"),
                types.ascii("VM0001"),
                types.ascii("TEST-UNIQUE-ID-001")
            ], deployer.address),
        ]);
        
        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk(types.uint(1));
        
        // Check updated state
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'get-total-supply', [], deployer.address),
            Tx.contractCall('carbon-credit-tracker', 'get-active-credits', [], deployer.address),
            Tx.contractCall('carbon-credit-tracker', 'get-balance', [types.principal(wallet1.address)], deployer.address),
            Tx.contractCall('carbon-credit-tracker', 'get-owner', [types.uint(1)], deployer.address),
        ]);
        
        assertEquals(block.receipts.length, 4);
        assertEquals(block.receipts[0].result, types.uint(1)); // total supply
        assertEquals(block.receipts[1].result, types.uint(1)); // active credits
        assertEquals(block.receipts[2].result, types.uint(1)); // wallet1 balance
        block.receipts[3].result.expectSome(types.principal(wallet1.address)); // owner
    },
});

Clarinet.test({
    name: "Ensure that credit transfer works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        const wallet2 = accounts.get('wallet_2')!;
        
        // Originate a credit
        let block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'originate-credit', [
                types.principal(wallet1.address),
                types.ascii("TEST-PROJECT-001"),
                types.uint(2023),
                types.uint(100),
                types.ascii("Verra"),
                types.ascii("VM0001"),
                types.ascii("TEST-UNIQUE-ID-001")
            ], deployer.address),
        ]);
        
        block.receipts[0].result.expectOk(types.uint(1));
        
        // Transfer credit from wallet1 to wallet2
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'transfer', [
                types.uint(1),
                types.principal(wallet1.address),
                types.principal(wallet2.address)
            ], wallet1.address),
        ]);
        
        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk(types.bool(true));
        
        // Check updated ownership
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'get-owner', [types.uint(1)], deployer.address),
            Tx.contractCall('carbon-credit-tracker', 'get-balance', [types.principal(wallet1.address)], deployer.address),
            Tx.contractCall('carbon-credit-tracker', 'get-balance', [types.principal(wallet2.address)], deployer.address),
        ]);
        
        assertEquals(block.receipts.length, 3);
        block.receipts[0].result.expectSome(types.principal(wallet2.address)); // new owner
        assertEquals(block.receipts[1].result, types.uint(0)); // wallet1 balance
        assertEquals(block.receipts[2].result, types.uint(1)); // wallet2 balance
    },
});

Clarinet.test({
    name: "Ensure that credit retirement works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        
        // Originate a credit
        let block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'originate-credit', [
                types.principal(wallet1.address),
                types.ascii("TEST-PROJECT-001"),
                types.uint(2023),
                types.uint(100),
                types.ascii("Verra"),
                types.ascii("VM0001"),
                types.ascii("TEST-UNIQUE-ID-001")
            ], deployer.address),
        ]);
        
        block.receipts[0].result.expectOk(types.uint(1));
        
        // Retire the credit
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'retire-credit', [
                types.uint(1),
                types.ascii("Offsetting company emissions")
            ], wallet1.address),
        ]);
        
        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk(types.bool(true));
        
        // Check updated state
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'get-total-retired', [], deployer.address),
            Tx.contractCall('carbon-credit-tracker', 'get-active-credits', [], deployer.address),
            Tx.contractCall('carbon-credit-tracker', 'is-credit-retired', [types.uint(1)], deployer.address),
            Tx.contractCall('carbon-credit-tracker', 'get-owner', [types.uint(1)], deployer.address),
        ]);
        
        assertEquals(block.receipts.length, 4);
        assertEquals(block.receipts[0].result, types.uint(1)); // total retired
        assertEquals(block.receipts[1].result, types.uint(0)); // active credits
        assertEquals(block.receipts[2].result, types.bool(true)); // is retired
        block.receipts[3].result.expectNone(); // no owner (burned)
    },
});

Clarinet.test({
    name: "Ensure that retired credits cannot be transferred",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        const wallet2 = accounts.get('wallet_2')!;
        
        // Originate and retire a credit
        let block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'originate-credit', [
                types.principal(wallet1.address),
                types.ascii("TEST-PROJECT-001"),
                types.uint(2023),
                types.uint(100),
                types.ascii("Verra"),
                types.ascii("VM0001"),
                types.ascii("TEST-UNIQUE-ID-001")
            ], deployer.address),
            Tx.contractCall('carbon-credit-tracker', 'retire-credit', [
                types.uint(1),
                types.ascii("Offsetting company emissions")
            ], wallet1.address),
        ]);
        
        block.receipts[0].result.expectOk(types.uint(1));
        block.receipts[1].result.expectOk(types.bool(true));
        
        // Try to transfer retired credit (should fail)
        block = chain.mineBlock([
            Tx.contractCall('carbon-credit-tracker', 'transfer', [
                types.uint(1),
                types.principal(wallet1.address),
                types.principal(wallet2.address)
            ], wallet1.address),
        ]);
        
        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectErr(types.uint(101)); // ERR_NOT_FOUND (credit is burned)
    },
});
