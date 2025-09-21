#!/usr/bin/env node

/**
 * HyperFlash CLI Demo
 * Demonstrates the speed advantage of cross-chain HFT trading
 */

import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import { ethers } from "ethers";

// Configuration
const CONFIG = {
    // Test wallet (public - no real funds)
    TEST_PRIVATE_KEY: "3d6f146e428a9e046ece85ea3442016f2d05b4971075fb27d64ec63888187ec0",
    TEST_ADDRESS: "0xF5AD9A14152ee5c12d17d9C1e99fe8193F27Eb8F",

    // Backend URL
    BACKEND_URL: "http://localhost:3000",

    // Demo validator address
    VALIDATOR_ADDRESS: "0x0000000000000000000000000000000000000001"
};

// ASCII Art Banner
const BANNER = `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██╗  ██╗██╗   ██╗██████╗ ███████╗██████╗ ███████╗██╗      ║
║   ██║  ██║╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██╔════╝██║      ║
║   ███████║ ╚████╔╝ ██████╔╝█████╗  ██████╔╝█████╗  ██║      ║
║   ██╔══██║  ╚██╔╝  ██╔═══╝ ██╔══╝  ██╔══██╗██╔══╝  ██║      ║
║   ██║  ██║   ██║   ██║     ███████╗██║  ██║██║     ███████╗ ║
║   ╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝ ║
║                                                               ║
║           CROSS-CHAIN HFT INFRASTRUCTURE                     ║
║              Instant Trading • Zero Bridge Wait              ║
╚═══════════════════════════════════════════════════════════════╝
`;

class HyperFlashDemo {
    constructor() {
        this.trades = [];
        this.totalTime = 0;
    }

    /**
     * Display welcome screen
     */
    welcome() {
        console.clear();
        console.log(chalk.cyan(BANNER));
        console.log(chalk.gray("─".repeat(65)));
        console.log(chalk.white("  Welcome to HyperFlash - The Future of Cross-Chain Trading"));
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
     * Simulate checking staking status
     */
    async checkStaking() {
        const spinner = ora(chalk.cyan("Checking staking status...")).start();

        await this.delay(1000);

        spinner.succeed(chalk.green("✓ Staking contract deployed"));
        console.log(chalk.gray(`    Address: ${CONFIG.TEST_ADDRESS}`));
        console.log(chalk.gray(`    Staked: 1.0 ETH`));
        console.log(chalk.gray(`    Validator: ${CONFIG.VALIDATOR_ADDRESS}`));
        console.log(chalk.gray(`    Status: Active`));
    }

    /**
     * Execute a single trade
     */
    async executeTrade(index, params) {
        const startTime = Date.now();
        const spinner = ora(chalk.cyan(`Executing trade ${index}...`)).start();

        // Simulate trade execution
        await this.delay(200 + Math.random() * 300);  // 200-500ms

        const executionTime = (Date.now() - startTime) / 1000;

        spinner.succeed(chalk.green(`✓ Trade ${index} executed in ${executionTime.toFixed(3)}s`));

        const trade = {
            id: `trade_${Date.now()}_${index}`,
            pair: params.pair || "BTC/USDC",
            side: params.side || "buy",
            amount: params.amount || "1000 USDC",
            executionTime: executionTime,
            timestamp: new Date().toISOString()
        };

        console.log(chalk.gray(`    ID: ${trade.id}`));
        console.log(chalk.gray(`    Pair: ${trade.pair} | Side: ${trade.side} | Amount: ${trade.amount}`));

        this.trades.push(trade);
        this.totalTime += executionTime;

        return trade;
    }

    /**
     * Execute rapid fire trades
     */
    async rapidFireDemo() {
        console.log(chalk.yellow("\n🚀 Rapid Fire Trading Demo\n"));
        console.log(chalk.gray("Executing 10 trades in quick succession...\n"));

        const trades = [];
        for (let i = 1; i <= 10; i++) {
            const side = i % 2 === 0 ? "sell" : "buy";
            const trade = await this.executeTrade(i, {
                pair: "BTC/USDC",
                side: side,
                amount: `${100 * i} USDC`
            });
            trades.push(trade);

            // Small delay between trades
            if (i < 10) await this.delay(100);
        }

        this.showSummary(trades);
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
            { title: "🚀 Execute Single Trade", value: "single" },
            { title: "⚡ Rapid Fire Demo (10 trades)", value: "rapid" },
            { title: "📊 Show Speed Comparison", value: "compare" },
            { title: "💰 Check Staking Status", value: "staking" },
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
     * Run the demo
     */
    async run() {
        this.welcome();
        await this.checkStaking();
        this.showComparison();

        let running = true;
        while (running) {
            console.log(chalk.gray("\n─".repeat(65)));
            const action = await this.interactiveMenu();

            switch (action) {
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
                case "exit":
                    running = false;
                    break;
            }
        }

        console.log(chalk.cyan("\n👋 Thank you for using HyperFlash!"));
        console.log(chalk.gray("Learn more at: https://hyperflash.io\n"));
    }

    /**
     * Utility: delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Check if required packages are installed
async function checkDependencies() {
    try {
        await import("chalk");
        await import("ora");
        await import("prompts");
    } catch (error) {
        console.log("\n⚠️  Missing dependencies. Installing required packages...\n");
        const { execSync } = await import("child_process");
        execSync("npm install chalk ora prompts", { stdio: "inherit" });
        console.log("\n✅ Dependencies installed. Please run the demo again.\n");
        process.exit(0);
    }
}

// Main execution
async function main() {
    await checkDependencies();
    const demo = new HyperFlashDemo();
    await demo.run();
}

// Run the demo
main().catch(console.error);