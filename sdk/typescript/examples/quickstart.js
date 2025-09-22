/**
 * HyperFlash SDK - Quick Start Example
 *
 * This shows the simplest way to use HyperFlash
 */

// Import the SDK
const { HyperFlashSDK } = require('@hyperflash/sdk');

async function quickstart() {
    // Step 1: Create SDK instance
    const sdk = new HyperFlashSDK({
        network: 'testnet',
        privateKey: 'your_private_key_here'  // Replace with your actual key
    });

    // Step 2: Check if you have a staking contract
    const status = await sdk.checkStakingStatus();

    if (!status.hasStaking) {
        console.log('No staking contract found. Deploying one...');

        // Step 3: Deploy a staking contract
        const contractAddress = await sdk.deployStakingContract();
        console.log(`✅ Contract deployed at: ${contractAddress}`);

        // Step 4: Stake some funds to activate
        await sdk.stakeFunds(0.1);  // Stake 0.1 ETH
        console.log('✅ Funds staked!');
    }

    // Step 5: Execute a trade!
    const trade = await sdk.executeTrade({
        sourceToken: 'USDC',
        amount: 1000,
        targetPair: 'BTC/USDC',
        side: 'buy'
    });

    console.log(`🚀 Trade executed in ${trade.executionTime}ms!`);
    console.log(`Trade ID: ${trade.tradeId}`);
}

// Run the example
quickstart().catch(console.error);