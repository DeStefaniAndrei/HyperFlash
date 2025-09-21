"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXT_CALL_STORAGE_OFFSET = exports.SEND_TO_ATA = exports.SEND_HASHED_DATA = exports.PROXY_WITH_SENDER = exports.REVERT_IF_EXTERNAL_FAIL = exports.UNWRAP_ETH = exports.BRIDGE_PAUSED = exports.BRIDGE_WORKING = exports.REQUIRED_ORACLES_MAX_SIZE = exports.ORACLES_MAX_SIZE = exports.ORACLE_ADDRESS_LENGTH = exports.DISCOUNT_INFO_INITIALIZED_EVENT = exports.BRIDGE_FEE_INFO_INITIALIZED_EVENT = exports.SUPPORT_CHAIN_INFO_INITIALIZED_EVENT = exports.BRIDGE_WORK_TOGGLED_EVENT = exports.BRIDGE_MIN_RESERVED_BPS_SETTED_EVENT = exports.BRIDGE_MAX_AMOUNT_SETTED_EVENT = exports.TRANSFERRED_EVENT = exports.BRIDGED_EVENT = exports.SEND_BRIDGE_CREATED_EVENT = exports.MINT_BRIDGE_CREATED_EVENT = exports.ORACLE_REMOVED_EVENT = exports.ORACLE_ADDED_EVENT = exports.LOG_EVENT = exports.STATE_UPDATED_EVENT = exports.STATE_INITIALIZED_EVENT = exports.SETTINGS_PROGRAM_NAME = exports.PROGRAM_NAME = void 0;
exports.PROGRAM_NAME = "DebridgeProgram";
exports.SETTINGS_PROGRAM_NAME = "DebridgeSettingsProgram";
// ********** Events **********
exports.STATE_INITIALIZED_EVENT = "StateInitialized";
exports.STATE_UPDATED_EVENT = "StateUpdated";
exports.LOG_EVENT = "Log";
exports.ORACLE_ADDED_EVENT = "OracleAdded";
exports.ORACLE_REMOVED_EVENT = "OracleRemoved";
exports.MINT_BRIDGE_CREATED_EVENT = "MintBridgeCreated";
exports.SEND_BRIDGE_CREATED_EVENT = "SendBridgeCreated";
exports.BRIDGED_EVENT = "Bridged";
exports.TRANSFERRED_EVENT = "Transferred";
exports.BRIDGE_MAX_AMOUNT_SETTED_EVENT = "BridgeMaxAmountSetted";
exports.BRIDGE_MIN_RESERVED_BPS_SETTED_EVENT = "BridgeMinReservedBpsSetted";
exports.BRIDGE_WORK_TOGGLED_EVENT = "BridgeWorkToggled";
exports.SUPPORT_CHAIN_INFO_INITIALIZED_EVENT = "SupportChainInfoInitialized";
exports.BRIDGE_FEE_INFO_INITIALIZED_EVENT = "BridgeFeeInfoInitialized";
exports.DISCOUNT_INFO_INITIALIZED_EVENT = "DiscountInitialized";
// ********** Other **********
exports.ORACLE_ADDRESS_LENGTH = 20;
exports.ORACLES_MAX_SIZE = 20;
exports.REQUIRED_ORACLES_MAX_SIZE = 10;
exports.BRIDGE_WORKING = 0;
exports.BRIDGE_PAUSED = 1;
exports.UNWRAP_ETH = 1;
exports.REVERT_IF_EXTERNAL_FAIL = 2;
exports.PROXY_WITH_SENDER = 4;
exports.SEND_HASHED_DATA = 8;
exports.SEND_TO_ATA = 2 ** 31;
exports.EXT_CALL_STORAGE_OFFSET = 8;
//# sourceMappingURL=constants.js.map