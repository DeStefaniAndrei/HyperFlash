/**
 * Mock HyperLiquid Trade Service for Demo
 *
 * This mock simulates successful trade execution for demo purposes
 * since the Python SDK initialization is hanging.
 */

class MockHyperLiquidTradeService {
    constructor() {
        this.isInitialized = false;
        this.tradeCounter = 0;
    }

    /**
     * Initialize the mock trade service
     */
    async initialize() {
        console.log('[HyperLiquid MOCK] Initializing trade service...');

        // Simulate successful initialization
        await new Promise(resolve => setTimeout(resolve, 100));

        this.isInitialized = true;
        console.log('[HyperLiquid MOCK] Trade service initialized successfully');
        console.log('[WARNING] Using MOCK trade service for demo - trades are simulated');
        return true;
    }

    /**
     * Execute a mock trade on HyperLiquid
     * Returns realistic-looking results for demo
     */
    async executeTrade(tradeId, tradeParams) {
        console.log(`[HyperLiquid MOCK] Executing trade ${tradeId}`);
        console.log(`   Pair: ${tradeParams.pair || 'BTC/USDC'}`);
        console.log(`   Side: ${tradeParams.side || 'buy'}`);
        console.log(`   Type: ${tradeParams.type || 'market'}`);

        // Simulate execution time
        const executionTime = Math.floor(Math.random() * 200) + 50; // 50-250ms
        await new Promise(resolve => setTimeout(resolve, executionTime));

        this.tradeCounter++;

        // Generate mock order ID
        const orderId = `HL_${Date.now()}_${this.tradeCounter}`;

        console.log(`[HyperLiquid MOCK] Trade executed in ${executionTime}ms!`);
        console.log(`   Order ID: ${orderId}`);

        return {
            success: true,
            orderId: orderId,
            executionTime: executionTime,
            tradeId: tradeId,
            fillPrice: tradeParams.price || (tradeParams.pair === 'BTC/USDC' ? 50000 : 1),
            filledAmount: tradeParams.amount || 0.01,
            status: 'filled'
        };
    }

    /**
     * Get mock vault balance
     */
    async getVaultBalance() {
        return {
            success: true,
            balance: {
                USDC: "10000.00",
                ETH: "2.5",
                BTC: "0.05",
                HYPE: "1000.00"
            },
            totalValueUSD: "15000.00"
        };
    }

    /**
     * Get mock order status
     */
    async getOrderStatus(tradeId) {
        return {
            success: true,
            status: 'filled',
            filledAmount: '0.01',
            remainingAmount: '0',
            averagePrice: '50000'
        };
    }

    /**
     * Cancel order (mock)
     */
    async cancelOrder(tradeId, coin) {
        console.log(`[HyperLiquid MOCK] Cancelling order ${tradeId}`);
        return {
            success: true,
            message: 'Order cancelled successfully'
        };
    }
}

export default MockHyperLiquidTradeService;