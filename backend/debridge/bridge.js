import { ethers } from "ethers";
import axios from "axios";

// DeBridge REAL configuration
const DEBRIDGE_CONFIG = {
    // DeBridge API endpoints
    API_BASE: "https://api.debridge.finance",

    // DeBridgeGate contract address (same on all chains)
    GATE_ADDRESS: "0x43dE2d77BF8027e25dBD179B491e8d64f38398aA",

    // Chain IDs
    BASE_SEPOLIA_CHAIN_ID: 84532,
    HYPERLIQUID_TESTNET_CHAIN_ID: 998,

    // Token addresses
    USDC_BASE_SEPOLIA: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",

    // RPC endpoints
    BASE_RPC: "https://sepolia.base.org",
    HYPERLIQUID_RPC: "https://rpc.hyperliquid-testnet.xyz/evm"
};

// DeBridgeGate ABI (minimal for interaction)
const DEBRIDGE_GATE_ABI = [
    "function send(address _tokenAddress, uint256 _amount, uint256 _chainIdTo, bytes _receiver, bytes _permit, bool _useAssetFee, uint32 _referralCode, bytes _autoParams) external payable",
    "function claim(bytes _debridgeId, uint256 _amount, uint256 _chainIdFrom, address _receiver, uint256 _nonce, bytes _signatures, bytes _autoParams) external",
    "event Sent(bytes32 indexed debridgeId, uint256 amount, uint256 chainIdTo, bytes receiver, uint256 nonce, uint32 referralCode)",
    "event Claimed(bytes32 indexed debridgeId, uint256 amount, uint256 chainIdFrom, address receiver, uint256 nonce)"
];

class DeBridgeService {
    constructor(privateKey) {
        // Initialize providers
        this.baseProvider = new ethers.JsonRpcProvider(DEBRIDGE_CONFIG.BASE_RPC);
        this.hyperProvider = new ethers.JsonRpcProvider(DEBRIDGE_CONFIG.HYPERLIQUID_RPC);

        // Initialize signers
        this.baseSigner = new ethers.Wallet(privateKey, this.baseProvider);
        this.hyperSigner = new ethers.Wallet(privateKey, this.hyperProvider);

        // Initialize DeBridgeGate contracts
        this.baseGate = new ethers.Contract(
            DEBRIDGE_CONFIG.GATE_ADDRESS,
            DEBRIDGE_GATE_ABI,
            this.baseSigner
        );

        this.hyperGate = new ethers.Contract(
            DEBRIDGE_CONFIG.GATE_ADDRESS,
            DEBRIDGE_GATE_ABI,
            this.hyperSigner
        );
    }

    /**
     * REAL bridge initiation from Base Sepolia to HyperLiquid testnet
     * @param {string} userAddress - User's address
     * @param {string} amount - Amount to bridge in USDC (with decimals)
     * @param {string} tradeId - Unique trade identifier
     * @returns {Object} Bridge transaction details
     */
    async initiateBridge(userAddress, amount, tradeId) {
        console.log(`[REAL] Initiating DeBridge for trade ${tradeId}`);
        console.log(`Amount: ${amount} USDC from ${userAddress}`);

        try {
            // First approve USDC spending if needed
            const usdcContract = new ethers.Contract(
                DEBRIDGE_CONFIG.USDC_BASE_SEPOLIA,
                ["function approve(address spender, uint256 amount) external returns (bool)"],
                this.baseSigner
            );

            // Approve DeBridgeGate to spend USDC
            const approveTx = await usdcContract.approve(
                DEBRIDGE_CONFIG.GATE_ADDRESS,
                amount
            );
            await approveTx.wait();
            console.log("USDC approval completed");

            // Prepare the send parameters
            const receiver = ethers.AbiCoder.defaultAbiCoder().encode(
                ["address"],
                [userAddress]
            );

            // Auto params for automatic claim on destination
            const autoParams = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "address", "uint256", "bytes"],
                [
                    0, // execution fee (0 for testnet)
                    userAddress, // fallback address
                    0, // flags
                    "0x" // call data
                ]
            );

            // Execute the REAL send transaction
            const tx = await this.baseGate.send(
                DEBRIDGE_CONFIG.USDC_BASE_SEPOLIA, // token address
                amount, // amount
                DEBRIDGE_CONFIG.HYPERLIQUID_TESTNET_CHAIN_ID, // destination chain
                receiver, // receiver bytes
                "0x", // permit (empty)
                false, // useAssetFee
                0, // referral code
                autoParams, // auto params
                { value: ethers.parseEther("0.01") } // pay protocol fee in ETH
            );

            console.log("DeBridge send transaction submitted:", tx.hash);

            // Wait for transaction confirmation
            const receipt = await tx.wait();

            // Extract the debridgeId from events
            const sentEvent = receipt.logs.find(log => {
                try {
                    const parsed = this.baseGate.interface.parseLog(log);
                    return parsed.name === "Sent";
                } catch {
                    return false;
                }
            });

            const debridgeId = sentEvent ? sentEvent.args[0] : null;

            console.log("Bridge initiated successfully");
            console.log("Transaction hash:", receipt.hash);
            console.log("DeBridge ID:", debridgeId);
            console.log("Block number:", receipt.blockNumber);

            return {
                success: true,
                txHash: receipt.hash,
                debridgeId: debridgeId,
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
     * REAL monitoring of bridge completion on HyperLiquid
     * @param {string} debridgeId - DeBridge ID from send transaction
     * @param {string} tradeId - Trade identifier
     * @returns {Object} Bridge completion status
     */
    async monitorBridgeCompletion(debridgeId, tradeId) {
        console.log(`[REAL] Monitoring bridge completion for ${tradeId}`);
        console.log(`DeBridge ID: ${debridgeId}`);

        const startTime = Date.now();
        const timeout = 60000; // 60 seconds timeout
        const checkInterval = 2000; // Check every 2 seconds

        while (Date.now() - startTime < timeout) {
            try {
                // Query DeBridge API for transaction status
                const statusResponse = await axios.get(
                    `${DEBRIDGE_CONFIG.API_BASE}/v1/transaction/${debridgeId}/status`
                ).catch(() => null);

                if (statusResponse && statusResponse.data) {
                    const status = statusResponse.data.status;
                    console.log(`Bridge status: ${status}`);

                    if (status === "Claimed" || status === "Completed") {
                        console.log(`Bridge completed for trade ${tradeId}`);
                        return {
                            success: true,
                            tradeId: tradeId,
                            debridgeId: debridgeId,
                            completionTime: Date.now() - startTime,
                            status: status
                        };
                    }
                }

                // Also check for Claimed event on destination chain
                const filter = this.hyperGate.filters.Claimed(debridgeId);
                const events = await this.hyperGate.queryFilter(filter);

                if (events.length > 0) {
                    console.log(`Bridge claimed on HyperLiquid for trade ${tradeId}`);
                    return {
                        success: true,
                        tradeId: tradeId,
                        debridgeId: debridgeId,
                        completionTime: Date.now() - startTime,
                        claimTx: events[0].transactionHash
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
     * REAL check if bridge has been fulfilled by querying events
     */
    async checkBridgeFulfillment(debridgeId) {
        try {
            // Check for Claimed event on HyperLiquid
            const filter = this.hyperGate.filters.Claimed(debridgeId);
            const events = await this.hyperGate.queryFilter(filter);

            return events.length > 0;
        } catch (error) {
            console.error("Error checking fulfillment:", error);
            return false;
        }
    }

    /**
     * Get REAL bridge status from DeBridge API
     * @param {string} debridgeId - DeBridge ID
     * @returns {Object} Current bridge status
     */
    async getBridgeStatus(debridgeId) {
        try {
            const response = await axios.get(
                `${DEBRIDGE_CONFIG.API_BASE}/v1/transaction/${debridgeId}/status`
            );

            return {
                success: true,
                status: response.data
            };
        } catch (error) {
            // If API fails, check on-chain
            const fulfilled = await this.checkBridgeFulfillment(debridgeId);
            return {
                success: true,
                status: fulfilled ? "Claimed" : "Pending"
            };
        }
    }
}

export default DeBridgeService;