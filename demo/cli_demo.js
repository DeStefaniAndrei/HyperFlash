#!/usr/bin/env node

/**
 * HyperFlash CLI Demo - REAL VERSION
 * Demonstrates REAL cross-chain HFT trading with actual backend
 */

import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import { ethers } from "ethers";
import axios from "axios";

// Configuration
const CONFIG = {
    // Test wallet (public - no real funds)
    TEST_PRIVATE_KEY: "3d6f146e428a9e046ece85ea3442016f2d05b4971075fb27d64ec63888187ec0",
    TEST_ADDRESS: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Hardhat account[0]

    // REAL Backend URL
    BACKEND_URL: "http://localhost:3000",

    // Demo validator address
    VALIDATOR_ADDRESS: "0x0000000000000000000000000000000000000001",

    // Local RPC
    RPC_URL: "http://127.0.0.1:8545",

    // Factory address (update after deployment)
    FACTORY_ADDRESS: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
};

// Factory ABI for REAL interaction
const FACTORY_ABI = [
    "function deployStakingContract(address validator) external returns (address)",
    "function getUserStakingContract(address user) view returns (address)",
    "function hasStakingContract(address user) view returns (bool)"
];

// UserStaking ABI for REAL interaction
const USER_STAKING_ABI = [
    "function depositAndStake() external payable",
    "function getStatus() external view returns (uint256, bool)",
    "function stakedAmount() view returns (uint256)",
    "function isSlashed() view returns (bool)"
];

// ASCII Art Banner
const BANNER = `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██╗  ██╗██╗   ██╗██████╗ ███████╗██████╗ ███████╗██╗      ║
║   ██║  ██║╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██╔════╝██║      ║
║   ███████║ ╚████╔╝ ██████╔╝█████╗  ██████╔╝█████╗  ██║      ║
║   ██╔══██║  ╚██╔╝  ██╔═══╝ ██╔══╝  ██╔══██╗██╔══╝  ██║      ║
║   ██║  ██║   ██║   ██║   ███████╗██║  ██║██║     ███████╗ ║
║   ╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝ ║
║                                                               ║
║           CROSS-CHAIN HFT INFRASTRUCTURE [REAL]              ║
║              Instant Trading • Zero Bridge Wait              ║
╚═══════════════════════════════════════════════════════════════╝
`;

class HyperFlashDemo {
    constructor() {
        this.trades = [];
        this.totalTime = 0;
        this.provider = null;
        this.signer = null;
        this.factory = null;
        this.stakingContract = null;
        this.stakingAddress = null;
    }

    /**
     * Initialize REAL blockchain connections
     */
    async initialize() {
        const spinner = ora(chalk.cyan("Connecting to blockchain...")).start();

        try {
            // Connect to local node
            this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
            this.signer = new ethers.Wallet(CONFIG.TEST_PRIVATE_KEY, this.provider);

            // Connect to factory contract
            this.factory = new ethers.Contract(CONFIG.FACTORY_ADDRESS, FACTORY_ABI, this.signer);

            // Check backend health
            const health = await axios.get(`${CONFIG.BACKEND_URL}/health`);
            if (health.data.status !== "healthy") {
                throw new Error("Backend is not healthy");
            }

            spinner.succeed(chalk.green("✓ Connected to blockchain and backend"));
            console.log(chalk.gray(`  Backend mode: ${health.data.mode}`));
            console.log(chalk.gray(`  Factory address: ${CONFIG.FACTORY_ADDRESS}`));

        } catch (error) {
            spinner.fail(chalk.red("Failed to connect"));
            console.error(chalk.red(`Error: ${error.message}`));
            process.exit(1);
        }
    }

    /**
     * Display welcome screen
     */
    welcome() {
        console.clear();
        console.log(chalk.cyan(BANNER));
        console.log(chalk.gray("─".repeat(65)));
        console.log(chalk.white("  Welcome to HyperFlash - REAL Implementation"));
        console.log(chalk.gray("─".repeat(65)));
        console.log();
    }

    /**
     * Display comparison with traditional bridges
     */
    showComparison() {
        console.log(chalk.yellow("\n📊 Speed Comparison:\n"));

        const data = [
            { method: "Traditional Bridge", time: "10-30 seconds", emoji: "🐌" },
            { method: "Optimistic Bridge", time: "2-5 seconds", emoji: "🚶" },
            { method: "HyperFlash", time: "<0.5 seconds", emoji: "⚡" }
        ];

        data.forEach(item => {
            const bar = item.method === "HyperFlash" ? chalk.green("█".repeat(40)) : chalk.red("█".repeat(20));
            console.log(`  ${item.emoji} ${chalk.white(item.method.padEnd(20))} ${bar} ${chalk.gray(item.time)}`);
        });
    }

    /**
     * Check REAL staking status
     */
    async checkStaking() {
        const spinner = ora(chalk.cyan("[REAL] Checking staking status...")).start();

        try {
            await this.delay(500);

            // Check if user has staking contract
            const hasContract = await this.factory.hasStakingContract(this.signer.address);

            if (!hasContract) {
                spinner.warn(chalk.yellow("⚠ No staking contract deployed"));
                console.log(chalk.gray(`    Use option to deploy staking contract first`));
                return false;
            }

            // Get staking contract address
            this.stakingAddress = await this.factory.getUserStakingContract(this.signer.address);
            this.stakingContract = new ethers.Contract(
                this.stakingAddress,
                USER_STAKING_ABI,
                this.signer
            );

            // Get REAL staking status
            const [stakedAmount, isActive] = await this.stakingContract.getStatus();
            const isSlashed = await this.stakingContract.isSlashed();

            spinner.succeed(chalk.green("✓ [REAL] Staking contract found"));
            console.log(chalk.gray(`    Address: ${this.stakingAddress}`));
            console.log(chalk.gray(`    Staked: ${ethers.formatEther(stakedAmount)} ETH`));
            console.log(chalk.gray(`    Status: ${isActive ? "Active" : "Inactive"}`));
            console.log(chalk.gray(`    Slashed: ${isSlashed ? "Yes" : "No"}`));

            return true;
        } catch (error) {
            spinner.fail(chalk.red("Failed to check staking"));
            console.error(chalk.red(`Error: ${error.message}`));
            return false;
        }
    }

    /**
     * Deploy REAL staking contract
     */
    async deployStakingContract() {
        const spinner = ora(chalk.cyan("[REAL] Deploying staking contract...")).start();

        try {
            // Check if already has contract
            const hasContract = await this.factory.hasStakingContract(this.signer.address);
            if (hasContract) {
                spinner.warn("Already has staking contract");
                const address = await this.factory.getUserStakingContract(this.signer.address);
                console.log(chalk.gray(`    Address: ${address}`));
                return;
            }

            // Deploy new staking contract
            const tx = await this.factory.deployStakingContract(CONFIG.VALIDATOR_ADDRESS);
            spinner.text = "Waiting for confirmation...";

            const receipt = await tx.wait();
            const stakingAddress = await this.factory.getUserStakingContract(this.signer.address);

            spinner.succeed(chalk.green("✓ [REAL] Staking contract deployed"));
            console.log(chalk.gray(`    Contract address: ${stakingAddress}`));
            console.log(chalk.gray(`    Transaction hash: ${receipt.hash}`));
            console.log(chalk.gray(`    Block: ${receipt.blockNumber}`));

            this.stakingAddress = stakingAddress;
            this.stakingContract = new ethers.Contract(stakingAddress, USER_STAKING_ABI, this.signer);

        } catch (error) {
            spinner.fail(chalk.red("Deployment failed"));
            console.error(chalk.red(`Error: ${error.message}`));
        }
    }

    /**
     * Deposit and stake funds (REAL)
     */
    async depositAndStake() {
        const response = await prompts({
            type: "number",
            name: "amount",
            message: "How much ETH to stake?",
            initial: 0.1,
            min: 0.01,
            max: 10
        });

        if (!response.amount) return;

        const spinner = ora(chalk.cyan(`[REAL] Staking ${response.amount} ETH...`)).start();

        try {
            if (!this.stakingContract) {
                throw new Error("No staking contract found");
            }

            // Send REAL transaction to stake
            const tx = await this.stakingContract.depositAndStake({
                value: ethers.parseEther(response.amount.toString())
            });

            spinner.text = "Waiting for confirmation...";
            const receipt = await tx.wait();

            spinner.succeed(chalk.green(`✓ [REAL] Staked ${response.amount} ETH`));
            console.log(chalk.gray(`    Transaction hash: ${receipt.hash}`));
            console.log(chalk.gray(`    Gas used: ${receipt.gasUsed}`));

        } catch (error) {
            spinner.fail(chalk.red("Staking failed"));
            console.error(chalk.red(`Error: ${error.message}`));
        }
    }

    /**
     * Execute a REAL trade via backend
     */
    async executeTrade(index, params) {
        const startTime = Date.now();
        const spinner = ora(chalk.cyan(`[REAL] Executing trade ${index}...`)).start();

        try {
            // Call REAL backend API
            const response = await axios.post(`${CONFIG.BACKEND_URL}/trade/initiate`, {
                userAddress: this.signer.address,
                amount: params.amount || "1000000", // 1 USDC (6 decimals)
                tradeParams: {
                    pair: params.pair || "BTC/USDC",
                    side: params.side || "buy",
                    price: params.price || 50000,
                    type: "limit"
                }
            });

            const executionTime = (Date.now() - startTime) / 1000;

            if (response.data.success) {
                spinner.succeed(chalk.green(`✓ [REAL] Trade ${index} executed in ${executionTime.toFixed(3)}s`));

                const trade = {
                    id: response.data.tradeId,
                    pair: params.pair || "BTC/USDC",
                    side: params.side || "buy",
                    amount: params.amount || "1000000",
                    executionTime: executionTime,
                    bridgeTxHash: response.data.bridgeTxHash,
                    debridgeId: response.data.debridgeId,
                    timestamp: response.data.timestamp
                };

                console.log(chalk.gray(`    Trade ID: ${trade.id}`));
                console.log(chalk.gray(`    Bridge TX: ${trade.bridgeTxHash?.substring(0, 10)}...`));
                console.log(chalk.gray(`    DeBridge ID: ${trade.debridgeId?.substring(0, 10)}...`));

                this.trades.push(trade);
                this.totalTime += executionTime;

                return trade;
            } else {
                throw new Error(response.data.error || "Trade failed");
            }

        } catch (error) {
            spinner.fail(chalk.red(`Trade ${index} failed`));
            console.error(chalk.red(`    Error: ${error.response?.data?.error || error.message}`));
            return null;
        }
    }

    /**
     * Check REAL trade status
     */
    async checkTradeStatus(tradeId) {
        const spinner = ora(chalk.cyan("[REAL] Checking trade status...")).start();

        try {
            const response = await axios.get(`${CONFIG.BACKEND_URL}/trade/status/${tradeId}`);

            spinner.succeed(chalk.green("✓ Trade status retrieved"));
            const status = response.data;

            console.log(chalk.gray(`    Trade ID: ${status.tradeId}`));
            console.log(chalk.gray(`    User: ${status.user}`));
            console.log(chalk.gray(`    Amount: ${status.amount}`));
            console.log(chalk.gray(`    Bridge completed: ${status.bridgeCompleted}`));
            console.log(chalk.gray(`    Trade executed: ${status.tradeExecuted}`));
            console.log(chalk.gray(`    On-chain active: ${status.onChainActive}`));
            console.log(chalk.gray(`    Elapsed: ${(status.elapsed / 1000).toFixed(1)}s`));

        } catch (error) {
            spinner.fail(chalk.red("Failed to get status"));
            console.error(chalk.red(`Error: ${error.response?.data?.error || error.message}`));
        }
    }

    /**
     * Execute rapid fire REAL trades
     */
    async rapidFireDemo() {
        console.log(chalk.yellow("\n🚀 [REAL] Rapid Fire Trading Demo\n"));

        // Check if has staking first
        const hasStaking = await this.checkStaking();
        if (!hasStaking) {
            console.log(chalk.red("Please deploy and fund staking contract first"));
            return;
        }

        console.log(chalk.gray("Executing 5 REAL trades in quick succession...\n"));

        const trades = [];
        for (let i = 1; i <= 5; i++) {
            const side = i % 2 === 0 ? "sell" : "buy";
            const trade = await this.executeTrade(i, {
                pair: "BTC/USDC",
                side: side,
                amount: `${1000000 * i}`, // Increasing amounts
                price: 50000 + (i * 100)
            });

            if (trade) trades.push(trade);

            // Small delay between trades
            if (i < 5) await this.delay(500);
        }

        if (trades.length > 0) {
            this.showSummary(trades);
        }
    }

    /**
     * Show trading summary
     */
    showSummary(trades) {
        console.log(chalk.yellow("\n📈 Trading Summary\n"));

        const avgTime = this.totalTime / trades.length;
        const traditionalTime = trades.length * 10;  // 10 seconds per trade
        const timeSaved = traditionalTime - this.totalTime;
        const speedup = traditionalTime / this.totalTime;

        console.log(chalk.white(`  Total Trades:        ${trades.length}`));
        console.log(chalk.white(`  Total Time:          ${this.totalTime.toFixed(2)} seconds`));
        console.log(chalk.white(`  Average Time:        ${avgTime.toFixed(3)} seconds`));
        console.log(chalk.gray(`  Traditional Bridge:  ${traditionalTime} seconds`));
        console.log(chalk.green(`  Time Saved:          ${timeSaved.toFixed(2)} seconds`));
        console.log(chalk.green(`  Speed Improvement:   ${speedup.toFixed(1)}x faster! ⚡`));

        // Visual representation
        console.log(chalk.yellow("\n  Performance Chart:"));
        console.log(chalk.gray("  ├─ Traditional: ") + chalk.red("█".repeat(50)));
        console.log(chalk.gray("  └─ HyperFlash:  ") + chalk.green("█".repeat(Math.ceil(50 / speedup))) + chalk.green(" ⚡"));
    }

    /**
     * Interactive menu
     */
    async interactiveMenu() {
        const choices = [
            { title: "📦 Deploy Staking Contract", value: "deploy" },
            { title: "💰 Deposit & Stake ETH", value: "stake" },
            { title: "🔍 Check Staking Status", value: "staking" },
            { title: "🚀 Execute Single Trade (REAL)", value: "single" },
            { title: "⚡ Rapid Fire Demo (5 REAL trades)", value: "rapid" },
            { title: "📊 Check Trade Status", value: "status" },
            { title: "📈 Show Speed Comparison", value: "compare" },
            { title: "❌ Exit", value: "exit" }
        ];

        const response = await prompts({
            type: "select",
            name: "action",
            message: "What would you like to do?",
            choices: choices
        });

        return response.action;
    }

    /**
     * Run the REAL demo
     */
    async run() {
        this.welcome();
        await this.initialize();
        await this.checkStaking();
        this.showComparison();

        let running = true;
        while (running) {
            console.log(chalk.gray("\n─".repeat(65)));
            const action = await this.interactiveMenu();

            switch (action) {
                case "deploy":
                    await this.deployStakingContract();
                    break;
                case "stake":
                    await this.depositAndStake();
                    break;
                case "single":
                    await this.executeTrade(this.trades.length + 1, {});
                    break;
                case "rapid":
                    await this.rapidFireDemo();
                    break;
                case "compare":
                    this.showComparison();
                    break;
                case "staking":
                    await this.checkStaking();
                    break;
                case "status":
                    if (this.trades.length > 0) {
                        await this.checkTradeStatus(this.trades[this.trades.length - 1].id);
                    } else {
                        console.log(chalk.yellow("No trades executed yet"));
                    }
                    break;
                case "exit":
                    running = false;
                    break;
            }
        }

        console.log(chalk.cyan("\n👋 Thank you for using HyperFlash!"));
        console.log(chalk.gray("This was a REAL implementation - no mock code!\n"));
    }

    /**
     * Utility: delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Main execution
async function main() {
    const demo = new HyperFlashDemo();
    await demo.run();
}

// Run the demo
main().catch(console.error);