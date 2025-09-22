import { ethers } from "ethers";
import DeBridgeService from "../debridge/bridge.js";
import HyperLiquidTradeService from "../hyperliquid/tradeService.js";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const CONFIG = {
    // Backend service wallet (from environment)
    BACKEND_PRIVATE_KEY: process.env.MASTER_PRIVATE_KEY || "3d6f146e428a9e046ece85ea3442016f2d05b4971075fb27d64ec63888187ec0",

    // RPC endpoints (from environment)
    HYPERLIQUID_RPC: process.env.HYPERLIQUID_NETWORK === 'mainnet'
        ? process.env.HYPERLIQUID_RPC
        : process.env.HYPERLIQUID_TESTNET_RPC || "http://127.0.0.1:8545",
    BASE_RPC: process.env.BASE_RPC || "http://127.0.0.1:8545",

    // Monitoring intervals
    POLL_INTERVAL: 2000,  // 2 seconds
    BRIDGE_TIMEOUT: 60000  // 60 seconds
};

// Factory ABI (full interaction)
const FACTORY_ABI = [
    "function getUserStakingContract(address user) view returns (address)",
    "function hasStakingContract(address user) view returns (bool)",
    "function backend() view returns (address)",
    "function sharedEOA() view returns (address)",
    "function deployedContracts(uint256 index) view returns (address)",
    "function getTotalContracts() view returns (uint256)"
];

// UserStaking ABI (full interaction)
const USER_STAKING_ABI = [
    "function registerTrade(string calldata _tradeId) external",
    "function completeTrade(string calldata _tradeId) external",
    "function slash(string calldata _reason) external",
    "function hasSufficientStake(uint256 _amount) external view returns (bool)",
    "function getStatus() external view returns (uint256, bool)",
    "function user() view returns (address)",
    "function validator() view returns (address)",
    "function stakedAmount() view returns (uint256)",
    "function isSlashed() view returns (bool)",
    "function activeTrades(string calldata) view returns (bool)",
    "event TradeRegistered(string tradeId)",
    "event TradeCompleted(string tradeId)",
    "event FundsSlashed(string reason, uint256 amount)"
];

class TradeMonitor {
    constructor(factoryAddress) {
        // Initialize providers
        this.hyperProvider = new ethers.JsonRpcProvider(CONFIG.HYPERLIQUID_RPC);
        this.baseProvider = new ethers.JsonRpcProvider(CONFIG.BASE_RPC);

        // Initialize signer
        this.signer = new ethers.Wallet(CONFIG.BACKEND_PRIVATE_KEY, this.hyperProvider);

        // Initialize factory contract with REAL connection
        this.factory = new ethers.Contract(factoryAddress, FACTORY_ABI, this.signer);

        // Initialize DeBridge service
        this.debridge = new DeBridgeService(CONFIG.BACKEND_PRIVATE_KEY);

        // Initialize HyperLiquid trade service
        this.hyperLiquid = new HyperLiquidTradeService();

        // Track active trades with debridgeIds
        this.activeTrades = new Map();  // tradeId -> tradeData
    }

    /**
     * Start monitoring service with REAL blockchain connections
     */
    async start() {
        console.log("[REAL] Starting HyperFlash trade monitoring service...");

        try {
            const factoryAddress = await this.factory.getAddress();
            const backend = await this.factory.backend();
            const sharedEOA = await this.factory.sharedEOA();
            const totalContracts = await this.factory.getTotalContracts();

            console.log("Factory address:", factoryAddress);
            console.log("Backend address:", backend);
            console.log("Shared EOA:", sharedEOA);
            console.log("Total deployed staking contracts:", totalContracts.toString());

            // Initialize HyperLiquid trade service
            const hlInitialized = await this.hyperLiquid.initialize();
            if (!hlInitialized) {
                console.warn("[WARNING] HyperLiquid trade service initialization failed");
                console.warn("         Trades will not execute. Check Python SDK installation.");
            }

            // Start REAL event monitoring
            this.startEventMonitoring();

            // Start monitoring loop
            setInterval(() => this.monitorTrades(), CONFIG.POLL_INTERVAL);

            console.log("[REAL] Monitoring service started");
        } catch (error) {
            console.error("Failed to start monitoring:", error);
            throw error;
        }
    }

    /**
     * Set up REAL event listeners for all deployed staking contracts
     */
    async startEventMonitoring() {
        try {
            const totalContracts = await this.factory.getTotalContracts();

            for (let i = 0; i < totalContracts; i++) {
                const contractAddress = await this.factory.deployedContracts(i);
                const stakingContract = new ethers.Contract(
                    contractAddress,
                    USER_STAKING_ABI,
                    this.signer
                );

                // Listen for REAL TradeRegistered events
                stakingContract.on("TradeRegistered", (tradeId) => {
                    console.log(`[EVENT] Trade registered: ${tradeId}`);
                });

                // Listen for REAL TradeCompleted events
                stakingContract.on("TradeCompleted", (tradeId) => {
                    console.log(`[EVENT] Trade completed: ${tradeId}`);
                    // Clean up from active trades
                    this.activeTrades.delete(tradeId);
                });

                // Listen for REAL FundsSlashed events
                stakingContract.on("FundsSlashed", (reason, amount) => {
                    console.log(`[EVENT] Funds slashed: ${reason}, amount: ${ethers.formatEther(amount)} ETH`);
                });
            }
        } catch (error) {
            console.error("Failed to set up event monitoring:", error);
        }
    }

    /**
     * Register a new trade with REAL blockchain transaction
     */
    async registerTrade(userAddress, tradeId, amount) {
        console.log(`\n[REAL] Registering trade ${tradeId} for user ${userAddress}`);

        try {
            // Check if user has staking contract
            const hasContract = await this.factory.hasStakingContract(userAddress);
            if (!hasContract) {
                throw new Error("User has no staking contract");
            }

            // Get user's staking contract
            const stakingAddress = await this.factory.getUserStakingContract(userAddress);
            console.log("User staking contract:", stakingAddress);

            // Connect to staking contract
            const stakingContract = new ethers.Contract(
                stakingAddress,
                USER_STAKING_ABI,
                this.signer
            );

            // Check REAL staking status
            const [stakedAmount, isActive] = await stakingContract.getStatus();
            console.log(`Staked amount: ${ethers.formatEther(stakedAmount)} ETH`);
            console.log(`Active: ${isActive}`);

            if (!isActive) {
                throw new Error("Staking contract is slashed");
            }

            // Check if user has sufficient stake
            const hasSufficient = await stakingContract.hasSufficientStake(amount);
            if (!hasSufficient) {
                throw new Error("Insufficient stake for trade amount");
            }

            // Check if trade already exists
            const tradeExists = await stakingContract.activeTrades(tradeId);
            if (tradeExists) {
                throw new Error("Trade already registered");
            }

            // Register trade on-chain (REAL TRANSACTION)
            console.log("Submitting registerTrade transaction...");
            const tx = await stakingContract.registerTrade(tradeId);
            console.log("Transaction hash:", tx.hash);

            const receipt = await tx.wait();
            console.log("Transaction confirmed in block:", receipt.blockNumber);

            // Store trade data
            this.activeTrades.set(tradeId, {
                user: userAddress,
                stakingContract: stakingAddress,
                amount: amount,
                startTime: Date.now(),
                debridgeId: null,
                bridgeInitiated: false,
                bridgeCompleted: false,
                tradeExecuted: false
            });

            console.log(`[REAL] Trade ${tradeId} registered successfully`);
            return { success: true, tradeId, txHash: receipt.hash };

        } catch (error) {
            console.error("Failed to register trade:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Execute trade on HyperLiquid using vault/subaccount model
     */
    async executeTrade(tradeId, tradingParams) {
        console.log(`[REAL] Executing trade ${tradeId} on HyperLiquid`);

        const tradeData = this.activeTrades.get(tradeId);
        if (!tradeData) {
            console.error("Trade not found");
            return { success: false, error: "Trade not found" };
        }

        try {
            // Execute trade via HyperLiquid service (Python SDK)
            const result = await this.hyperLiquid.executeTrade(tradeId, tradingParams);

            if (result.success) {
                tradeData.tradeExecuted = true;
                tradeData.orderId = result.orderId;
                tradeData.executionTime = result.executionTime;

                console.log(`[REAL] Trade ${tradeId} executed successfully`);
                console.log(`      Order ID: ${result.orderId}`);
                console.log(`      Execution time: ${result.executionTime}ms`);
            } else {
                console.error(`[REAL] Trade execution failed: ${result.error}`);
                tradeData.tradeExecuted = false;
                tradeData.error = result.error;
            }

            // Monitor for bridge completion regardless
            this.monitorBridgeForTrade(tradeId);

            return result;

        } catch (error) {
            console.error("Trade execution failed:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Monitor bridge completion for a specific trade (REAL)
     */
    async monitorBridgeForTrade(tradeId) {
        const tradeData = this.activeTrades.get(tradeId);
        if (!tradeData) return;

        console.log(`[REAL] Monitoring bridge for trade ${tradeId}`);

        // Set timeout for bridge completion
        setTimeout(async () => {
            // Check if bridge completed
            if (!tradeData.bridgeCompleted && tradeData.tradeExecuted) {
                // Bridge failed but trade was executed - trigger REAL slashing
                console.error(`[REAL] Bridge timeout for trade ${tradeId} - initiating slashing`);
                await this.slashUser(tradeId, "Bridge failed after trade execution");
            }
        }, CONFIG.BRIDGE_TIMEOUT);
    }

    /**
     * Mark bridge as completed with REAL on-chain transaction
     */
    async completeBridge(tradeId) {
        console.log(`[REAL] Bridge completed for trade ${tradeId}`);

        const tradeData = this.activeTrades.get(tradeId);
        if (!tradeData) {
            console.error("Trade not found");
            return;
        }

        tradeData.bridgeCompleted = true;

        // Complete the trade on-chain (REAL TRANSACTION)
        try {
            const stakingContract = new ethers.Contract(
                tradeData.stakingContract,
                USER_STAKING_ABI,
                this.signer
            );

            console.log("Submitting completeTrade transaction...");
            const tx = await stakingContract.completeTrade(tradeId);
            console.log("Transaction hash:", tx.hash);

            const receipt = await tx.wait();
            console.log("Transaction confirmed in block:", receipt.blockNumber);

            console.log(`[REAL] Trade ${tradeId} completed successfully`);

            // Remove from active trades
            this.activeTrades.delete(tradeId);

        } catch (error) {
            console.error("Failed to complete trade:", error);
        }
    }

    /**
     * Slash user's stake for malicious behavior (REAL TRANSACTION)
     */
    async slashUser(tradeId, reason) {
        console.error(`[REAL SLASHING] Trade ${tradeId} - ${reason}`);

        const tradeData = this.activeTrades.get(tradeId);
        if (!tradeData) return;

        try {
            const stakingContract = new ethers.Contract(
                tradeData.stakingContract,
                USER_STAKING_ABI,
                this.signer
            );

            // Check if already slashed
            const isSlashed = await stakingContract.isSlashed();
            if (isSlashed) {
                console.log("Contract already slashed");
                return;
            }

            // Execute REAL slashing transaction
            console.log("Submitting slash transaction...");
            const tx = await stakingContract.slash(reason);
            console.log("Slash transaction hash:", tx.hash);

            const receipt = await tx.wait();
            console.log("Slash confirmed in block:", receipt.blockNumber);

            // Get slashed amount from events
            const slashEvent = receipt.logs.find(log => {
                try {
                    const parsed = stakingContract.interface.parseLog(log);
                    return parsed.name === "FundsSlashed";
                } catch {
                    return false;
                }
            });

            if (slashEvent) {
                const amount = slashEvent.args[1];
                console.log(`[REAL] User slashed for ${ethers.formatEther(amount)} ETH`);
            }

            // Remove from active trades
            this.activeTrades.delete(tradeId);

            // Log for audit
            console.log("[AUDIT] Slashing details:", {
                tradeId,
                user: tradeData.user,
                amount: tradeData.amount,
                reason,
                txHash: receipt.hash,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error("Failed to slash user:", error);
        }
    }

    /**
     * Monitor all active trades with REAL status checks
     */
    async monitorTrades() {
        // Check each active trade
        for (const [tradeId, tradeData] of this.activeTrades) {
            const elapsed = Date.now() - tradeData.startTime;

            // Check bridge status if we have debridgeId
            if (tradeData.debridgeId && !tradeData.bridgeCompleted) {
                const bridgeStatus = await this.debridge.getBridgeStatus(tradeData.debridgeId);
                if (bridgeStatus.status === "Claimed" || bridgeStatus.status === "Completed") {
                    console.log(`[REAL] Bridge completed for ${tradeId}`);
                    await this.completeBridge(tradeId);
                }
            }

            // Log status every 10 seconds
            if (elapsed % 10000 < CONFIG.POLL_INTERVAL) {
                console.log(`[REAL] Trade ${tradeId} status:`, {
                    elapsed: `${elapsed / 1000}s`,
                    bridgeCompleted: tradeData.bridgeCompleted,
                    tradeExecuted: tradeData.tradeExecuted,
                    debridgeId: tradeData.debridgeId
                });
            }
        }
    }

    /**
     * Get REAL trade status
     */
    async getTradeStatus(tradeId) {
        const tradeData = this.activeTrades.get(tradeId);
        if (!tradeData) {
            // Check on-chain if trade exists
            try {
                // This would require iterating through contracts
                return { exists: false };
            } catch {
                return { exists: false };
            }
        }

        // Get REAL on-chain status
        try {
            const stakingContract = new ethers.Contract(
                tradeData.stakingContract,
                USER_STAKING_ABI,
                this.signer
            );

            const tradeActive = await stakingContract.activeTrades(tradeId);

            return {
                exists: true,
                user: tradeData.user,
                amount: tradeData.amount,
                elapsed: Date.now() - tradeData.startTime,
                bridgeCompleted: tradeData.bridgeCompleted,
                tradeExecuted: tradeData.tradeExecuted,
                onChainActive: tradeActive,
                debridgeId: tradeData.debridgeId
            };
        } catch (error) {
            return {
                exists: true,
                user: tradeData.user,
                amount: tradeData.amount,
                elapsed: Date.now() - tradeData.startTime,
                bridgeCompleted: tradeData.bridgeCompleted,
                tradeExecuted: tradeData.tradeExecuted,
                error: error.message
            };
        }
    }

    /**
     * Set debridgeId for a trade
     */
    setDebridgeId(tradeId, debridgeId) {
        const tradeData = this.activeTrades.get(tradeId);
        if (tradeData) {
            tradeData.debridgeId = debridgeId;
            tradeData.bridgeInitiated = true;
            console.log(`[REAL] Set debridgeId ${debridgeId} for trade ${tradeId}`);
        }
    }
}

// Export for use in main backend service
export default TradeMonitor;