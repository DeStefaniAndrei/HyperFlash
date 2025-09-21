// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./UserStaking.sol";

/**
 * @title Factory
 * @dev Factory contract that deploys personal staking contracts for users
 * Each user gets their own staking contract to manage funds and delegation
 */
contract Factory {
    // Mapping from user address to their staking contract
    mapping(address => address) public userStakingContracts;

    // Array to track all deployed staking contracts
    address[] public deployedContracts;

    // Backend service address that can trigger slashing
    address public backend;

    // Shared EOA that executes trades
    address public sharedEOA;

    // Events
    event StakingContractDeployed(address indexed user, address indexed stakingContract);
    event BackendUpdated(address indexed newBackend);
    event SharedEOAUpdated(address indexed newSharedEOA);

    constructor(address _backend, address _sharedEOA) {
        require(_backend != address(0), "Invalid backend address");
        require(_sharedEOA != address(0), "Invalid shared EOA address");
        backend = _backend;
        sharedEOA = _sharedEOA;
    }

    /**
     * @dev Deploy a new staking contract for a user
     * @param _validator The HyperLiquid validator to delegate stake to
     * @return The address of the newly deployed staking contract
     */
    function deployStakingContract(address _validator) external returns (address) {
        // Check if user already has a staking contract
        require(userStakingContracts[msg.sender] == address(0), "User already has staking contract");
        require(_validator != address(0), "Invalid validator address");

        // Deploy new UserStaking contract
        // User becomes the owner of their staking contract
        UserStaking newContract = new UserStaking(
            msg.sender,  // user who will own the staking contract
            _validator,  // validator to delegate to
            backend,     // backend service for slashing
            sharedEOA    // shared EOA for trade execution
        );

        // Store the contract address
        userStakingContracts[msg.sender] = address(newContract);
        deployedContracts.push(address(newContract));

        emit StakingContractDeployed(msg.sender, address(newContract));

        return address(newContract);
    }

    /**
     * @dev Get user's staking contract address
     * @param _user The user address
     * @return The staking contract address (or zero address if not deployed)
     */
    function getUserStakingContract(address _user) external view returns (address) {
        return userStakingContracts[_user];
    }

    /**
     * @dev Check if user has a staking contract
     * @param _user The user address
     * @return True if user has deployed a staking contract
     */
    function hasStakingContract(address _user) external view returns (bool) {
        return userStakingContracts[_user] != address(0);
    }

    /**
     * @dev Get total number of deployed contracts
     * @return The number of deployed staking contracts
     */
    function getTotalContracts() external view returns (uint256) {
        return deployedContracts.length;
    }

    /**
     * @dev Update backend service address (only current backend can do this)
     * @param _newBackend The new backend address
     */
    function updateBackend(address _newBackend) external {
        require(msg.sender == backend, "Only backend can update");
        require(_newBackend != address(0), "Invalid backend address");
        backend = _newBackend;
        emit BackendUpdated(_newBackend);
    }

    /**
     * @dev Update shared EOA address (only backend can do this)
     * @param _newSharedEOA The new shared EOA address
     */
    function updateSharedEOA(address _newSharedEOA) external {
        require(msg.sender == backend, "Only backend can update");
        require(_newSharedEOA != address(0), "Invalid shared EOA address");
        sharedEOA = _newSharedEOA;
        emit SharedEOAUpdated(_newSharedEOA);
    }
}