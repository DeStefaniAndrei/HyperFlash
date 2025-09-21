/**
 * Deploy optimized Factory to HyperLiquid Testnet
 * This version fits within the 2M gas limit of small blocks
 */

import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
    console.log("\n=== 🚀 HyperLiquid Testnet Deployment (Optimized) ===\n");
    console.log("Deploying optimized contract that fits in 2M gas limit");
    console.log("No need for big blocks!\n");

    try {
        // Get the deployer (uses wallet from hardhat config)
        const [deployer] = await ethers.getSigners();
        console.log("📡 Deploying with account:", deployer.address);

        // Check balance on testnet
        const balance = await ethers.provider.getBalance(deployer.address);
        const balanceInHYPE = ethers.formatEther(balance);
        console.log(`💰 Balance: ${balanceInHYPE} HYPE`);

        if (parseFloat(balanceInHYPE) < 0.005) {
            console.error("❌ Insufficient balance! Need at least 0.005 HYPE");
            process.exit(1);
        }

        // Deploy optimized factory
        console.log("\n📦 Deploying FactoryOptimized contract...");
        console.log("   This optimized version uses less gas");
        console.log("   Estimated gas: ~500k (fits in 2M limit)");

        const Factory = await ethers.getContractFactory("FactoryOptimized");

        // Backend address (using test wallet as backend)
        const BACKEND_ADDRESS = "0xF5AD9A14152ee5c12d17d9C1e99fe8193F27Eb8F";

        console.log("   Backend address:", BACKEND_ADDRESS);
        console.log("\n📤 Sending deployment transaction...");

        const factory = await Factory.deploy(
            BACKEND_ADDRESS,
            {
                gasLimit: 1500000, // 1.5M gas (well within 2M limit)
                gasPrice: ethers.parseUnits("1", "gwei")
            }
        );

        console.log("   TX Hash:", factory.deploymentTransaction().hash);
        console.log("   ⏳ Waiting for confirmation (usually 1-5 seconds)...");

        // Wait for deployment
        await factory.waitForDeployment();
        const factoryAddress = await factory.getAddress();

        console.log(`\n✅ SUCCESS! Factory deployed to: ${factoryAddress}`);

        // Verify deployment
        console.log("\n🔍 Verifying deployment...");
        const backendAddr = await factory.backendAddress();
        console.log(`   Backend verified: ${backendAddr}`);

        // Check remaining balance
        const newBalance = await ethers.provider.getBalance(deployer.address);
        const newBalanceInHYPE = ethers.formatEther(newBalance);
        const gasUsed = parseFloat(balanceInHYPE) - parseFloat(newBalanceInHYPE);

        console.log(`\n💸 Deployment costs:`);
        console.log(`   Gas used: ~${gasUsed.toFixed(6)} HYPE`);
        console.log(`   Remaining balance: ${newBalanceInHYPE} HYPE`);

        // Save deployment info
        console.log("\n" + "=".repeat(60));
        console.log("📝 DEPLOYMENT SUCCESSFUL!");
        console.log("=".repeat(60));
        console.log(`Factory Address: ${factoryAddress}`);
        console.log(`Network: HyperLiquid Testnet`);
        console.log(`Chain ID: 998`);
        console.log(`Deployer: ${deployer.address}`);
        console.log(`Explorer: https://explorer.hyperliquid-testnet.xyz/address/${factoryAddress}`);
        console.log("=".repeat(60));

        console.log("\n🎉 Next steps:");
        console.log(`1. Backend: node backend/server.js ${factoryAddress}`);
        console.log("2. Deploy your staking contract via factory.deployStakingContract()");
        console.log("3. Stake HYPE using depositAndStake()");
        console.log("4. Start cross-chain trading!");

        // Save to file
        const fs = await import('fs');
        const deploymentInfo = {
            factoryAddress,
            contractType: "FactoryOptimized",
            network: "hyperliquid-testnet",
            chainId: 998,
            deployer: deployer.address,
            deployedAt: new Date().toISOString(),
            backendAddress: BACKEND_ADDRESS,
            gasUsed: gasUsed.toFixed(6),
            remainingBalance: newBalanceInHYPE
        };

        await fs.promises.writeFile(
            'deployment-testnet.json',
            JSON.stringify(deploymentInfo, null, 2)
        );

        console.log("\n📄 Deployment info saved to: deployment-testnet.json");

        return factoryAddress;

    } catch (error) {
        console.error("\n❌ Deployment failed!");
        console.error("Error:", error.message);

        if (error.message.includes("exceeds block gas limit")) {
            console.error("\n💡 Still too large! Need to optimize further");
        } else if (error.message.includes("insufficient funds")) {
            console.error("\n💡 Need more HYPE for gas");
        } else if (error.message.includes("network")) {
            console.error("\n💡 Connection issue with testnet RPC");
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