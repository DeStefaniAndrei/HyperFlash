import "@nomicfoundation/hardhat-toolbox";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: "0.8.24",
  networks: {
    // Base Sepolia configuration
    baseSepolia: {
      url: "https://sepolia.base.org",
      chainId: 84532,
      accounts: ["3d6f146e428a9e046ece85ea3442016f2d05b4971075fb27d64ec63888187ec0"] // Public test wallet
    },
    // HyperLiquid testnet configuration
    hyperLiquidTestnet: {
      url: "https://rpc.hyperliquid-testnet.xyz/evm",
      chainId: 998,
      accounts: ["3d6f146e428a9e046ece85ea3442016f2d05b4971075fb27d64ec63888187ec0"], // Public test wallet
      gasPrice: 1000000000, // 1 gwei
      gas: 30000000 // 30M gas for deployments
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
}