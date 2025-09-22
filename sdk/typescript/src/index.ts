/**
 * HyperFlash SDK
 *
 * This is the main file that developers will use to interact with HyperFlash.
 * Think of this as the "remote control" for the HyperFlash system.
 */

import { ethers } from 'ethers';
import axios from 'axios';

/**
 * Configuration options for the SDK
 * These are settings the developer can change
 */
export interface HyperFlashConfig {
    network?: 'mainnet' | 'testnet' | 'localhost';  // Which network to use
    backendUrl?: string;                             // Where our backend server is
    privateKey?: string;                             // User's wallet private key
    sourceChain?: 'base' | 'ethereum' | 'arbitrum'; // Source chain for cross-chain trades
}

/**
 * Trade parameters - what info we need to execute a trade
 */
export interface TradeParams {
    sourceToken: string;     // Token they're trading from (e.g., "USDC")
    sourceChain?: string;    // Which chain the source token is on (e.g., "base")
    amount: number;          // How much to trade
    targetPair: string;      // What to trade to (e.g., "BTC/USDC")
    side: 'buy' | 'sell';    // Buy or sell
    price?: number;          // Optional: specific price
}

/**
 * Chain configuration for cross-chain support
 */
export interface ChainConfig {
    chainId: number;
    name: string;
    rpcUrl: string;
    usdcAddress: string;     // USDC contract address on this chain
    bridgeAddress?: string;  // DeBridge gate address
}

/**
 * The main HyperFlash SDK class
 * This is what developers will create and use
 */
export class HyperFlashSDK {
    // Private properties (internal use only)
    private provider: ethers.Provider;
    private wallet?: ethers.Wallet;
    private backendUrl: string;
    private factoryAddress?: string;
    private sourceChain: string;

    // Chain configurations for cross-chain support
    private static readonly CHAIN_CONFIGS: Record<string, ChainConfig> = {
        'base': {
            chainId: 8453,
            name: 'Base',
            rpcUrl: 'https://mainnet.base.org',
            usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            bridgeAddress: '0x43dE2d77BF8027e25dBD179B491e8d64f38398aA'
        },
        'base-sepolia': {
            chainId: 84532,
            name: 'Base Sepolia',
            rpcUrl: 'https://sepolia.base.org',
            usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
            bridgeAddress: '0x43dE2d77BF8027e25dBD179B491e8d64f38398aA'
        },
        'ethereum': {
            chainId: 1,
            name: 'Ethereum',
            rpcUrl: 'https://eth.llamarpc.com',
            usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            bridgeAddress: '0x43dE2d77BF8027e25dBD179B491e8d64f38398aA'
        },
        'arbitrum': {
            chainId: 42161,
            name: 'Arbitrum',
            rpcUrl: 'https://arb1.arbitrum.io/rpc',
            usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            bridgeAddress: '0x43dE2d77BF8027e25dBD179B491e8d64f38398aA'
        }
    };

    /**
     * Constructor - this runs when someone creates a new SDK instance
     * Example: const sdk = new HyperFlashSDK({ network: 'testnet' });
     */
    constructor(config: HyperFlashConfig = {}) {
        // Set up the network connection
        const network = config.network || 'localhost';
        this.backendUrl = config.backendUrl || this.getDefaultBackendUrl(network);

        // Connect to the blockchain
        this.provider = this.createProvider(network);

        // If they provided a private key, create a wallet
        if (config.privateKey) {
            this.wallet = new ethers.Wallet(config.privateKey, this.provider);
        }

        console.log(`✅ HyperFlash SDK initialized on ${network}`);
    }

    /**
     * Helper function to get the right backend URL for each network
     */
    private getDefaultBackendUrl(network: string): string {
        const urls = {
            'mainnet': 'https://api.hyperflash.io',      // Production (not deployed yet)
            'testnet': 'https://testnet.hyperflash.io',  // Testnet (not deployed yet)
            'localhost': 'http://localhost:3000'         // Local development
        };
        return urls[network] || urls['localhost'];
    }

    /**
     * Helper function to create blockchain connection
     */
    private createProvider(network: string): ethers.Provider {
        const rpcs = {
            'mainnet': 'https://rpc.hyperliquid.xyz/evm',
            'testnet': 'https://rpc.hyperliquid-testnet.xyz/evm',
            'localhost': 'http://localhost:8545'
        };
        return new ethers.JsonRpcProvider(rpcs[network]);
    }

    /**
     * 1. CHECK STAKING STATUS
     * This checks if the user has staked funds to enable trading
     *
     * Example usage:
     * const status = await sdk.checkStakingStatus();
     * console.log(`Staked: ${status.stakedAmount} ETH`);
     */
    async checkStakingStatus(): Promise<{
        hasStaking: boolean;
        stakedAmount: string;
        isActive: boolean;
    }> {
        console.log('🔍 Checking staking status...');

        if (!this.wallet) {
            throw new Error('Wallet not configured. Please provide a private key.');
        }

        try {
            // Call our backend to check status
            const response = await axios.get(
                `${this.backendUrl}/user/staking-status/${this.wallet.address}`
            );

            return {
                hasStaking: response.data.hasStakingContract,
                stakedAmount: response.data.stakedAmount,
                isActive: response.data.isActive
            };
        } catch (error) {
            console.error('Failed to check staking status:', error);
            throw error;
        }
    }

    /**
     * 2. DEPLOY STAKING CONTRACT
     * This creates a personal staking contract for the user
     *
     * Example usage:
     * const contractAddress = await sdk.deployStakingContract();
     * console.log(`Your staking contract: ${contractAddress}`);
     */
    async deployStakingContract(): Promise<string> {
        console.log('📦 Deploying your staking contract...');

        if (!this.wallet) {
            throw new Error('Wallet not configured. Please provide a private key.');
        }

        try {
            // Call backend to help deploy
            const response = await axios.post(
                `${this.backendUrl}/user/deploy-staking`,
                {
                    userAddress: this.wallet.address
                }
            );

            if (response.data.success) {
                console.log(`✅ Staking contract deployed at: ${response.data.contractAddress}`);
                return response.data.contractAddress;
            } else {
                throw new Error(response.data.error || 'Deployment failed');
            }
        } catch (error) {
            console.error('Failed to deploy staking contract:', error);
            throw error;
        }
    }

    /**
     * 3. STAKE FUNDS
     * This locks funds in the staking contract to enable trading
     *
     * Example usage:
     * await sdk.stakeFunds(1.0); // Stake 1 ETH
     */
    async stakeFunds(amountInEth: number): Promise<string> {
        console.log(`💰 Staking ${amountInEth} ETH...`);

        if (!this.wallet) {
            throw new Error('Wallet not configured. Please provide a private key.');
        }

        try {
            // First, get the staking contract address
            const status = await this.checkStakingStatus();
            if (!status.hasStaking) {
                throw new Error('No staking contract found. Deploy one first.');
            }

            // Call the staking function
            // In real implementation, this would call the smart contract
            const response = await axios.post(
                `${this.backendUrl}/user/stake`,
                {
                    userAddress: this.wallet.address,
                    amount: ethers.parseEther(amountInEth.toString()).toString()
                }
            );

            if (response.data.success) {
                console.log(`✅ Successfully staked ${amountInEth} ETH`);
                return response.data.txHash;
            } else {
                throw new Error(response.data.error || 'Staking failed');
            }
        } catch (error) {
            console.error('Failed to stake funds:', error);
            throw error;
        }
    }

    /**
     * 4. EXECUTE TRADE (Main Feature!)
     * This is the core functionality - executing ultra-fast cross-chain trades
     *
     * Example usage:
     * const tradeId = await sdk.executeTrade({
     *     sourceToken: 'USDC',
     *     amount: 1000,
     *     targetPair: 'BTC/USDC',
     *     side: 'buy'
     * });
     */
    async executeTrade(params: TradeParams): Promise<{
        tradeId: string;
        executionTime: number;
        status: string;
    }> {
        console.log('🚀 Executing trade...');
        console.log(`   ${params.side} ${params.amount} ${params.sourceToken} → ${params.targetPair}`);

        if (!this.wallet) {
            throw new Error('Wallet not configured. Please provide a private key.');
        }

        const startTime = Date.now();

        try {
            // Send trade request to our backend
            // Backend will initiate DeBridge from source chain to HyperLiquid
            const response = await axios.post(
                `${this.backendUrl}/trade/initiate`,
                {
                    userAddress: this.wallet.address,
                    sourceToken: params.sourceToken,
                    sourceChain: params.sourceChain || 'base',  // Default to Base chain
                    amount: params.amount.toString(),
                    tradeParams: {
                        pair: params.targetPair,
                        side: params.side,
                        price: params.price,
                        type: params.price ? 'limit' : 'market'
                    }
                }
            );

            const executionTime = Date.now() - startTime;

            if (response.data.success) {
                console.log(`✅ Trade executed in ${executionTime}ms!`);
                console.log(`   Trade ID: ${response.data.tradeId}`);

                return {
                    tradeId: response.data.tradeId,
                    executionTime,
                    status: 'executed'
                };
            } else {
                throw new Error(response.data.error || 'Trade failed');
            }
        } catch (error) {
            console.error('Failed to execute trade:', error);
            throw error;
        }
    }

    /**
     * 5. GET TRADE STATUS
     * Check the status of a trade after execution
     *
     * Example usage:
     * const status = await sdk.getTradeStatus('trade_123456');
     */
    async getTradeStatus(tradeId: string): Promise<any> {
        console.log(`📊 Checking status of trade ${tradeId}...`);

        try {
            const response = await axios.get(
                `${this.backendUrl}/trade/status/${tradeId}`
            );

            return response.data;
        } catch (error) {
            console.error('Failed to get trade status:', error);
            throw error;
        }
    }

    /**
     * 6. GET ACTIVE TRADES
     * Get all currently active trades for the user
     *
     * Example usage:
     * const trades = await sdk.getActiveTrades();
     */
    async getActiveTrades(): Promise<any[]> {
        console.log('📋 Fetching active trades...');

        if (!this.wallet) {
            throw new Error('Wallet not configured. Please provide a private key.');
        }

        try {
            const response = await axios.get(
                `${this.backendUrl}/trades/active?user=${this.wallet.address}`
            );

            return response.data.trades || [];
        } catch (error) {
            console.error('Failed to get active trades:', error);
            throw error;
        }
    }

    /**
     * 7. ESTIMATE GAS COSTS
     * Calculate how much a trade will cost in gas fees
     *
     * Example usage:
     * const estimate = await sdk.estimateGasCost('BTC/USDC', 1000);
     */
    async estimateGasCost(targetPair: string, amount: number): Promise<{
        estimatedGas: string;
        costInEth: string;
        costInUsd: string;
    }> {
        console.log('⛽ Estimating gas costs...');

        try {
            const response = await axios.post(
                `${this.backendUrl}/estimate/gas`,
                {
                    pair: targetPair,
                    amount: amount
                }
            );

            return response.data;
        } catch (error) {
            console.error('Failed to estimate gas:', error);
            throw error;
        }
    }

    /**
     * 8. GET WALLET ADDRESS
     * Simple helper to get the current wallet address
     */
    getWalletAddress(): string | undefined {
        return this.wallet?.address;
    }

    /**
     * 9. IS CONNECTED
     * Check if the SDK is properly connected
     */
    async isConnected(): Promise<boolean> {
        try {
            await this.provider.getNetwork();
            return true;
        } catch {
            return false;
        }
    }
}

// Export everything that developers might need
export default HyperFlashSDK;