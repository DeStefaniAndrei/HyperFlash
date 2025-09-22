/**
 * HyperFlash SDK - Advanced Trading Example
 *
 * This shows more advanced features like:
 * - Multiple trades
 * - Error handling
 * - Trade monitoring
 */

const { HyperFlashSDK } = require('@hyperflash/sdk');

class TradingBot {
    constructor(privateKey) {
        // Initialize SDK
        this.sdk = new HyperFlashSDK({
            network: 'testnet',
            privateKey: privateKey
        });

        this.activeTrades = [];
    }

    /**
     * Execute multiple trades quickly
     */
    async executeRapidTrades() {
        console.log('🚀 Starting rapid trading demo...\n');

        const trades = [
            { sourceToken: 'USDC', amount: 1000, targetPair: 'BTC/USDC', side: 'buy' },
            { sourceToken: 'USDC', amount: 500, targetPair: 'ETH/USDC', side: 'buy' },
            { sourceToken: 'USDC', amount: 750, targetPair: 'SOL/USDC', side: 'buy' },
        ];

        for (const tradeParams of trades) {
            try {
                console.log(`Executing: ${tradeParams.side} ${tradeParams.amount} ${tradeParams.sourceToken} → ${tradeParams.targetPair}`);

                const result = await this.sdk.executeTrade(tradeParams);

                console.log(`✅ Success! Execution time: ${result.executionTime}ms`);
                console.log(`   Trade ID: ${result.tradeId}\n`);

                this.activeTrades.push(result.tradeId);

                // Small delay between trades (optional)
                await this.delay(100);

            } catch (error) {
                console.error(`❌ Trade failed: ${error.message}\n`);
            }
        }
    }

    /**
     * Monitor all active trades
     */
    async monitorTrades() {
        console.log('📊 Monitoring active trades...\n');

        for (const tradeId of this.activeTrades) {
            try {
                const status = await this.sdk.getTradeStatus(tradeId);

                console.log(`Trade ${tradeId}:`);
                console.log(`  Status: ${status.status}`);
                console.log(`  Bridge: ${status.bridgeCompleted ? '✅' : '⏳'}`);
                console.log(`  Executed: ${status.tradeExecuted ? '✅' : '⏳'}`);
                console.log('');

            } catch (error) {
                console.error(`Failed to get status for ${tradeId}: ${error.message}`);
            }
        }
    }

    /**
     * Calculate total gas costs
     */
    async calculateCosts() {
        console.log('💰 Calculating costs...\n');

        let totalGas = 0;
        const pairs = ['BTC/USDC', 'ETH/USDC', 'SOL/USDC'];

        for (const pair of pairs) {
            try {
                const estimate = await this.sdk.estimateGasCost(pair, 1000);
                console.log(`${pair}: ${estimate.costInEth} ETH (~$${estimate.costInUsd})`);
                totalGas += parseFloat(estimate.costInEth);
            } catch (error) {
                console.error(`Failed to estimate for ${pair}`);
            }
        }

        console.log(`\nTotal estimated gas: ${totalGas.toFixed(6)} ETH`);
    }

    /**
     * Helper function for delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Main execution
     */
    async run() {
        try {
            // Check connection
            const connected = await this.sdk.isConnected();
            if (!connected) {
                throw new Error('Failed to connect to network');
            }

            console.log(`Connected as: ${this.sdk.getWalletAddress()}\n`);

            // Check staking status
            const status = await this.sdk.checkStakingStatus();
            if (!status.hasStaking) {
                console.log('⚠️  No staking contract found. Deploy one first!\n');
                return;
            }

            console.log(`✅ Staking contract active with ${status.stakedAmount} staked\n`);

            // Execute trades
            await this.executeRapidTrades();

            // Wait a bit
            await this.delay(2000);

            // Monitor trades
            await this.monitorTrades();

            // Calculate costs
            await this.calculateCosts();

            console.log('\n✅ Demo complete!');

        } catch (error) {
            console.error('Fatal error:', error);
        }
    }
}

// Usage
async function main() {
    // Replace with your private key
    const PRIVATE_KEY = 'your_private_key_here';

    const bot = new TradingBot(PRIVATE_KEY);
    await bot.run();
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TradingBot;