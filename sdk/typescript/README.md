# HyperFlash SDK

The official JavaScript/TypeScript SDK for HyperFlash - enabling ultra-fast cross-chain trading on HyperLiquid.

## 🚀 Quick Start

### Installation

```bash
npm install @hyperflash/sdk
```

### Basic Usage

```javascript
const { HyperFlashSDK } = require('@hyperflash/sdk');

// Initialize SDK
const sdk = new HyperFlashSDK({
    network: 'testnet',
    privateKey: 'your_private_key_here'
});

// Execute a trade
const trade = await sdk.executeTrade({
    sourceToken: 'USDC',
    amount: 1000,
    targetPair: 'BTC/USDC',
    side: 'buy'
});

console.log(`Trade executed in ${trade.executionTime}ms!`);
```

## 📚 Full Documentation

### Creating an SDK Instance

```javascript
const sdk = new HyperFlashSDK({
    network: 'mainnet',    // 'mainnet' | 'testnet' | 'localhost'
    privateKey: 'key',     // Your wallet private key
    backendUrl: 'url'      // Optional: custom backend URL
});
```

### Available Methods

#### 1. Check Staking Status
```javascript
const status = await sdk.checkStakingStatus();
// Returns: { hasStaking: boolean, stakedAmount: string, isActive: boolean }
```

#### 2. Deploy Staking Contract
```javascript
const contractAddress = await sdk.deployStakingContract();
// Returns: string (contract address)
```

#### 3. Stake Funds
```javascript
const txHash = await sdk.stakeFunds(1.0); // Amount in ETH
// Returns: string (transaction hash)
```

#### 4. Execute Trade
```javascript
const result = await sdk.executeTrade({
    sourceToken: 'USDC',      // Token you're trading from
    amount: 1000,              // Amount to trade
    targetPair: 'BTC/USDC',    // Trading pair on HyperLiquid
    side: 'buy',               // 'buy' or 'sell'
    price: 50000               // Optional: limit price
});
// Returns: { tradeId: string, executionTime: number, status: string }
```

#### 5. Get Trade Status
```javascript
const status = await sdk.getTradeStatus('trade_123456');
// Returns: Full trade status object
```

#### 6. Get Active Trades
```javascript
const trades = await sdk.getActiveTrades();
// Returns: Array of active trades
```

#### 7. Estimate Gas Costs
```javascript
const estimate = await sdk.estimateGasCost('BTC/USDC', 1000);
// Returns: { estimatedGas: string, costInEth: string, costInUsd: string }
```

## 🔥 Features

- **Sub-second execution**: Trades execute in <500ms
- **Cross-chain support**: Trade assets from any chain on HyperLiquid
- **Type-safe**: Full TypeScript support with type definitions
- **Simple API**: Easy-to-use methods for all operations
- **Error handling**: Comprehensive error messages

## 🛠️ Development

### Building from Source

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Watch mode (for development)
npm run dev
```

### Running Examples

```bash
# Quick start example
node examples/quickstart.js

# Advanced trading bot
node examples/advanced-trading.js
```

## 📊 Network Support

| Network | RPC Endpoint | Status |
|---------|-------------|--------|
| Localhost | http://localhost:8545 | ✅ Active |
| Testnet | https://rpc.hyperliquid-testnet.xyz/evm | ✅ Active |
| Mainnet | https://rpc.hyperliquid.xyz/evm | 🚧 Coming Soon |

## 🔐 Security

- **Never share your private key**
- **Always use environment variables for keys in production**
- **Test on testnet first**

## 📝 License

MIT

## 🤝 Support

- GitHub Issues: [github.com/hyperflash/sdk/issues](https://github.com/hyperflash/sdk/issues)
- Discord: [discord.gg/hyperflash](https://discord.gg/hyperflash)
- Twitter: [@hyperflash](https://twitter.com/hyperflash)