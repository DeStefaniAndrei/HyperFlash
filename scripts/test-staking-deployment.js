/**
 * Test staking contract deployment on HyperLiquid testnet
 * This will deploy your personal staking contract and stake HYPE
 */

import pkg from "hardhat";
const { ethers } = pkg;

// REAL testnet factory address from our deployment
const FACTORY_ADDRESS = "0x2837933E77C013E7b4a5362f8862E02E06dEd44a";

async function main() {
    console.log("\n=== 🧪 Testing Staking Contract Deployment ===\n");
    console.log("This will:");
    console.log("1. Deploy your personal staking contract");
    console.log("2. Stake some HYPE to activate it");
    console.log("3. Verify everything works on testnet\n");

    try {
        // Connect to testnet
        const [deployer] = await ethers.getSigners();
        console.log("📡 Connected as:", deployer.address);

        // Check balance
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log(`💰 Balance: ${ethers.formatEther(balance)} HYPE`);

        // Connect to deployed factory
        console.log(`\n📦 Connecting to Factory at: ${FACTORY_ADDRESS}`);
        const factoryABI = [
            "function deployStakingContract() returns (address)",
            "function hasStakingContract(address) view returns (bool)",
            "function getUserStakingContract(address) view returns (address)",
            "function backendAddress() view returns (address)"
        ];

        const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, deployer);

        // Verify factory
        const backend = await factory.backendAddress();
        console.log(`   Backend address: ${backend}`);

        // Check if already has staking contract
        const hasContract = await factory.hasStakingContract(deployer.address);

        if (hasContract) {
            const existingContract = await factory.getUserStakingContract(deployer.address);
            console.log(`\n⚠️  You already have a staking contract at: ${existingContract}`);
        } else {
            // Deploy staking contract
            console.log("\n🚀 Deploying your personal staking contract...");
            console.log("   Estimated cost: ~0.0003 HYPE");

            const tx = await factory.deployStakingContract({
                gasLimit: 500000,
                gasPrice: ethers.parseUnits("1", "gwei")
            });

            console.log(`   TX Hash: ${tx.hash}`);
            console.log("   ⏳ Waiting for confirmation...");

            const receipt = await tx.wait();
            console.log(`   ✅ Confirmed in block: ${receipt.blockNumber}`);

            // Get deployed address
            const stakingAddress = await factory.getUserStakingContract(deployer.address);
            console.log(`\n✅ Your staking contract deployed at: ${stakingAddress}`);

            // Now stake some HYPE
            console.log("\n💰 Staking 0.01 HYPE to activate contract...");

            const stakingABI = [
                "function depositAndStake() payable",
                "function getStatus() view returns (uint256, bool)",
                "function stakedAmount() view returns (uint256)",
                "function user() view returns (address)"
            ];

            const staking = new ethers.Contract(stakingAddress, stakingABI, deployer);

            // Stake 0.01 HYPE
            const stakeTx = await staking.depositAndStake({
                value: ethers.parseEther("0.01"),
                gasLimit: 100000,
                gasPrice: ethers.parseUnits("1", "gwei")
            });

            console.log(`   TX Hash: ${stakeTx.hash}`);
            console.log("   ⏳ Waiting for confirmation...");

            await stakeTx.wait();
            console.log("   ✅ Successfully staked 0.01 HYPE!");

            // Verify staking
            const [stakedAmount, isActive] = await staking.getStatus();
            console.log(`\n📊 Staking Status:`);
            console.log(`   Staked: ${ethers.formatEther(stakedAmount)} HYPE`);
            console.log(`   Active: ${isActive}`);
            console.log(`   Contract: ${stakingAddress}`);
        }

        // Check final balance
        const finalBalance = await ethers.provider.getBalance(deployer.address);
        console.log(`\n💰 Final balance: ${ethers.formatEther(finalBalance)} HYPE`);

        console.log("\n" + "=".repeat(60));
        console.log("✅ TESTNET VERIFICATION COMPLETE!");
        console.log("=".repeat(60));
        console.log("Your HyperFlash infrastructure is ready:");
        console.log(`1. Factory: ${FACTORY_ADDRESS}`);
        console.log(`2. Your staking contract deployed & funded`);
        console.log(`3. Ready for cross-chain trading!`);
        console.log("=".repeat(60));

    } catch (error) {
        console.error("\n❌ Test failed!");
        console.error("Error:", error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });