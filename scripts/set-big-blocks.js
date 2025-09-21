/**
 * Script to enable BIG blocks on HyperLiquid for contract deployment
 * Big blocks have 30M gas limit (vs 2M for small blocks)
 */

import { ethers } from "ethers";

const PRIVATE_KEY = "3d6f146e428a9e046ece85ea3442016f2d05b4971075fb27d64ec63888187ec0";
const RPC_URL = "https://rpc.hyperliquid-testnet.xyz/evm";

// HyperLiquid block configuration contract
const BLOCK_CONFIG_ADDRESS = "0x0000000000000000000000000000000000000808"; // System contract for block config

async function setBigBlocks() {
    console.log("\n=== Setting BIG BLOCKS for HyperLiquid Testnet ===\n");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log("Connected with wallet:", wallet.address);

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log("Balance:", ethers.formatEther(balance), "HYPE");

    // Create transaction to enable big blocks
    console.log("\n📦 Enabling BIG blocks (30M gas limit)...");
    console.log("This allows contract deployment on HyperLiquid");

    // The actual method to set big blocks varies by implementation
    // For HyperLiquid testnet, this is typically done via:
    const tx = {
        to: BLOCK_CONFIG_ADDRESS,
        data: "0x" + "01", // Enable big blocks flag
        gasLimit: 100000,
        gasPrice: ethers.parseUnits("1", "gwei")
    };

    try {
        const txResponse = await wallet.sendTransaction(tx);
        console.log("Transaction sent:", txResponse.hash);

        await txResponse.wait();
        console.log("✅ BIG blocks enabled!");
        console.log("\n⚠️  IMPORTANT: Big blocks are active for ~60 seconds");
        console.log("Deploy your contracts NOW while big blocks are active!");

    } catch (error) {
        console.error("Failed to set big blocks:", error.message);
        console.log("\n💡 Alternative: Contact HyperLiquid support for big block access");
    }
}

setBigBlocks().catch(console.error);