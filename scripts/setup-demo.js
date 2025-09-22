/**
 * Setup Demo Script
 * Deploys and funds a staking contract for demo purposes
 */

import { ethers } from "ethers";
import dotenv from 'dotenv';

dotenv.config();

const FACTORY_ADDRESS = "0xE51F12Dbc2fC2BD855887f247FB3793dC564a9A6";

// Factory ABI
const FACTORY_ABI = [
    "function getUserStakingContract(address user) view returns (address)",
    "function hasStakingContract(address user) view returns (bool)",
    "function deployStakingContract() returns (address)",
    "event StakingContractDeployed(address indexed user, address stakingContract)"
];

// Staking Contract ABI
const STAKING_ABI = [
    "function depositAndStake() payable",
    "function getStatus() view returns (uint256, bool)",
    "function stakedAmount() view returns (uint256)"
];

async function setupDemo() {
    console.log("\n=== HyperFlash Demo Setup ===\n");

    // Connect to HyperLiquid mainnet
    const provider = new ethers.JsonRpcProvider("https://rpc.hyperliquid.xyz/evm");

    // Use deployer wallet - hardcoded for now since env is having issues
    const privateKey = "1c7273e8ab35b009e26b60cbeb13c845d228af204f917387b12ec6c20afa524c";
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log("Using wallet:", wallet.address);

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log("Wallet balance:", ethers.formatEther(balance), "HYPE");

    if (balance < ethers.parseEther("0.05")) {
        console.error("Insufficient HYPE balance. Need at least 0.05 HYPE");
        return;
    }

    // Connect to factory
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);

    // Check if staking contract already exists
    const hasContract = await factory.hasStakingContract(wallet.address);

    let stakingAddress;

    if (hasContract) {
        stakingAddress = await factory.getUserStakingContract(wallet.address);
        console.log("Staking contract already exists at:", stakingAddress);
    } else {
        console.log("Deploying new staking contract...");

        try {
            const tx = await factory.deployStakingContract({
                gasLimit: 3000000,
                gasPrice: ethers.parseUnits("20", "gwei")
            });

            console.log("Transaction hash:", tx.hash);
            console.log("Waiting for confirmation...");

            const receipt = await tx.wait();
            console.log("Confirmed in block:", receipt.blockNumber);

            // Get deployed contract address
            stakingAddress = await factory.getUserStakingContract(wallet.address);
            console.log("Staking contract deployed at:", stakingAddress);
        } catch (error) {
            console.error("Failed to deploy staking contract:", error);
            return;
        }
    }

    // Connect to staking contract
    const stakingContract = new ethers.Contract(stakingAddress, STAKING_ABI, wallet);

    // Check current stake
    const currentStake = await stakingContract.stakedAmount();
    console.log("Current stake:", ethers.formatEther(currentStake), "HYPE");

    // Fund the contract if needed
    if (currentStake < ethers.parseEther("0.01")) {
        console.log("\nFunding staking contract with 0.05 HYPE...");

        try {
            const fundTx = await stakingContract.depositAndStake({
                value: ethers.parseEther("0.05"),
                gasLimit: 200000,
                gasPrice: ethers.parseUnits("20", "gwei")
            });

            console.log("Transaction hash:", fundTx.hash);
            console.log("Waiting for confirmation...");

            await fundTx.wait();
            console.log("Staking contract funded!");

            // Check new status
            const [stakedAmount, isActive] = await stakingContract.getStatus();
            console.log("\nStaking Status:");
            console.log("- Staked:", ethers.formatEther(stakedAmount), "HYPE");
            console.log("- Active:", isActive);

        } catch (error) {
            console.error("Failed to fund staking contract:", error);
            return;
        }
    }

    console.log("\n=== Demo Setup Complete ===");
    console.log("You can now run the demo with:");
    console.log("  cd demo && node cli_demo.js");
}

// Run setup
setupDemo().catch(console.error);