// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title FactoryOptimized
 * @notice Optimized Factory for HyperLiquid deployment (fits in 2M gas limit)
 * @dev Minimal implementation for testnet deployment
 */
contract FactoryOptimized {
    // State variables
    address public backendAddress;
    address public sharedEOA;
    mapping(address => address) public userStakingContracts;
    address[] public deployedContracts;

    // Events
    event StakingContractDeployed(address indexed user, address stakingContract);

    constructor(address _backend) {
        require(_backend != address(0), "Invalid backend");
        backendAddress = _backend;
        sharedEOA = _backend; // Same as backend for MVP
    }

    /**
     * Deploy minimal staking contract for user
     */
    function deployStakingContract() external returns (address) {
        require(userStakingContracts[msg.sender] == address(0), "Already deployed");

        // Deploy minimal staking contract
        MinimalStaking staking = new MinimalStaking(msg.sender, backendAddress);
        userStakingContracts[msg.sender] = address(staking);
        deployedContracts.push(address(staking));

        emit StakingContractDeployed(msg.sender, address(staking));
        return address(staking);
    }

    function hasStakingContract(address user) external view returns (bool) {
        return userStakingContracts[user] != address(0);
    }

    function getUserStakingContract(address user) external view returns (address) {
        return userStakingContracts[user];
    }

    // Getter methods for backend compatibility
    function backend() external view returns (address) {
        return backendAddress;
    }

    function getTotalContracts() external view returns (uint256) {
        return deployedContracts.length;
    }
}

/**
 * @title MinimalStaking
 * @notice Minimal staking contract for gas optimization
 */
contract MinimalStaking {
    address public immutable user;
    address public immutable backend;
    uint256 public stakedAmount;
    bool public isSlashed;
    mapping(string => bool) public activeTrades;

    event Staked(uint256 amount);
    event Slashed(uint256 amount);
    event TradeRegistered(string tradeId);
    event TradeCompleted(string tradeId);
    event FundsSlashed(string reason, uint256 amount);

    modifier onlyUser() {
        require(msg.sender == user, "Only user");
        _;
    }

    modifier onlyBackend() {
        require(msg.sender == backend, "Only backend");
        _;
    }

    constructor(address _user, address _backend) {
        user = _user;
        backend = _backend;
    }

    function depositAndStake() external payable onlyUser {
        require(!isSlashed, "Slashed");
        require(msg.value > 0, "No value");
        stakedAmount += msg.value;
        emit Staked(msg.value);
    }

    function slash() external onlyBackend {
        require(stakedAmount > 0, "No stake");
        isSlashed = true;
        uint256 amount = stakedAmount;
        stakedAmount = 0;
        payable(backend).transfer(amount);
        emit Slashed(amount);
    }

    function getStatus() external view returns (uint256, bool) {
        return (stakedAmount, !isSlashed);
    }

    // Trade management functions
    function registerTrade(string memory tradeId) external onlyBackend {
        require(!isSlashed, "Slashed");
        require(!activeTrades[tradeId], "Trade exists");
        activeTrades[tradeId] = true;
        emit TradeRegistered(tradeId);
    }

    function completeTrade(string memory tradeId) external onlyBackend {
        require(activeTrades[tradeId], "Trade not found");
        activeTrades[tradeId] = false;
        emit TradeCompleted(tradeId);
    }

    function hasSufficientStake(uint256 amount) external view returns (bool) {
        return stakedAmount >= amount && !isSlashed;
    }

    function slashWithReason(string memory reason) external onlyBackend {
        require(stakedAmount > 0, "No stake");
        isSlashed = true;
        uint256 amount = stakedAmount;
        stakedAmount = 0;
        payable(backend).transfer(amount);
        emit FundsSlashed(reason, amount);
    }
}