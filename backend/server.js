import express from "express";
import { ethers } from "ethers";
import TradeMonitor from "./monitor/tradeMonitor.js";
import DeBridgeService from "./debridge/bridge.js";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const CONFIG = {
    PORT: process.env.BACKEND_PORT || 3000,
    FACTORY_ADDRESS: process.env.FACTORY_ADDRESS || null,

    // Backend service wallet (master account that signs)
    BACKEND_PRIVATE_KEY: process.env.MASTER_PRIVATE_KEY || "3d6f146e428a9e046ece85ea3442016f2d05b4971075fb27d64ec63888187ec0",

    // Shared EOA that executes trades (vault/subaccount)
    // MVP: Uses master key to sign on behalf of vault
    // POST-MVP TODO: Implement secure key management (TEE/HSM)
    SHARED_EOA_ADDRESS: process.env.SHARED_EOA_ADDRESS || "0xF5AD9A14152ee5c12d17d9C1e99fe8193F27Eb8F",

    // Network configuration
    NETWORK: process.env.HYPERLIQUID_NETWORK || 'testnet'
};

// Initialize Express app
const app = express();
app.use(express.json());

// Initialize services
let tradeMonitor = null;
let debridgeService = null;

/**
 * Initialize backend services with REAL connections
 */
async function initializeServices(factoryAddress) {
    console.log("\n=== HyperFlash Backend Service (REAL) ===");
    console.log("Initializing services...");

    try {
        // Initialize trade monitor with REAL blockchain connection
        tradeMonitor = new TradeMonitor(factoryAddress || CONFIG.FACTORY_ADDRESS);

        // Initialize DeBridge service with REAL implementation
        debridgeService = new DeBridgeService(CONFIG.BACKEND_PRIVATE_KEY);

        // Start monitoring with REAL event listeners
        await tradeMonitor.start();

        console.log("[REAL] Backend services initialized successfully");
    } catch (error) {
        console.error("Failed to initialize services:", error);
        throw error;
    }
}

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        mode: "REAL",
        timestamp: new Date().toISOString(),
        services: {
            tradeMonitor: tradeMonitor ? "running" : "not initialized",
            debridge: debridgeService ? "running" : "not initialized"
        }
    });
});

/**
 * Initialize a new trade with REAL blockchain transactions
 */
app.post("/trade/initiate", async (req, res) => {
    const { userAddress, amount, tradeParams } = req.body;

    // Validate inputs
    if (!userAddress || !amount || !tradeParams) {
        return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
        // Generate unique trade ID
        const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log(`\n=== [REAL] New Trade Request ===`);
        console.log(`Trade ID: ${tradeId}`);
        console.log(`User: ${userAddress}`);
        console.log(`Amount: ${amount}`);

        // 1. Register trade with monitor (REAL BLOCKCHAIN TX)
        const registerResult = await tradeMonitor.registerTrade(userAddress, tradeId, amount);
        if (!registerResult.success) {
            return res.status(400).json({ error: registerResult.error });
        }

        // 2. Initiate REAL DeBridge bridging
        console.log("[REAL] Initiating DeBridge...");
        const bridgeResult = await debridgeService.initiateBridge(userAddress, amount, tradeId);

        if (!bridgeResult.success) {
            // If bridge fails, we should NOT execute the trade
            console.error("Bridge initiation failed:", bridgeResult.error);
            return res.status(500).json({
                error: "Bridge initiation failed",
                details: bridgeResult.error
            });
        }

        // Store debridgeId in trade monitor
        tradeMonitor.setDebridgeId(tradeId, bridgeResult.debridgeId);

        // 3. Execute trade immediately (shared EOA has liquidity)
        console.log("[REAL] Executing trade on HyperLiquid...");
        const executeResult = await tradeMonitor.executeTrade(tradeId, tradeParams);

        // 4. Monitor bridge completion in background
        monitorBridgeCompletion(tradeId, bridgeResult.debridgeId);

        // Return success response
        res.json({
            success: true,
            mode: "REAL",
            tradeId,
            bridgeTxHash: bridgeResult.txHash,
            debridgeId: bridgeResult.debridgeId,
            registerTxHash: registerResult.txHash,
            message: "Trade executed successfully",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Trade initiation failed:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get REAL trade status from blockchain
 */
app.get("/trade/status/:tradeId", async (req, res) => {
    const { tradeId } = req.params;

    try {
        const status = await tradeMonitor.getTradeStatus(tradeId);

        if (!status.exists) {
            return res.status(404).json({ error: "Trade not found" });
        }

        res.json({
            tradeId,
            mode: "REAL",
            ...status
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Monitor REAL bridge completion in background
 */
async function monitorBridgeCompletion(tradeId, debridgeId) {
    console.log(`[REAL] Starting bridge monitoring for ${tradeId}`);
    console.log(`DeBridge ID: ${debridgeId}`);

    // Monitor in background (don't block response)
    setTimeout(async () => {
        try {
            const result = await debridgeService.monitorBridgeCompletion(debridgeId, tradeId);

            if (result.success) {
                console.log(`[REAL] Bridge completed for ${tradeId} in ${result.completionTime}ms`);
                await tradeMonitor.completeBridge(tradeId);
            } else {
                console.error(`[REAL] Bridge failed for ${tradeId}: ${result.error}`);
                // Slashing will be triggered by timeout in tradeMonitor
            }
        } catch (error) {
            console.error(`[REAL] Bridge monitoring error for ${tradeId}:`, error);
        }
    }, 0);
}

/**
 * Get vault (shared EOA) balance on HyperLiquid
 */
app.get("/vault/balance", async (req, res) => {
    try {
        // Get balance from HyperLiquid trade service
        const hyperLiquid = new (await import("./hyperliquid/tradeService.js")).default();
        await hyperLiquid.initialize();
        const balance = await hyperLiquid.getVaultBalance();

        res.json({
            success: true,
            vault: CONFIG.SHARED_EOA_ADDRESS,
            network: CONFIG.NETWORK,
            ...balance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get all active trades (REAL)
 */
app.get("/trades/active", (req, res) => {
    const activeTrades = Array.from(tradeMonitor.activeTrades.entries()).map(([id, data]) => ({
        tradeId: id,
        user: data.user,
        amount: data.amount,
        elapsed: Date.now() - data.startTime,
        bridgeCompleted: data.bridgeCompleted,
        tradeExecuted: data.tradeExecuted,
        debridgeId: data.debridgeId
    }));

    res.json({
        mode: "REAL",
        count: activeTrades.length,
        trades: activeTrades
    });
});

/**
 * Manual bridge completion (for testing REAL flow)
 */
app.post("/test/complete-bridge/:tradeId", async (req, res) => {
    const { tradeId } = req.params;

    try {
        await tradeMonitor.completeBridge(tradeId);
        res.json({
            success: true,
            mode: "REAL",
            message: "Bridge marked as completed (REAL TX)"
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Manual slashing (for testing REAL slashing)
 */
app.post("/test/slash/:tradeId", async (req, res) => {
    const { tradeId } = req.params;
    const { reason } = req.body;

    try {
        await tradeMonitor.slashUser(tradeId, reason || "Test slashing");
        res.json({
            success: true,
            mode: "REAL",
            message: "User slashed (REAL TX)"
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Deploy user staking contract (helper endpoint)
 */
app.post("/user/deploy-staking", async (req, res) => {
    const { userAddress, validatorAddress } = req.body;

    if (!userAddress || !validatorAddress) {
        return res.status(400).json({ error: "Missing userAddress or validatorAddress" });
    }

    try {
        // This would call the factory contract to deploy
        // For now, return instruction
        res.json({
            message: "User should call Factory.deployStakingContract(validatorAddress) directly",
            factoryAddress: CONFIG.FACTORY_ADDRESS || "Deploy factory first",
            validatorAddress: validatorAddress
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Start the REAL server
 */
async function startServer() {
    // Check if factory address is provided
    const factoryAddress = process.argv[2] || CONFIG.FACTORY_ADDRESS;

    if (!factoryAddress) {
        console.error("ERROR: Factory address not provided");
        console.log("Usage: node server.js <FACTORY_ADDRESS>");
        console.log("Example: node server.js 0x5FbDB2315678afecb367f032d93F642f64180aa3");
        process.exit(1);
    }

    try {
        // Initialize services with REAL connections
        await initializeServices(factoryAddress);

        // Start Express server
        app.listen(CONFIG.PORT, () => {
            console.log(`\n[REAL] HyperFlash Backend Server`);
            console.log(`================================`);
            console.log(`Network: ${CONFIG.NETWORK}`);
            console.log(`Port: ${CONFIG.PORT}`);
            console.log(`Factory: ${factoryAddress}`);
            console.log(`Shared EOA (Vault): ${CONFIG.SHARED_EOA_ADDRESS}`);
            console.log("\nEndpoints:");
            console.log("  GET  /health");
            console.log("  POST /trade/initiate");
            console.log("  GET  /trade/status/:tradeId");
            console.log("  GET  /trades/active");
            console.log("\nHelper endpoints:");
            console.log("  POST /user/deploy-staking");
            console.log("\nTest endpoints:");
            console.log("  POST /test/complete-bridge/:tradeId");
            console.log("  POST /test/slash/:tradeId");
            console.log("\nMode: REAL - HyperLiquid vault trading enabled");
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

// Handle errors
process.on("unhandledRejection", (error) => {
    console.error("Unhandled rejection:", error);
});

// Start server
startServer();