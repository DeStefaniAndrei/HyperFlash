import { ethers } from "ethers";
import DeBridgeService from "../debridge/bridge.js";

// Configuration
const CONFIG = {
    // Test wallet (public - no real funds)
    BACKEND_PRIVATE_KEY: "3d6f146e428a9e046ece85ea3442016f2d05b4971075fb27d64ec63888187ec0",

    // Contract addresses (will be updated after deployment)
    FACTORY_ADDRESS: null,  // Set after deployment

    // RPC endpoints
    HYPERLIQUID_RPC: "https://rpc.hyperliquid-testnet.xyz/evm",
    BASE_RPC: "https://sepolia.base.org",

    // Monitoring intervals
    POLL_INTERVAL: 2000,  // 2 seconds
    BRIDGE_TIMEOUT: 60000  // 60 seconds
};

// Factory ABI (minimal for interaction)
const FACTORY_ABI = [
    "function getUserStakingContract(address user) view returns (address)",
    "function backend() view returns (address)",
    "function sharedEOA() view returns (address)"
];

// UserStaking ABI (minimal for interaction)
const USER_STAKING_ABI = [
    "function registerTrade(string calldata _tradeId) external",
    "function completeTrade(string calldata _tradeId) external",
    "function slash(string calldata _reason) external",
    "function hasSufficientStake(uint256 _amount) external view returns (bool)",
    "function user() view returns (address)",
    "function isSlashed() view returns (bool)"
];

class TradeMonitor {
    constructor(factoryAddress) {
        // Initialize providers
        this.hyperProvider = new ethers.JsonRpcProvider(CONFIG.HYPERLIQUID_RPC);
        this.baseProvider = new ethers.JsonRpcProvider(CONFIG.BASE_RPC);

        // Initialize signer
        this.signer = new ethers.Wallet(CONFIG.BACKEND_PRIVATE_KEY, this.hyperProvider);

        // Initialize contracts
        this.factory = new ethers.Contract(factoryAddress, FACTORY_ABI, this.signer);

        // Initialize DeBridge service
        this.debridge = new DeBridgeService(CONFIG.BACKEND_PRIVATE_KEY);

        // Track active trades
        this.activeTrades = new Map();  // tradeId -> tradeData
    }

    /**
     * Start monitoring service
     */
    async start() {
        console.log("Starting HyperFlash trade monitoring service...");
        console.log("Factory address:", await this.factory.getAddress());
        console.log("Backend address:", await this.factory.backend());
        console.log("Shared EOA:", await this.factory.sharedEOA());

        // Start monitoring loop
        setInterval(() => this.monitorTrades(), CONFIG.POLL_INTERVAL);

        console.log("Monitoring service started");
    }

    /**
     * Register a new trade
     * Called when SDK initiates a trade
     */
    async registerTrade(userAddress, tradeId, amount) {
        console.log(`\nRegistering trade ${tradeId} for user ${userAddress}`);

        try {
            // Get user's staking contract
            const stakingAddress = await this.factory.getUserStakingContract(userAddress);
            if (stakingAddress === ethers.ZeroAddress) {
                throw new Error("User has no staking contract");
            }

            // Connect to staking contract
            const stakingContract = new ethers.Contract(
                stakingAddress,
                USER_STAKING_ABI,
                this.signer
            );

            // Check if user has sufficient stake
            const hasSufficient = await stakingContract.hasSufficientStake(amount);
            if (!hasSufficient) {
                throw new Error("Insufficient stake for trade amount");
            }

            // Register trade on-chain
            const tx = await stakingContract.registerTrade(tradeId);
            await tx.wait();

            // Store trade data
            this.activeTrades.set(tradeId, {
                user: userAddress,
                stakingContract: stakingAddress,
                amount: amount,
                startTime: Date.now(),
                bridgeInitiated: false,
                bridgeCompleted: false,
                tradeExecuted: false
            });

            console.log(`Trade ${tradeId} registered successfully`);
            return { success: true, tradeId };

        } catch (error) {
            console.error("Failed to register trade:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Execute trade on HyperLiquid
     * Called immediately after trade registration
     */
    async executeTrade(tradeId, tradingParams) {
        console.log(`Executing trade ${tradeId} on HyperLiquid`);

        const tradeData = this.activeTrades.get(tradeId);
        if (!tradeData) {
            console.error("Trade not found");
            return { success: false, error: "Trade not found" };
        }

        try {
            // Mark trade as executed
            // In production, this would call HyperLiquid trading API
            // For MVP, we simulate successful execution
            tradeData.tradeExecuted = true;

            console.log(`Trade ${tradeId} executed successfully`);
            console.log("Trade params:", tradingParams);

            // Now monitor for bridge completion
            this.monitorBridgeForTrade(tradeId);

            return { success: true, tradeId };

        } catch (error) {
            console.error("Trade execution failed:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Monitor bridge completion for a specific trade
     */
    async monitorBridgeForTrade(tradeId) {
        const tradeData = this.activeTrades.get(tradeId);
        if (!tradeData) return;

        console.log(`Monitoring bridge for trade ${tradeId}`);

        // Set timeout for bridge completion
        setTimeout(async () => {
            // Check if bridge completed
            if (!tradeData.bridgeCompleted && tradeData.tradeExecuted) {
                // Bridge failed but trade was executed - trigger slashing
                console.error(`Bridge timeout for trade ${tradeId} - initiating slashing`);
                await this.slashUser(tradeId, "Bridge failed after trade execution");
            }
        }, CONFIG.BRIDGE_TIMEOUT);
    }

    /**
     * Mark bridge as completed
     * Called when DeBridge completes
     */
    async completeBridge(tradeId) {
        console.log(`Bridge completed for trade ${tradeId}`);

        const tradeData = this.activeTrades.get(tradeId);
        if (!tradeData) {
            console.error("Trade not found");
            return;
        }

        tradeData.bridgeCompleted = true;

        // Complete the trade on-chain
        try {
            const stakingContract = new ethers.Contract(
                tradeData.stakingContract,
                USER_STAKING_ABI,
                this.signer
            );

            const tx = await stakingContract.completeTrade(tradeId);
            await tx.wait();

            console.log(`Trade ${tradeId} completed successfully`);

            // Remove from active trades
            this.activeTrades.delete(tradeId);

        } catch (error) {
            console.error("Failed to complete trade:", error);
        }
    }

    /**
     * Slash user's stake for malicious behavior
     */
    async slashUser(tradeId, reason) {
        console.error(`SLASHING: Trade ${tradeId} - ${reason}`);

        const tradeData = this.activeTrades.get(tradeId);
        if (!tradeData) return;

        try {
            const stakingContract = new ethers.Contract(
                tradeData.stakingContract,
                USER_STAKING_ABI,
                this.signer
            );

            // Execute slashing
            const tx = await stakingContract.slash(reason);
            await tx.wait();

            console.log(`User slashed for trade ${tradeId}`);

            // Remove from active trades
            this.activeTrades.delete(tradeId);

            // Log for audit
            console.log("Slashing details:", {
                tradeId,
                user: tradeData.user,
                amount: tradeData.amount,
                reason,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error("Failed to slash user:", error);
        }
    }

    /**
     * Monitor all active trades
     */
    async monitorTrades() {
        // Check each active trade
        for (const [tradeId, tradeData] of this.activeTrades) {
            const elapsed = Date.now() - tradeData.startTime;

            // Log status
            if (elapsed % 10000 === 0) {  // Log every 10 seconds
                console.log(`Trade ${tradeId} status:`, {
                    elapsed: `${elapsed / 1000}s`,
                    bridgeCompleted: tradeData.bridgeCompleted,
                    tradeExecuted: tradeData.tradeExecuted
                });
            }
        }
    }

    /**
     * Get trade status
     */
    getTradeStatus(tradeId) {
        const tradeData = this.activeTrades.get(tradeId);
        if (!tradeData) {
            return { exists: false };
        }

        return {
            exists: true,
            user: tradeData.user,
            amount: tradeData.amount,
            elapsed: Date.now() - tradeData.startTime,
            bridgeCompleted: tradeData.bridgeCompleted,
            tradeExecuted: tradeData.tradeExecuted
        };
    }
}

// Export for use in main backend service
export default TradeMonitor;