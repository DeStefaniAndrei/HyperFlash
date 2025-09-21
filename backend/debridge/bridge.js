import { DlnClient } from "@debridge-finance/dln-client";
import { ethers } from "ethers";

// DeBridge configuration
const DEBRIDGE_CONFIG = {
    // DeBridgeGate address (same on all chains)
    gate: "0x43dE2d77BF8027e25dBD179B491e8d64f38398aA",

    // Chain IDs
    BASE_SEPOLIA_CHAIN_ID: 84532,
    HYPERLIQUID_TESTNET_CHAIN_ID: 998,

    // Token addresses
    USDC_BASE_SEPOLIA: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",

    // RPC endpoints
    BASE_RPC: "https://sepolia.base.org",
    HYPERLIQUID_RPC: "https://rpc.hyperliquid-testnet.xyz/evm"
};

class DeBridgeService {
    constructor(privateKey) {
        // Initialize providers
        this.baseProvider = new ethers.JsonRpcProvider(DEBRIDGE_CONFIG.BASE_RPC);
        this.hyperProvider = new ethers.JsonRpcProvider(DEBRIDGE_CONFIG.HYPERLIQUID_RPC);

        // Initialize signers
        this.baseSigner = new ethers.Wallet(privateKey, this.baseProvider);
        this.hyperSigner = new ethers.Wallet(privateKey, this.hyperProvider);

        // Initialize DeBridge client
        this.dlnClient = new DlnClient();
    }

    /**
     * Initiate bridge from Base Sepolia to HyperLiquid testnet
     * @param {string} userAddress - User's address
     * @param {string} amount - Amount to bridge in USDC (with decimals)
     * @param {string} tradeId - Unique trade identifier
     * @returns {Object} Bridge transaction details
     */
    async initiateBridge(userAddress, amount, tradeId) {
        console.log(`Initiating bridge for trade ${tradeId}`);
        console.log(`Amount: ${amount} USDC from ${userAddress}`);

        try {
            // Create the bridge order
            const order = {
                give: {
                    chainId: DEBRIDGE_CONFIG.BASE_SEPOLIA_CHAIN_ID,
                    tokenAddress: DEBRIDGE_CONFIG.USDC_BASE_SEPOLIA,
                    amount: amount
                },
                take: {
                    chainId: DEBRIDGE_CONFIG.HYPERLIQUID_TESTNET_CHAIN_ID,
                    tokenAddress: ethers.ZeroAddress, // Native token on HyperLiquid
                    amount: amount // Same amount (simplified for MVP)
                },
                receiver: userAddress,
                givePatchAuthority: userAddress,
                // Add trade ID as metadata for tracking
                externalCall: {
                    data: ethers.toUtf8Bytes(tradeId)
                }
            };

            // Create the transaction
            const tx = await this.dlnClient.createOrder(order, this.baseSigner);

            console.log("Bridge transaction created:", tx.hash);

            // Send the transaction
            const receipt = await tx.wait();

            console.log("Bridge initiated successfully");
            console.log("Transaction hash:", receipt.hash);
            console.log("Block number:", receipt.blockNumber);

            return {
                success: true,
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                tradeId: tradeId,
                amount: amount,
                timestamp: Date.now()
            };

        } catch (error) {
            console.error("Bridge initiation failed:", error);
            return {
                success: false,
                error: error.message,
                tradeId: tradeId
            };
        }
    }

    /**
     * Monitor bridge completion on HyperLiquid
     * @param {string} txHash - Transaction hash from Base
     * @param {string} tradeId - Trade identifier
     * @returns {Object} Bridge completion status
     */
    async monitorBridgeCompletion(txHash, tradeId) {
        console.log(`Monitoring bridge completion for ${tradeId}`);

        const startTime = Date.now();
        const timeout = 60000; // 60 seconds timeout
        const checkInterval = 2000; // Check every 2 seconds

        while (Date.now() - startTime < timeout) {
            try {
                // Check for claim event on HyperLiquid
                // In production, we'd monitor specific events
                // For MVP, simplified checking

                // Check if funds arrived by querying balance
                // This is a simplified approach for MVP
                const fulfilled = await this.checkBridgeFulfillment(tradeId);

                if (fulfilled) {
                    console.log(`Bridge completed for trade ${tradeId}`);
                    return {
                        success: true,
                        tradeId: tradeId,
                        completionTime: Date.now() - startTime
                    };
                }

            } catch (error) {
                console.error("Error checking bridge status:", error);
            }

            // Wait before next check
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }

        // Timeout reached
        console.error(`Bridge timeout for trade ${tradeId}`);
        return {
            success: false,
            tradeId: tradeId,
            error: "Bridge completion timeout"
        };
    }

    /**
     * Check if bridge has been fulfilled
     * Simplified for MVP - in production would check events
     */
    async checkBridgeFulfillment(tradeId) {
        // For MVP, we'll implement a simple check
        // In production, monitor DeBridge claim events

        // This would be replaced with actual event monitoring
        // For now, return false to continue monitoring
        return false;
    }

    /**
     * Get bridge status
     * @param {string} orderId - DeBridge order ID
     * @returns {Object} Current bridge status
     */
    async getBridgeStatus(orderId) {
        try {
            const status = await this.dlnClient.getOrderStatus(orderId);
            return {
                success: true,
                status: status
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default DeBridgeService;