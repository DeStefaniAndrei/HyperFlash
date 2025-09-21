import express from "express";
import { ethers } from "ethers";
import TradeMonitor from "./monitor/tradeMonitor.js";
import DeBridgeService from "./debridge/bridge.js";

// Configuration
const CONFIG = {
    PORT: 3000,
    FACTORY_ADDRESS: process.env.FACTORY_ADDRESS || null,  // Set after deployment

    // Test wallet (public - no real funds)
    BACKEND_PRIVATE_KEY: "3d6f146e428a9e046ece85ea3442016f2d05b4971075fb27d64ec63888187ec0",

    // Shared EOA that executes trades
    SHARED_EOA_ADDRESS: "0x1234567890123456789012345678901234567890"  // Replace with actual funded address
};

// Initialize Express app
const app = express();
app.use(express.json());

// Initialize services
let tradeMonitor = null;
let debridgeService = null;

/**
 * Initialize backend services
 */
async function initializeServices(factoryAddress) {
    console.log("\n=== HyperFlash Backend Service ===");
    console.log("Initializing services...");

    // Initialize trade monitor
    tradeMonitor = new TradeMonitor(factoryAddress || CONFIG.FACTORY_ADDRESS);

    // Initialize DeBridge service
    debridgeService = new DeBridgeService(CONFIG.BACKEND_PRIVATE_KEY);

    // Start monitoring
    await tradeMonitor.start();

    console.log("Backend services initialized successfully");
}

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
            tradeMonitor: tradeMonitor ? "running" : "not initialized",
            debridge: debridgeService ? "running" : "not initialized"
        }
    });
});

/**
 * Initialize a new trade
 * Called by Python SDK when user wants to trade
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

        console.log(`\n=== New Trade Request ===`);
        console.log(`Trade ID: ${tradeId}`);
        console.log(`User: ${userAddress}`);
        console.log(`Amount: ${amount}`);

        // 1. Register trade with monitor
        const registerResult = await tradeMonitor.registerTrade(userAddress, tradeId, amount);
        if (!registerResult.success) {
            return res.status(400).json({ error: registerResult.error });
        }

        // 2. Initiate DeBridge bridging
        console.log("Initiating DeBridge...");
        const bridgeResult = await debridgeService.initiateBridge(userAddress, amount, tradeId);

        // 3. Execute trade immediately (shared EOA has liquidity)
        console.log("Executing trade on HyperLiquid...");
        const executeResult = await tradeMonitor.executeTrade(tradeId, tradeParams);

        // 4. Monitor bridge completion in background
        monitorBridgeCompletion(tradeId, bridgeResult.txHash);

        // Return success response
        res.json({
            success: true,
            tradeId,
            bridgeTxHash: bridgeResult.txHash,
            message: "Trade executed successfully",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Trade initiation failed:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get trade status
 */
app.get("/trade/status/:tradeId", (req, res) => {
    const { tradeId } = req.params;

    const status = tradeMonitor.getTradeStatus(tradeId);

    if (!status.exists) {
        return res.status(404).json({ error: "Trade not found" });
    }

    res.json({
        tradeId,
        ...status
    });
});

/**
 * Monitor bridge completion in background
 */
async function monitorBridgeCompletion(tradeId, txHash) {
    console.log(`Starting bridge monitoring for ${tradeId}`);

    // Monitor in background (don't block response)
    setTimeout(async () => {
        const result = await debridgeService.monitorBridgeCompletion(txHash, tradeId);

        if (result.success) {
            console.log(`Bridge completed for ${tradeId} in ${result.completionTime}ms`);
            await tradeMonitor.completeBridge(tradeId);
        } else {
            console.error(`Bridge failed for ${tradeId}: ${result.error}`);
            // Slashing will be triggered by timeout in tradeMonitor
        }
    }, 0);
}

/**
 * Simulate bridge completion (for testing)
 */
app.post("/test/complete-bridge/:tradeId", async (req, res) => {
    const { tradeId } = req.params;

    try {
        await tradeMonitor.completeBridge(tradeId);
        res.json({ success: true, message: "Bridge marked as completed" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Simulate slashing (for testing)
 */
app.post("/test/slash/:tradeId", async (req, res) => {
    const { tradeId } = req.params;
    const { reason } = req.body;

    try {
        await tradeMonitor.slashUser(tradeId, reason || "Test slashing");
        res.json({ success: true, message: "User slashed" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Start the server
 */
async function startServer() {
    // Check if factory address is provided
    const factoryAddress = process.argv[2] || CONFIG.FACTORY_ADDRESS;

    if (!factoryAddress) {
        console.error("ERROR: Factory address not provided");
        console.log("Usage: node server.js <FACTORY_ADDRESS>");
        console.log("Example: node server.js 0x123...");
        process.exit(1);
    }

    // Initialize services
    await initializeServices(factoryAddress);

    // Start Express server
    app.listen(CONFIG.PORT, () => {
        console.log(`\nBackend server running on port ${CONFIG.PORT}`);
        console.log(`Factory address: ${factoryAddress}`);
        console.log(`Shared EOA: ${CONFIG.SHARED_EOA_ADDRESS}`);
        console.log("\nEndpoints:");
        console.log("  GET  /health");
        console.log("  POST /trade/initiate");
        console.log("  GET  /trade/status/:tradeId");
        console.log("\nTest endpoints:");
        console.log("  POST /test/complete-bridge/:tradeId");
        console.log("  POST /test/slash/:tradeId");
    });
}

// Handle errors
process.on("unhandledRejection", (error) => {
    console.error("Unhandled rejection:", error);
});

// Start server
startServer();