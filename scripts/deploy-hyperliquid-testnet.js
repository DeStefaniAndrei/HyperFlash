/**
 * HyperLiquid Testnet Deployment Script
 * Deploys the Factory contract to HyperLiquid testnet with REAL HYPE
 */

import pkg from "hardhat";
const { ethers } = pkg;
import { ethers as ethersLib } from "ethers";

async function main() {
    console.log("\n=== 🚀 HyperLiquid Testnet Deployment ===\n");
    console.log("Deploying REAL contracts to HyperLiquid testnet");
    console.log("Using test wallet with 0.09 HYPE\n");

    try {
        // Test wallet that has the HYPE
        const TEST_WALLET_PRIVATE_KEY = "3d6f146e428a9e046ece85ea3442016f2d05b4971075fb27d64ec63888187ec0";
        const TEST_WALLET_ADDRESS = "0xF5AD9A14152ee5c12d17d9C1e99fe8193F27Eb8F";

        // Connect directly to HyperLiquid testnet
        console.log("📡 Connecting to HyperLiquid testnet RPC...");
        const provider = new ethersLib.JsonRpcProvider("https://rpc.hyperliquid-testnet.xyz/evm");
        const wallet = new ethersLib.Wallet(TEST_WALLET_PRIVATE_KEY, provider);

        console.log(`✅ Connected with wallet: ${wallet.address}`);

        // Check balance
        console.log("\n💰 Checking HYPE balance...");
        const balance = await provider.getBalance(wallet.address);
        const balanceInHYPE = ethersLib.formatEther(balance);
        console.log(`   Balance: ${balanceInHYPE} HYPE`);

        if (parseFloat(balanceInHYPE) < 0.01) {
            console.error("❌ Insufficient balance! Need at least 0.01 HYPE");
            process.exit(1);
        }

        // Configuration for deployment
        const BACKEND_ADDRESS = TEST_WALLET_ADDRESS; // Using same address as backend for now
        const SHARED_EOA = "0x1234567890123456789012345678901234567890"; // Placeholder

        // Deploy Factory contract
        console.log("\n📦 Deploying Factory contract...");
        console.log("   Backend address:", BACKEND_ADDRESS);
        console.log("   Shared EOA:", SHARED_EOA);
        console.log("   Estimated gas: ~0.001 HYPE");

        const Factory = await ethers.getContractFactory("Factory", wallet);

        console.log("\n📤 Sending deployment transaction...");
        const factory = await Factory.deploy(
            BACKEND_ADDRESS,
            SHARED_EOA,
            {
                gasLimit: 3000000, // 3M gas
                gasPrice: ethersLib.parseUnits("1", "gwei") // 1 gwei
            }
        );

        console.log("   TX Hash:", factory.deploymentTransaction().hash);
        console.log("   ⏳ Waiting for confirmation (this may take 10-30 seconds)...");

        // Wait for deployment
        await factory.waitForDeployment();
        const factoryAddress = await factory.getAddress();

        console.log(`\n✅ SUCCESS! Factory deployed to: ${factoryAddress}`);

        // Verify deployment
        console.log("\n🔍 Verifying deployment...");
        const backendAddr = await factory.backendAddress();
        const sharedEOA = await factory.sharedEOA();
        const deployedCount = await factory.getTotalDeployedContracts();

        console.log(`   Backend address verified: ${backendAddr}`);
        console.log(`   Shared EOA verified: ${sharedEOA}`);
        console.log(`   Total staking contracts: ${deployedCount}`);

        // Check remaining balance
        const newBalance = await provider.getBalance(wallet.address);
        const newBalanceInHYPE = ethersLib.formatEther(newBalance);
        const gasUsed = parseFloat(balanceInHYPE) - parseFloat(newBalanceInHYPE);

        console.log(`\n💸 Deployment costs:`);
        console.log(`   Gas used: ${gasUsed.toFixed(6)} HYPE`);
        console.log(`   Remaining balance: ${newBalanceInHYPE} HYPE`);

        // Save deployment info
        console.log("\n" + "=".repeat(60));
        console.log("📝 DEPLOYMENT SUCCESSFUL - SAVE THIS INFO:");
        console.log("=".repeat(60));
        console.log(`Factory Address: ${factoryAddress}`);
        console.log(`Network: HyperLiquid Testnet`);
        console.log(`Chain ID: 998`);
        console.log(`Deployer: ${wallet.address}`);
        console.log(`Block Explorer: https://explorer.hyperliquid-testnet.xyz/address/${factoryAddress}`);
        console.log("=".repeat(60));

        console.log("\n🎉 Next steps:");
        console.log("1. Update backend to use factory:", factoryAddress);
        console.log("2. Deploy your staking contract (costs ~0.0005 HYPE)");
        console.log("3. Stake some HYPE to activate (~0.01 HYPE)");
        console.log("4. Execute cross-chain trades!");

        return factoryAddress;

    } catch (error) {
        console.error("\n❌ Deployment failed!");
        console.error("Error:", error.message);

        if (error.message.includes("insufficient funds")) {
            console.error("\n💡 Need more HYPE for gas");
        } else if (error.message.includes("network")) {
            console.error("\n💡 Network connection issue. Check if testnet RPC is accessible");
        }

        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });