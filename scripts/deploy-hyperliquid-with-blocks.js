/**
 * HyperLiquid Testnet Deployment Script with Block Management
 * Uses HyperLiquid's dual block architecture for deployment
 */

import pkg from "hardhat";
const { ethers } = pkg;
import { ethers as ethersLib } from "ethers";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function switchToBlockMode(mode, privateKey) {
    console.log(`\n🔄 Switching to ${mode.toUpperCase()} blocks...`);

    try {
        const command = `npx @layerzerolabs/hyperliquid-composer set-block --size ${mode} --network testnet --private-key ${privateKey}`;
        console.log("   Running:", command.replace(privateKey, "***"));

        const { stdout, stderr } = await execAsync(command);

        if (stderr && !stderr.includes("Warning")) {
            throw new Error(`Block switch failed: ${stderr}`);
        }

        console.log(`   ✅ Switched to ${mode} blocks`);

        // Wait for the change to take effect
        console.log("   ⏳ Waiting for block mode change to propagate...");
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

        return true;
    } catch (error) {
        console.error(`   ❌ Failed to switch blocks: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log("\n=== 🚀 HyperLiquid Testnet Deployment (with Block Management) ===\n");
    console.log("This deployment uses HyperLiquid's dual block architecture:");
    console.log("  - Small blocks: 2M gas, 1 second (normal transactions)");
    console.log("  - Big blocks: 30M gas, 1 minute (contract deployment)");

    // Test wallet that has the HYPE
    const TEST_WALLET_PRIVATE_KEY = "3d6f146e428a9e046ece85ea3442016f2d05b4971075fb27d64ec63888187ec0";
    const TEST_WALLET_ADDRESS = "0xF5AD9A14152ee5c12d17d9C1e99fe8193F27Eb8F";

    try {
        // Connect to HyperLiquid testnet
        console.log("\n📡 Connecting to HyperLiquid testnet...");
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

        // Step 1: Switch to BIG blocks for deployment
        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("STEP 1: Enabling BIG BLOCKS for deployment");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        const bigBlocksEnabled = await switchToBlockMode("big", TEST_WALLET_PRIVATE_KEY);
        if (!bigBlocksEnabled) {
            console.error("\n⚠️  Could not switch to big blocks automatically");
            console.error("Please run manually:");
            console.error(`npx @layerzerolabs/hyperliquid-composer set-block --size big --network testnet --private-key YOUR_PRIVATE_KEY`);
            console.error("\nThen re-run this deployment script");
            process.exit(1);
        }

        // Configuration for deployment
        const BACKEND_ADDRESS = TEST_WALLET_ADDRESS;
        const SHARED_EOA = "0x1234567890123456789012345678901234567890";

        // Step 2: Deploy Factory contract with BIG blocks
        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("STEP 2: Deploying Factory contract");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("   Backend address:", BACKEND_ADDRESS);
        console.log("   Shared EOA:", SHARED_EOA);
        console.log("   Using BIG blocks (30M gas limit)");

        const Factory = await ethers.getContractFactory("Factory", wallet);

        console.log("\n📤 Sending deployment transaction...");
        const factory = await Factory.deploy(
            BACKEND_ADDRESS,
            SHARED_EOA,
            {
                gasLimit: 5000000, // 5M gas (well within 30M limit)
                gasPrice: ethersLib.parseUnits("1", "gwei")
            }
        );

        console.log("   TX Hash:", factory.deploymentTransaction().hash);
        console.log("   ⏳ Waiting for confirmation (may take up to 60 seconds with big blocks)...");

        // Wait for deployment
        await factory.waitForDeployment();
        const factoryAddress = await factory.getAddress();

        console.log(`\n✅ SUCCESS! Factory deployed to: ${factoryAddress}`);

        // Verify deployment
        console.log("\n🔍 Verifying deployment...");
        const backendAddr = await factory.backendAddress();
        const sharedEOA = await factory.sharedEOA();

        console.log(`   Backend verified: ${backendAddr}`);
        console.log(`   Shared EOA verified: ${sharedEOA}`);

        // Check gas usage
        const newBalance = await provider.getBalance(wallet.address);
        const newBalanceInHYPE = ethersLib.formatEther(newBalance);
        const gasUsed = parseFloat(balanceInHYPE) - parseFloat(newBalanceInHYPE);

        console.log(`\n💸 Deployment costs:`);
        console.log(`   Gas used: ${gasUsed.toFixed(6)} HYPE`);
        console.log(`   Remaining balance: ${newBalanceInHYPE} HYPE`);

        // Step 3: Switch back to SMALL blocks for normal operations
        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("STEP 3: Switching back to SMALL BLOCKS");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        await switchToBlockMode("small", TEST_WALLET_PRIVATE_KEY);

        // Save deployment info
        console.log("\n" + "=".repeat(60));
        console.log("📝 DEPLOYMENT SUCCESSFUL!");
        console.log("=".repeat(60));
        console.log(`Factory Address: ${factoryAddress}`);
        console.log(`Network: HyperLiquid Testnet`);
        console.log(`Chain ID: 998`);
        console.log(`Deployer: ${wallet.address}`);
        console.log(`Explorer: https://explorer.hyperliquid-testnet.xyz/address/${factoryAddress}`);
        console.log("=".repeat(60));

        console.log("\n🎉 Next steps:");
        console.log("1. Save the factory address:", factoryAddress);
        console.log("2. Update backend to use this address");
        console.log("3. Deploy your staking contract (small blocks OK)");
        console.log("4. Stake HYPE and start trading!");

        // Save to file for easy reference
        const fs = await import('fs');
        const deploymentInfo = {
            factoryAddress,
            network: "hyperliquid-testnet",
            chainId: 998,
            deployer: wallet.address,
            deployedAt: new Date().toISOString(),
            backendAddress: BACKEND_ADDRESS,
            sharedEOA: SHARED_EOA
        };

        fs.writeFileSync(
            'deployment-testnet.json',
            JSON.stringify(deploymentInfo, null, 2)
        );
        console.log("\n📄 Deployment info saved to: deployment-testnet.json");

    } catch (error) {
        console.error("\n❌ Deployment failed!");
        console.error("Error:", error.message);

        if (error.message.includes("exceeds block gas limit")) {
            console.error("\n💡 Contract too large for current block mode");
            console.error("   Make sure BIG blocks are enabled");
        } else if (error.message.includes("insufficient funds")) {
            console.error("\n💡 Need more HYPE for gas");
        }

        // Try to switch back to small blocks even on failure
        console.log("\n🔄 Switching back to small blocks...");
        await switchToBlockMode("small", TEST_WALLET_PRIVATE_KEY);

        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });