// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ICoreWriter
 * @dev Interface for HyperLiquid CoreWriter precompile at 0x3333333333333333333333333333333333333333
 * Used for interacting with HyperCore from HyperEVM
 */
interface ICoreWriter {
    function delegateStake(address validator, uint256 amount) external;
    function undelegateStake(address validator, uint256 amount) external;
}

/**
 * @title UserStaking
 * @dev Personal staking contract for each user
 * Locks funds, delegates stake to validators, and handles slashing
 */
contract UserStaking {
    // HyperLiquid CoreWriter precompile address
    address constant CORE_WRITER = 0x3333333333333333333333333333333333333333;

    // Contract state
    address public user;              // User who owns this staking contract
    address public validator;         // HyperLiquid validator to delegate to
    address public backend;           // Backend service that can trigger slashing
    address public sharedEOA;         // Shared EOA that executes trades
    address public factory;           // Factory that deployed this contract

    uint256 public stakedAmount;     // Total amount staked
    bool public isSlashed;            // Whether funds have been slashed

    // Trade tracking
    mapping(string => bool) public activeTrades;  // tradeId => isActive

    // Events
    event FundsDeposited(address indexed from, uint256 amount);
    event StakeDelegated(address indexed validator, uint256 amount);
    event StakeUndelegated(address indexed validator, uint256 amount);
    event FundsSlashed(string reason, uint256 amount);
    event FundsWithdrawn(address indexed to, uint256 amount);
    event TradeRegistered(string tradeId);
    event TradeCompleted(string tradeId);

    modifier onlyUser() {
        require(msg.sender == user, "Only user can call");
        _;
    }

    modifier onlyBackend() {
        require(msg.sender == backend, "Only backend can call");
        _;
    }

    modifier notSlashed() {
        require(!isSlashed, "Contract has been slashed");
        _;
    }

    constructor(
        address _user,
        address _validator,
        address _backend,
        address _sharedEOA
    ) {
        require(_user != address(0), "Invalid user");
        require(_validator != address(0), "Invalid validator");
        require(_backend != address(0), "Invalid backend");
        require(_sharedEOA != address(0), "Invalid shared EOA");

        user = _user;
        validator = _validator;
        backend = _backend;
        sharedEOA = _sharedEOA;
        factory = msg.sender;  // Factory is the deployer
    }

    /**
     * @dev Deposit funds and automatically delegate stake
     * User sends funds to this contract which then delegates to validator
     */
    function depositAndStake() external payable onlyUser notSlashed {
        require(msg.value > 0, "Must deposit funds");

        // Update staked amount
        stakedAmount += msg.value;

        // Delegate stake to validator via CoreWriter
        // This gives the contract authority to slash based on its own logic
        ICoreWriter(CORE_WRITER).delegateStake(validator, msg.value);

        emit FundsDeposited(msg.sender, msg.value);
        emit StakeDelegated(validator, msg.value);
    }

    /**
     * @dev Register a new trade (called by backend when trade starts)
     * @param _tradeId Unique identifier for the trade
     */
    function registerTrade(string calldata _tradeId) external onlyBackend notSlashed {
        require(!activeTrades[_tradeId], "Trade already registered");
        activeTrades[_tradeId] = true;
        emit TradeRegistered(_tradeId);
    }

    /**
     * @dev Complete a trade (called by backend when bridge completes successfully)
     * @param _tradeId Unique identifier for the trade
     */
    function completeTrade(string calldata _tradeId) external onlyBackend {
        require(activeTrades[_tradeId], "Trade not found");
        activeTrades[_tradeId] = false;
        emit TradeCompleted(_tradeId);
    }

    /**
     * @dev Slash funds due to malicious behavior
     * Called when bridge fails but trade was executed
     * @param _reason Reason for slashing
     */
    function slash(string calldata _reason) external onlyBackend notSlashed {
        require(stakedAmount > 0, "No funds to slash");

        isSlashed = true;

        // Transfer slashed funds to shared EOA
        // This compensates the shared EOA for the failed bridge
        (bool success, ) = sharedEOA.call{value: stakedAmount}("");
        require(success, "Slash transfer failed");

        emit FundsSlashed(_reason, stakedAmount);

        // Note: In production, we would also undelegate from validator
        // But keeping it simple for MVP
    }

    /**
     * @dev Withdraw funds (only if not slashed and no active trades)
     * In MVP, simplified withdrawal without unbonding period
     */
    function withdraw() external onlyUser notSlashed {
        require(stakedAmount > 0, "No funds to withdraw");

        // Check no active trades (simplified for MVP)
        // In production, would need more sophisticated tracking

        uint256 amount = stakedAmount;
        stakedAmount = 0;

        // Undelegate from validator
        ICoreWriter(CORE_WRITER).undelegateStake(validator, amount);

        // Transfer funds back to user
        (bool success, ) = user.call{value: amount}("");
        require(success, "Withdrawal failed");

        emit StakeUndelegated(validator, amount);
        emit FundsWithdrawn(user, amount);
    }

    /**
     * @dev Check if user has sufficient stake for a trade
     * @param _amount Amount required for the trade
     * @return True if user has sufficient stake
     */
    function hasSufficientStake(uint256 _amount) external view returns (bool) {
        return !isSlashed && stakedAmount >= _amount;
    }

    /**
     * @dev Get staking status
     * @return stakedAmount The amount staked
     * @return isActive Whether the staking is active (not slashed)
     */
    function getStatus() external view returns (uint256, bool) {
        return (stakedAmount, !isSlashed);
    }

    /**
     * @dev Receive function to accept ETH/HYPE
     */
    receive() external payable {
        // Allows contract to receive funds
    }
}