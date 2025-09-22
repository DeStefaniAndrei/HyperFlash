/**
 * HyperFlash SDK Tests
 *
 * These tests make sure our SDK works correctly.
 * In testing, we check if functions do what they're supposed to do.
 */

// Mock axios to avoid real network calls during testing
jest.mock('axios');
const axios = require('axios');

// Import our SDK
const { HyperFlashSDK } = require('../dist/index');

describe('HyperFlash SDK Tests', () => {

    let sdk;

    beforeEach(() => {
        // Before each test, create a fresh SDK instance
        sdk = new HyperFlashSDK({
            network: 'localhost',
            privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
        });
    });

    afterEach(() => {
        // Clean up after each test
        jest.clearAllMocks();
    });

    // Test 1: SDK initializes correctly
    test('SDK should initialize with correct network', () => {
        expect(sdk).toBeDefined();
        expect(sdk.getWalletAddress()).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    });

    // Test 2: Check staking status works
    test('checkStakingStatus should return correct data', async () => {
        // Mock the API response
        axios.get.mockResolvedValue({
            data: {
                hasStakingContract: true,
                stakedAmount: '1000000000000000000',
                isActive: true
            }
        });

        const status = await sdk.checkStakingStatus();

        expect(status.hasStaking).toBe(true);
        expect(status.stakedAmount).toBe('1000000000000000000');
        expect(status.isActive).toBe(true);
    });

    // Test 3: Execute trade works
    test('executeTrade should return trade details', async () => {
        // Mock the API response
        axios.post.mockResolvedValue({
            data: {
                success: true,
                tradeId: 'trade_123456',
                timestamp: Date.now()
            }
        });

        const result = await sdk.executeTrade({
            sourceToken: 'USDC',
            amount: 1000,
            targetPair: 'BTC/USDC',
            side: 'buy'
        });

        expect(result.tradeId).toBe('trade_123456');
        expect(result.status).toBe('executed');
        expect(result.executionTime).toBeGreaterThan(0);
    });

    // Test 4: Error handling works
    test('should handle errors properly', async () => {
        // Mock an error
        axios.post.mockRejectedValue(new Error('Network error'));

        await expect(sdk.executeTrade({
            sourceToken: 'USDC',
            amount: 1000,
            targetPair: 'BTC/USDC',
            side: 'buy'
        })).rejects.toThrow('Network error');
    });

    // Test 5: No wallet throws error
    test('should throw error if no wallet configured', async () => {
        const sdkNoWallet = new HyperFlashSDK({
            network: 'localhost'
            // No private key provided
        });

        await expect(sdkNoWallet.checkStakingStatus())
            .rejects.toThrow('Wallet not configured');
    });

    // Test 6: Trade status check works
    test('getTradeStatus should return status', async () => {
        // Mock the API response
        axios.get.mockResolvedValue({
            data: {
                tradeId: 'trade_123',
                status: 'completed',
                bridgeCompleted: true,
                tradeExecuted: true
            }
        });

        const status = await sdk.getTradeStatus('trade_123');

        expect(status.tradeId).toBe('trade_123');
        expect(status.status).toBe('completed');
        expect(status.bridgeCompleted).toBe(true);
    });

    // Test 7: Gas estimation works
    test('estimateGasCost should return estimates', async () => {
        // Mock the API response
        axios.post.mockResolvedValue({
            data: {
                estimatedGas: '200000',
                costInEth: '0.002',
                costInUsd: '5.00'
            }
        });

        const estimate = await sdk.estimateGasCost('BTC/USDC', 1000);

        expect(estimate.estimatedGas).toBe('200000');
        expect(estimate.costInEth).toBe('0.002');
        expect(estimate.costInUsd).toBe('5.00');
    });

    // Test 8: Connection check works
    test('isConnected should return boolean', async () => {
        // For this test, we'd need to mock the provider
        // Simplified version:
        const connected = await sdk.isConnected();
        expect(typeof connected).toBe('boolean');
    });
});

// Integration test example (would run against real backend)
describe('Integration Tests (skipped by default)', () => {
    // Skip these unless explicitly running integration tests
    test.skip('should execute real trade on testnet', async () => {
        const sdk = new HyperFlashSDK({
            network: 'testnet',
            privateKey: process.env.TEST_PRIVATE_KEY
        });

        const result = await sdk.executeTrade({
            sourceToken: 'USDC',
            amount: 1,
            targetPair: 'BTC/USDC',
            side: 'buy'
        });

        expect(result.tradeId).toBeDefined();
        expect(result.executionTime).toBeLessThan(1000); // Should be under 1 second
    });
});