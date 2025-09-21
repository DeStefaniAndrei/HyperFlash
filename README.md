# HyperFlash ⚡

**Cross-Chain HFT Infrastructure for Instant Trading**

HyperFlash enables sub-second cross-chain trading on HyperLiquid without waiting for bridge completion. Trade immediately while funds bridge asynchronously in the background.

## 🚀 Key Features

- **Instant Execution**: Trade immediately, no 2-10 second bridge wait
- **Staking Security**: User funds backed by staking collateral
- **Async Bridging**: DeBridge handles fund movement in background
- **10x Faster**: Compared to traditional cross-chain trading
- **Slashing Protection**: Malicious actors get slashed automatically

## 📐 Architecture

```
User (Base) → Staking Contract → SDK → Shared EOA (HyperLiquid) → Trade Execution
                                   ↓
                            DeBridge (2s async)
```

### How It Works

1. **User Stakes**: Deploys personal staking contract and locks funds
2. **Trade Request**: SDK verifies stake and initiates trade
3. **Instant Execution**: Shared EOA executes trade immediately
4. **Bridge Async**: DeBridge moves funds (2 seconds in background)
5. **Settlement**: Funds arrive in shared EOA, trade settles
6. **Slashing**: If bridge fails, user's stake gets slashed

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity (Hardhat)
- **Backend**: Node.js/TypeScript
- **SDK**: Python (HyperLiquid integration)
- **Bridge**: DeBridge Protocol
- **Networks**: Base Sepolia → HyperLiquid Testnet

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/DeStefaniAndrei/HyperFlash.git
cd HyperFlash

# Install dependencies
npm install

# Compile contracts
npm run compile
```

## 🔧 Configuration

### Test Wallet (Public - No Real Funds)
```
Address: 0xF5AD9A14152ee5c12d17d9C1e99fe8193F27Eb8F
Private Key: 3d6f146e428a9e046ece85ea3442016f2d05b4971075fb27d64ec63888187ec0
```

### Networks
- **Base Sepolia**: Chain ID 84532
- **HyperLiquid Testnet**: Chain ID 998

## 🚀 Quick Start

### 1. Deploy Contracts

```bash
# Deploy to HyperLiquid testnet
npm run deploy:hyperliquid

# Note the Factory contract address
```

### 2. Start Backend Service

```bash
# Start backend with factory address
npm run backend <FACTORY_ADDRESS>

# Example:
npm run backend 0x123...
```

### 3. Run Interactive Demo

```bash
# Run CLI demo
npm run demo
```

### 4. Use Python SDK

```python
from sdk.hyperflash_sdk import HyperFlashSDK

# Initialize SDK
sdk = HyperFlashSDK(private_key="...")

# Execute trade
result = sdk.initiate_trade(
    amount="1000000000",  # 1000 USDC
    pair="BTC/USDC",
    side="buy",
    price=50000.0
)
```

## 📊 Performance Comparison

| Method | Time | Speed |
|--------|------|-------|
| Traditional Bridge | 10-30s | 🐌 |
| Optimistic Bridge | 2-5s | 🚶 |
| **HyperFlash** | **<0.5s** | **⚡** |

## 🏗️ Project Structure

```
HyperFlash/
├── contracts/           # Smart contracts
│   ├── Factory.sol     # Deploys user staking contracts
│   └── UserStaking.sol # Locks funds & handles slashing
├── backend/
│   ├── server.js       # Main backend service
│   ├── monitor/        # Trade monitoring
│   └── debridge/       # Bridge integration
├── sdk/                # Python SDK
├── demo/               # CLI demo
└── scripts/            # Deployment scripts
```

## 🔐 Security Model

### Staking-Based Trust
- Users stake funds to validators
- Stake acts as collateral for trades
- Slashing for malicious behavior

### Slashing Conditions
- Bridge fails after trade execution
- User's staked funds get slashed
- Shared EOA compensated from slash

## 🧪 Testing

```bash
# Run contract tests
npm test

# Test single trade
curl -X POST http://localhost:3000/trade/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0xF5AD9A14152ee5c12d17d9C1e99fe8193F27Eb8F",
    "amount": "1000000000",
    "tradeParams": {
      "pair": "BTC/USDC",
      "side": "buy",
      "price": 50000
    }
  }'
```

## 📝 API Endpoints

### Backend Service

- `GET /health` - Service health check
- `POST /trade/initiate` - Initiate new trade
- `GET /trade/status/:tradeId` - Get trade status

## 🎯 Hackathon Deliverables

✅ Smart Contracts (Factory + UserStaking)
✅ DeBridge Integration
✅ Backend Monitoring Service
✅ Python SDK with HyperLiquid
✅ Interactive CLI Demo
✅ Speed Advantage Demonstration

## 🚨 Important Notes

- **Testnet Only**: This is a hackathon MVP using testnets
- **Manual Funding**: Shared EOA needs manual funding for demo
- **Simplified Slashing**: Production would have more sophisticated logic

## 📄 License

MIT

## 🤝 Team

Built for HyperLiquid Hackathon in 12 hours

---

**HyperFlash** - Trade at the speed of thought ⚡
