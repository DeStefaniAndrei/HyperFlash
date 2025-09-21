# Shared EOA Security Mechanism Design

## Overview
The shared EOA (Externally Owned Account) is critical to our cross-chain HFT infrastructure as it provides immediate liquidity while DeBridge processes the actual fund transfer (2 seconds). This document outlines the security mechanism to protect against malicious actors.

## Core Security Components

### 1. Staking-Based Collateral System

#### User Staking Contract
```solidity
contract UserStakingContract {
    address public user;
    uint256 public stakedAmount;
    address public validator;
    uint256 public slashableUntil;
    
    // Minimum stake requirement (e.g., 110% of max trade value)
    uint256 public constant MIN_STAKE_RATIO = 11000; // 110% in basis points
    uint256 public constant BASIS_POINTS = 10000;
    
    // Stake to HyperLiquid validator
    function stakeToValidator(address _validator, uint256 _amount) external {
        // Delegate stake to validator using CoreWriter
        ICoreWriter(CORE_WRITER).delegateStake(_validator, _amount);
        stakedAmount = _amount;
        validator = _validator;
        slashableUntil = block.timestamp + 7 days; // Slashable period
    }
    
    // Check if stake covers requested trade amount
    function canTrade(uint256 tradeAmount) external view returns (bool) {
        uint256 requiredStake = (tradeAmount * MIN_STAKE_RATIO) / BASIS_POINTS;
        return stakedAmount >= requiredStake && block.timestamp < slashableUntil;
    }
}
```

### 2. Trade Authorization Flow

#### Step-by-Step Security Process
1. **Pre-Trade Verification**
   - Verify user has deployed staking contract via factory
   - Check stake amount covers trade value (110% collateral)
   - Verify stake is delegated to active validator
   - Confirm stake is within slashable period

2. **Trade Execution**
   - SDK generates trade request with unique ID
   - Request includes: user, amount, timestamp, signature
   - Shared EOA executes trade immediately
   - Trade details logged for reconciliation

3. **Bridge Monitoring**
   - Monitor DeBridge transaction status
   - Expected completion: 2 seconds
   - Track submission ID for matching

4. **Reconciliation**
   - When bridge completes, funds arrive in shared EOA
   - Match bridge completion with trade execution
   - Update user's available credit

### 3. Slashing Mechanism

#### Slashing Conditions
```javascript
// Monitor for slashing conditions
const slashingConditions = {
    BRIDGE_FAILURE: "Bridge transaction failed after trade execution",
    TIMEOUT: "Bridge not completed within 60 seconds",
    INSUFFICIENT_FUNDS: "Bridge amount less than trade amount",
    DOUBLE_SPEND: "Multiple trades on same bridge commitment"
};

// Slashing execution
async function executeSlashing(user, reason, amount) {
    // 1. Mark user's staking contract as slashed
    await stakingContract.slash(reason);
    
    // 2. Transfer slashed funds to shared EOA
    await validator.transferSlashedFunds(sharedEOA, amount);
    
    // 3. Ban user from system
    await blacklist.add(user);
    
    // 4. Log incident for audit
    await auditLog.record({user, reason, amount, timestamp});
}
```

### 4. Risk Mitigation Strategies

#### A. Rate Limiting
```javascript
const rateLimits = {
    perUser: {
        maxTradesPerMinute: 10,
        maxVolumePerHour: 100000, // USDC
        cooldownAfterLimit: 300 // seconds
    },
    global: {
        maxConcurrentTrades: 50,
        maxTotalExposure: 1000000 // USDC
    }
};
```

#### B. Position Tracking
```javascript
class PositionTracker {
    constructor() {
        this.activePositions = new Map(); // user -> {amount, bridgeId, timestamp}
        this.pendingBridges = new Map();  // bridgeId -> {user, amount, status}
    }
    
    async openPosition(user, amount, bridgeId) {
        // Check user doesn't have pending position
        if (this.activePositions.has(user)) {
            throw new Error("User has pending position");
        }
        
        // Record new position
        this.activePositions.set(user, {
            amount,
            bridgeId,
            timestamp: Date.now(),
            status: 'PENDING_BRIDGE'
        });
    }
    
    async closePosition(bridgeId) {
        // Find and close position when bridge completes
        const position = this.pendingBridges.get(bridgeId);
        if (position) {
            this.activePositions.delete(position.user);
            this.pendingBridges.delete(bridgeId);
        }
    }
}
```

#### C. Emergency Pause
```solidity
contract EmergencyPause {
    bool public paused = false;
    address public guardian;
    
    modifier whenNotPaused() {
        require(!paused, "System paused");
        _;
    }
    
    function pause() external onlyGuardian {
        paused = true;
        emit SystemPaused(block.timestamp);
    }
    
    function unpause() external onlyGuardian {
        paused = false;
        emit SystemUnpaused(block.timestamp);
    }
}
```

### 5. Monitoring & Alerting

#### Real-time Monitoring
```javascript
class SecurityMonitor {
    constructor() {
        this.alerts = [];
        this.thresholds = {
            pendingBridgeTimeout: 60, // seconds
            maxPendingExposure: 500000, // USDC
            unusualVolumeSpike: 10, // 10x normal
            failureRate: 0.05 // 5% failure threshold
        };
    }
    
    async checkHealth() {
        const checks = [
            this.checkPendingBridges(),
            this.checkExposure(),
            this.checkVolumeAnomaly(),
            this.checkFailureRate()
        ];
        
        const issues = await Promise.all(checks);
        
        if (issues.some(i => i.critical)) {
            await this.triggerEmergencyPause();
        }
    }
    
    async triggerAlert(type, severity, details) {
        // Send to monitoring system
        await alerting.send({
            type,
            severity, // LOW, MEDIUM, HIGH, CRITICAL
            details,
            timestamp: Date.now(),
            action: this.getRecommendedAction(type, severity)
        });
    }
}
```

### 6. Audit Trail

#### Comprehensive Logging
```javascript
const auditLog = {
    // Log every significant event
    events: [
        'STAKE_CREATED',
        'TRADE_REQUESTED',
        'TRADE_EXECUTED',
        'BRIDGE_INITIATED',
        'BRIDGE_COMPLETED',
        'BRIDGE_FAILED',
        'SLASH_EXECUTED',
        'EMERGENCY_PAUSE'
    ],
    
    // Required fields for each log
    logStructure: {
        eventType: String,
        user: Address,
        amount: Number,
        timestamp: Number,
        blockNumber: Number,
        txHash: String,
        metadata: Object
    }
};
```

## Implementation Priorities

### Phase 1 (MVP - Hackathon)
1. ✅ Basic staking contract with 110% collateral requirement
2. ✅ Simple position tracking (one trade per user at a time)
3. ✅ Basic slashing for bridge failure
4. ✅ Emergency pause mechanism

### Phase 2 (Post-MVP)
1. ⏳ Advanced rate limiting
2. ⏳ Multi-validator staking
3. ⏳ Partial slashing based on severity
4. ⏳ Automated recovery mechanisms

### Phase 3 (Production)
1. ⏳ Decentralized guardian system
2. ⏳ Insurance fund from slashing penalties
3. ⏳ Reputation system for traders
4. ⏳ Cross-chain position netting

## Security Assumptions

1. **Validator Trust**: Assume HyperLiquid validators are honest
2. **Bridge Reliability**: DeBridge has 99.9% uptime
3. **Slashing Enforcement**: Validators will enforce slashing
4. **Time Bounds**: 60-second max for bridge completion

## Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|------------|---------|------------|
| Bridge Failure | Low | High | Slashing mechanism |
| Double Spend | Very Low | Critical | Position tracking |
| Validator Collusion | Very Low | Critical | Multi-validator requirement |
| System Overload | Medium | Medium | Rate limiting |
| Smart Contract Bug | Low | Critical | Audits + bug bounty |

## Testing Requirements

1. **Unit Tests**
   - Staking contract deployment
   - Slashing execution
   - Position tracking
   - Rate limiting

2. **Integration Tests**
   - Full trade flow with bridge
   - Failure scenarios
   - Recovery mechanisms

3. **Stress Tests**
   - High volume trading
   - Multiple concurrent users
   - Bridge delays/failures

## Conclusion

This security mechanism provides multiple layers of protection:
- **Economic Security**: 110% collateral requirement
- **Technical Security**: Position tracking and rate limiting
- **Operational Security**: Monitoring and emergency pause
- **Recovery Security**: Slashing and audit trails

The system is designed to be simple for MVP while allowing for progressive enhancement as we move toward production.