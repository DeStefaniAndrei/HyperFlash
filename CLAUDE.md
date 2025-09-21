# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# IMPORTANT - WORKING RELATIONSHIP
- **I am the coder** - You are the boss/decision maker
- **I have NO empowerment to make decisions** - I must ask you for every architectural/design choice
- **Always ask for approval** before making any significant decisions
- **NO MOCK CODE** - Everything must be real implementation (unless you explicitly tell me to mock)
- Always prioritize writing clean, simple, and modular code
- Use simple & easy-to-understand language. Write in short sentences
- DO NOT BE LAZY! Always read files in FULL!!
- DO NOT CODE IF THERE'S ANYTHING YOU AREN'T COMPLETELY SURE OF OR DON'T UNDERSTAND
- Always ask for clarification when working with new SDKs/APIs
- Explain the code as simply as possible as if you were speaking to a beginner dev, do it in the code comments
- **NEVER ADD THINGS ON MY OWN JUDGMENT** - Do not add features, security measures, or limitations unless explicitly discussed
- **ALWAYS CONSULT BEFORE ADDING** - If something seems missing, ASK don't assume

# HyperFlash - Cross-Chain HFT Infrastructure
**Hackathon Project**: HyperLiquid Hackathon (12-hour sprint)
**Goal**: Enable sub-2 second cross-chain trading without traditional bridging delays

## Core Architecture

### The Problem
- HFT trading is inefficient cross-chain due to bridging delays (minimum 2 seconds)
- Bridging is expensive for frequent trades
- Traditional bridges create capital inefficiency

### The Solution - Staking-Based Trust System
**CORRECTED ARCHITECTURE**: Async bridging with immediate execution backed by staking:

1. **User Staking Contract**: User deploys personal contract via factory that locks funds and delegates stake to HyperLiquid validator
2. **Stake Delegation**: Contract delegates stake to validator - this gives contract authority to slash on its own terms
3. **SDK Trade Submission**: User submits trade via SDK (specifies source token, quantity, trade pair, requirements)
4. **DeBridge Initialization**: SDK communicates with DeBridge to start bridging (2 seconds)
5. **Immediate Execution**: Shared EOA immediately executes trade using pre-funded liquidity
6. **Bridge Completion**: Bridged funds arrive in shared EOA
7. **Trade Settlement**: Each trade has unique ID - funds returned to user when trade ends

### Key Design Decisions
- **Staking for slashing authority**: Smart contract can slash user's stake if malicious
- **Shared EOA wallet**: Single pre-funded wallet executes all trades immediately
- **DeBridge integration**: Handles actual cross-chain movement (2 seconds async)
- **No value locking**: Different from previous design iterations
- **Factory pattern**: Each user gets personal staking contract
- **Unique trade IDs**: Links trades back to user wallets for settlement
- **NO rate limiting, NO over-collateralization, NO simultaneous trade limits**

## HyperLiquid Platform Knowledge

### HyperEVM Capabilities
- **L1 Chain**: HyperLiquid is its own L1 with HyperEVM support
- **Smart Contracts**: Full EVM support via HyperEVM (Cancun spec)
- **Chain ID**: 999 (mainnet), 998 (testnet)
- **RPC**: https://rpc.hyperliquid.xyz/evm (mainnet)
- **Block Time**: 0.07 seconds with single-block finality
- **TPS**: 200,000 orders/second on HyperCore

### Critical Precompiled Contracts
- **0x0000000000000000000000000000000000000802**: User balances
- **0x0000000000000000000000000000000000000807**: Oracle prices
- **0x3333333333333333333333333333333333333333**: CoreWriter (execute trades)

### Block Size Management
```bash
# For deployment (large blocks - 30M gas, 60 seconds)
npx @layerzerolabs/hyperliquid-composer set-block --size big --network mainnet --private-key $PRIVATE_KEY

# For regular operations (small blocks - 2M gas, 1 second)
npx @layerzerolabs/hyperliquid-composer set-block --size small --network mainnet --private-key $PRIVATE_KEY
```

## Technical Stack

### Smart Contracts (Solidity - HyperLiquid Testnet)
- **Factory Contract**: Deploys personal staking contracts for users
- **User Staking Contract**: Stakes to validators, handles slashing logic
- **Monitoring**: Watches for malicious behavior (bridge fail + trade executed)

### Backend (Python)
- **SDK Service**: Verifies staking, initiates trades, monitors bridges
- **Trade Executor**: Manages shared wallet trades
- **Bridge Monitor**: Tracks DeBridge transaction status

### Dependencies
```json
{
  "ethers": "^6.x",
  "express": "^4.x",
  "hyperliquid": "latest",
  "@layerzerolabs/hyperliquid-composer": "latest"
}
```

## Development Commands

### Setup
```bash
npm init -y
npm install ethers express hyperliquid @layerzerolabs/hyperliquid-composer
npm install --save-dev hardhat @nomicfoundation/hardhat-ethers
```

### Deploy Contracts
```bash
# Deploy to Ethereum (Sepolia/Mainnet)
npx hardhat run scripts/deploy-ethereum.js --network sepolia

# Deploy to HyperLiquid (requires block size management)
npx @layerzerolabs/hyperliquid-composer set-block --size big --network mainnet --private-key $PRIVATE_KEY
npx hardhat run scripts/deploy-hyperliquid.js --network hyperevm_mainnet
npx @layerzerolabs/hyperliquid-composer set-block --size small --network mainnet --private-key $PRIVATE_KEY
```

### Testing
```bash
npm test
npx hardhat test
```

## Critical Implementation Notes

### Shared EOA Economics
- **Initial Liquidity**: Manually pre-funded for MVP/demo
- **Post-MVP**: Smart contract collects staked HyperFlash tokens from liquidity providers
- **Liquidity Optimization**: Algorithm uses trading history to optimize asset allocation (ETH, HYPE, etc.)
- **Revenue**: Liquidity providers earn through builder codes (post-MVP)

### Trading Execution Flow (MVP)
1. User deploys staking contract via factory on HyperLiquid
2. Contract locks user funds and delegates stake to validator
3. User submits trade through SDK with parameters:
   - Source token (e.g., USDC on Base)
   - Quantity
   - Trade pair on HyperLiquid (e.g., USDC/BTC)
   - Trade requirements (stop loss, entry price, etc.)
4. SDK communicates with DeBridge to initialize bridging
5. Shared EOA immediately executes trade on HyperLiquid
6. DeBridge processes actual bridge (2 seconds in background)
7. Bridged funds arrive in shared EOA
8. Trade settlement returns funds to user (tracked by unique ID)
9. If malicious behavior detected, staking contract slashes user's stake

## Resources
- **HyperLiquid Docs**: Context/Hyperliquid and HyperEVM Complete Developer Guide.pdf
- **Python SDK**: https://github.com/hyperliquid-dex/hyperliquid-python-sdk
- **Block Explorer**: https://hypurrscan.io/

## DeBridge Integration

### Core Components
- **DeBridgeGate**: Main contract at 0x43dE2d77BF8027e25dBD179B491e8d64f38398aA (all EVM chains)
- **Transaction Flow**: send() → validator signatures → claim() on destination
- **HyperLiquid Chain ID**: 999 (mainnet), 998 (testnet)

### SDK Integration
```javascript
// DeBridge SDK setup
const message = new evm.Message({
    tokenAddress: params.token,
    amount: params.amount,
    chainIdTo: "999", // HyperLiquid
    receiver: params.receiver,
    autoParams: new evm.SendAutoParams({
        executionFee: params.executionFee || "0",
        fallbackAddress: params.receiver,
        flags: new evm.Flags(),
        data: params.callData || "0x"
    })
});
```

### Key Features
- Sub-second finality with HyperBFT consensus
- 200,000 orders/second processing capability
- 2/3 validator consensus requirement
- Signatures stored on Arweave

## IMPORTANT REMINDERS
- Account must be activated on HyperCore with $1+ USDC before deployment
- Always switch to big blocks for deployment, then back to small
- Use precompiled contracts for reading HyperCore data
- Gas fees are burned on HyperEVM (deflationary model)
- Never attempt to bridge funds back - one-way flow only

## CONFIRMED IMPLEMENTATION DECISIONS

### 1. Trading Authorization - API Wallets
- **Solution**: Use HyperLiquid's API wallet (agent wallet) system
- Master account (user) approves our protocol's API wallet
- API wallet can execute trades on behalf of user without holding funds
- API wallets have limited scope - only trading, no transfers
- Each user gets a unique API wallet approval

### 2. Proof System
- **Signature-based verification** (not Merkle proofs)
- Relayer signs lock events from Ethereum
- Simple and fast for MVP

### 3. Liquidity & Demo
- **Using TESTNET** for everything
- No specific amount limits - testnet funds available
- Focus on demonstrating SPEED (Option B)

### 4. Relayer Architecture  
- **Fully centralized** for MVP
- Simple Node.js service monitoring events
- No decentralization complexity for hackathon

### 5. Demo Focus
- **Primary Goal**: Show SPEED - rapid-fire trades with sub-second execution
- Multiple quick trades to demonstrate latency advantage
- Visual emphasis on time savings vs traditional bridges

### 6. SDK Interface
- **More control** option - step by step:
```javascript
await hyperflash.lock(1000, 'USDC', 'ethereum');
await hyperflash.waitForConfirmation();
await hyperflash.executeTrade('BTC/USDC', 'buy', 0.01);
```

### 7. Narrative
- "Locking is just for the demo to ensure speed"
- Future versions will have automatic rebalancing via async bridging
- This is about instant liquidity access, not permanent lock

### 8. Implementation Approach
- **REAL BUILD** - No mock code unless explicitly approved
- Everything must actually work end-to-end
- Ask before making any architectural decisions

## FINALIZED TECHNICAL DECISIONS

### Network Configuration
- **Origin Chain**: Base Sepolia (not Ethereum Sepolia)
- **Destination Chain**: HyperLiquid Testnet
- **USDC on Base Sepolia**: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
- **HyperLiquid Testnet RPC**: `https://rpc.hyperliquid-testnet.xyz/evm`

### Test Wallet (Public - No Real Funds)
```
Address: 0xF5AD9A14152ee5c12d17d9C1e99fe8193F27Eb8F
Private Key: 3d6f146e428a9e046ece85ea3442016f2d05b4971075fb27d64ec63888187ec0
```

### API Wallet Strategy
- **One-time approval** per user at the beginning (if possible with cryptographic proofs)
- Approval happens through smart contracts
- Each user gets their own dedicated API wallet
- No private key storage in relayer

### Trading Parameters
- **Order Type**: Limit orders (clear price setting)
- **Trade Size**: Variable
- **Direction**: Buy only for MVP
- **Demo**: Single trade showing full latency from wallet to execution

### Signature Flow
- **USER signs the lock message** (not relayer)
- Signature proves user authorized the lock
- HyperLiquid contract verifies user's signature

### Tech Stack
- **Smart Contracts**: Hardhat (required for DeBridge compatibility)
- **Backend**: TypeScript (better compatibility)
- **SDK**: Python (using HyperLiquid official SDK)
- **Demo**: CLI (UI post-MVP)
- **NO .env FILES** - Hardcode non-sensitive config

### Demo Metrics
- Show exact latency numbers
- Time from funds in wallet → trade execution
- Compare to traditional bridge times

### Error Handling
**Post-MVP** (document but don't implement now):
- Lock success but release failure recovery
- Trade execution failure handling
- Relayer downtime recovery
- Replay attack prevention
- Nonce management for idempotency

### Project Structure
```
HyperFlash/
├── contracts/           # Hardhat smart contracts
│   ├── Factory.sol     # Deploys user staking contracts
│   ├── UserStaking.sol # Locks funds, delegates stake, handles slashing
│   └── SharedEOA.sol   # Manages trade execution (if needed)
├── scripts/            # Deployment scripts
├── backend/
│   ├── relayer/        # TypeScript - monitors DeBridge events
│   └── trading/        # Manages shared EOA trades
├── sdk/                # Python SDK using HyperLiquid SDK
└── demo/               # CLI demo showing speed advantage
```