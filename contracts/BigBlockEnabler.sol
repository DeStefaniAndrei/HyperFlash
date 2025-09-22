// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title BigBlockEnabler
 * @notice Enables big blocks for HyperLiquid contract deployment
 * @dev Uses the CoreWriter system contract to send evmUserModify action to HyperCore
 */

// Interface for the CoreWriter system contract
interface ICoreWriter {
    function sendRawAction(bytes calldata data) external;
}

contract BigBlockEnabler {
    // CoreWriter system contract address on HyperLiquid
    ICoreWriter constant CORE_WRITER = ICoreWriter(0x3333333333333333333333333333333333333333);

    // Action IDs (need to find the correct one for evmUserModify)
    bytes1 constant VERSION = 0x01;

    // Events
    event BigBlocksEnabled(address indexed user);
    event BigBlocksDisabled(address indexed user);
    event ActionSent(bytes data);

    /**
     * @notice Enable big blocks for the calling address
     * @dev Sends evmUserModify action with usingBigBlocks = true
     */
    function enableBigBlocks() external {
        bytes memory actionData = _encodeEvmUserModify(true);

        // Send the action to HyperCore
        CORE_WRITER.sendRawAction(actionData);

        emit BigBlocksEnabled(msg.sender);
        emit ActionSent(actionData);
    }

    /**
     * @notice Disable big blocks (switch back to small blocks)
     * @dev Sends evmUserModify action with usingBigBlocks = false
     */
    function disableBigBlocks() external {
        bytes memory actionData = _encodeEvmUserModify(false);

        // Send the action to HyperCore
        CORE_WRITER.sendRawAction(actionData);

        emit BigBlocksDisabled(msg.sender);
        emit ActionSent(actionData);
    }

    /**
     * @dev Encode the evmUserModify action
     * Format: [version(1 byte)][actionId(3 bytes)][actionData(variable)]
     */
    function _encodeEvmUserModify(bool usingBigBlocks) internal pure returns (bytes memory) {
        // We need to find the correct action ID for evmUserModify
        // This is a placeholder - actual ID needs to be determined from HyperLiquid docs
        bytes3 actionId = 0x000020; // Placeholder action ID

        // Encode the action data
        // evmUserModify expects: {"type": "evmUserModify", "usingBigBlocks": bool}
        bytes memory actionSpecificData = abi.encode(usingBigBlocks);

        // Construct the full action
        bytes memory fullAction = new bytes(4 + actionSpecificData.length);
        fullAction[0] = VERSION;
        fullAction[1] = actionId[0];
        fullAction[2] = actionId[1];
        fullAction[3] = actionId[2];

        // Copy action-specific data
        for (uint256 i = 0; i < actionSpecificData.length; i++) {
            fullAction[4 + i] = actionSpecificData[i];
        }

        return fullAction;
    }

    /**
     * @notice Helper to check if an address is a Core user
     * @dev In practice, check if the address has received USDC or other Core assets
     */
    function isCoreUser(address user) external view returns (bool) {
        // This would need to interact with HyperCore precompiles
        // For now, return true for testing
        return true;
    }
}