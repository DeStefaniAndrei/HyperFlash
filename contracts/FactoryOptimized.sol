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
    mapping(address => address) public userStakingContracts;

    // Events
    event StakingContractDeployed(address indexed user, address stakingContract);

    constructor(address _backend) {
        require(_backend != address(0), "Invalid backend");
        backendAddress = _backend;
    }

    /**
     * Deploy minimal staking contract for user
     */
    function deployStakingContract() external returns (address) {
        require(userStakingContracts[msg.sender] == address(0), "Already deployed");

        // Deploy minimal staking contract
        MinimalStaking staking = new MinimalStaking(msg.sender, backendAddress);
        userStakingContracts[msg.sender] = address(staking);

        emit StakingContractDeployed(msg.sender, address(staking));
        return address(staking);
    }

    function hasStakingContract(address user) external view returns (bool) {
        return userStakingContracts[user] != address(0);
    }

    function getUserStakingContract(address user) external view returns (address) {
        return userStakingContracts[user];
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

    event Staked(uint256 amount);
    event Slashed(uint256 amount);

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
}