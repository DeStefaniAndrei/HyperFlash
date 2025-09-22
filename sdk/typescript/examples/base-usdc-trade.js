/**
 * HyperFlash Base USDC Trading Demo
 *
 * This example shows how to trade USDC from Base chain on HyperLiquid.
 * The magic: You don't wait for bridging! Trade executes instantly.
 */

const { HyperFlashSDK } = require('../dist/index');

// Demo configuration
const DEMO_CONFIG = {
    network: 'testnet',
    privateKey: '3d6f146e428a9e046ece85ea3442016f2d05b4971075fb27d64ec63888187ec0', // Test wallet
    backendUrl: 'http://localhost:3000'
};

async function demonstrateBaseUSDCTrading() {
    console.log('===========================================');
    console.log('    HyperFlash: Base USDC Trading Demo     ');
    console.log('===========================================\n');

    // Step 1: Initialize SDK
    console.log('Step 1: Initializing HyperFlash SDK...');
    const sdk = new HyperFlashSDK(DEMO_CONFIG);
    console.log(`Connected to: ${DEMO_CONFIG.network}`);
    console.log(`Wallet: ${sdk.getWalletAddress()}\n`);

    // Step 2: Check if user has staking contract
    console.log('Step 2: Checking staking status...');
    try {
        const status = await sdk.checkStakingStatus();

        if (!status.hasStaking) {
            console.log('No staking contract found. Deploying one...');
            const contractAddr = await sdk.deployStakingContract();
            console.log(`Staking contract deployed at: ${contractAddr}\n`);

            // Stake some funds to enable trading
            console.log('Staking 0.1 HYPE to enable trading...');
            await sdk.stakeFunds(0.1);
            console.log('Staking complete!\n');
        } else {
            console.log(`Staking contract exists. Staked: ${status.stakedAmount} wei`);
            console.log(`Active: ${status.isActive}\n`);
        }
    } catch (error) {
        console.log('Note: Staking check failed (backend may not be running)');
        console.log('Continuing with demo...\n');
    }

    // Step 3: Execute trade with USDC from Base
    console.log('Step 3: Trading USDC from Base chain');
    console.log('----------------------------------------');
    console.log('Trade Details:');
    console.log('  Source: 1000 USDC on Base');
    console.log('  Target: BTC/USDC on HyperLiquid');
    console.log('  Action: BUY 0.01 BTC');
    console.log('  Expected Bridge Time: 2 seconds');
    console.log('  Actual Execution Time: <500ms!\n');

    console.log('Starting timer...');
    const tradeStart = Date.now();

    try {
        // This is where the magic happens!
        // We specify USDC from Base chain, but trade executes instantly
        const trade = await sdk.executeTrade({
            sourceToken: 'USDC',
            sourceChain: 'base',      // Specify Base as source chain
            amount: 1000,              // 1000 USDC
            targetPair: 'BTC/USDC',    // Trade pair on HyperLiquid
            side: 'buy',               // Buy BTC with USDC
            price: 50000               // Limit price (optional)
        });

        const totalTime = Date.now() - tradeStart;

        console.log('\n=== TRADE EXECUTED SUCCESSFULLY! ===');
        console.log(`Trade ID: ${trade.tradeId}`);
        console.log(`Execution Time: ${trade.executionTime}ms`);
        console.log(`Total Time: ${totalTime}ms`);
        console.log(`Status: ${trade.status}\n`);

        // Compare with traditional bridging
        console.log('Time Comparison:');
        console.log(`  Traditional Bridge: ~2000ms (minimum)`);
        console.log(`  HyperFlash:         ${trade.executionTime}ms`);
        console.log(`  Time Saved:         ${2000 - trade.executionTime}ms`);
        console.log(`  Speed Improvement:  ${Math.round(2000/trade.executionTime)}x faster!\n`);

        // Step 4: Check trade status
        console.log('Step 4: Checking trade status...');
        const status = await sdk.getTradeStatus(trade.tradeId);
        console.log('Trade Status:');
        console.log(`  Bridge Status: ${status.bridgeCompleted ? 'Complete' : 'Processing'}`);
        console.log(`  Trade Status: ${status.tradeExecuted ? 'Executed' : 'Pending'}`);
        console.log(`  Settlement: ${status.settled ? 'Complete' : 'Pending'}\n`);

    } catch (error) {
        console.error('Trade failed:', error.message);
        console.log('\nMake sure:');
        console.log('1. Backend server is running (npm run backend)');
        console.log('2. You have testnet USDC on Base Sepolia');
        console.log('3. Your staking contract has funds');
    }

    // Step 5: Show how DeBridge works behind the scenes
    console.log('\n=== How It Works (Behind the Scenes) ===');
    console.log('1. You submit trade with USDC from Base');
    console.log('2. Backend initiates DeBridge (async, 2 seconds)');
    console.log('3. Shared EOA executes trade IMMEDIATELY on HyperLiquid');
    console.log('4. Your trade is done in <500ms!');
    console.log('5. Bridge completes in background, refills shared EOA');
    console.log('6. Settlement returns your trade proceeds\n');

    console.log('===========================================');
    console.log('          Demo Complete!                   ');
    console.log('===========================================');
}

// Run the demo
demonstrateBaseUSDCTrading().catch(console.error);