"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isActiveDiscount = exports.isMintBridge = exports.isSendBridge = exports.BridgeState = exports.isSupportedChainInfoType = exports.isExtCallMetaFailed = exports.isExtCallMetaExecuted = exports.isExtCallMetaExecution = exports.isExtCallMetaAccumulation = exports.ProtocolStatusEnum = exports.FixedFeeType = exports.WalletCheckEnum = exports.AccountType = void 0;
var AccountType;
(function (AccountType) {
    AccountType[AccountType["System"] = 0] = "System";
    AccountType[AccountType["Token"] = 1] = "Token";
    AccountType[AccountType["CorrectATA"] = 2] = "CorrectATA";
    AccountType[AccountType["Unknown"] = 3] = "Unknown";
    AccountType[AccountType["NotExists"] = 4] = "NotExists";
})(AccountType = exports.AccountType || (exports.AccountType = {}));
var WalletCheckEnum;
(function (WalletCheckEnum) {
    WalletCheckEnum[WalletCheckEnum["AllowUninitialized"] = 0] = "AllowUninitialized";
    WalletCheckEnum[WalletCheckEnum["Create"] = 1] = "Create";
    WalletCheckEnum[WalletCheckEnum["ThrowError"] = 2] = "ThrowError";
})(WalletCheckEnum = exports.WalletCheckEnum || (exports.WalletCheckEnum = {}));
var FixedFeeType;
(function (FixedFeeType) {
    FixedFeeType[FixedFeeType["ASSET"] = 0] = "ASSET";
    FixedFeeType[FixedFeeType["NATIVE"] = 1] = "NATIVE";
})(FixedFeeType = exports.FixedFeeType || (exports.FixedFeeType = {}));
var ProtocolStatusEnum;
(function (ProtocolStatusEnum) {
    ProtocolStatusEnum[ProtocolStatusEnum["WORKING"] = 0] = "WORKING";
    ProtocolStatusEnum[ProtocolStatusEnum["PAUSED"] = 1] = "PAUSED";
})(ProtocolStatusEnum = exports.ProtocolStatusEnum || (exports.ProtocolStatusEnum = {}));
function isExtCallMetaAccumulation(arg) {
    return arg !== undefined && arg !== null && "accumulation" in arg;
}
exports.isExtCallMetaAccumulation = isExtCallMetaAccumulation;
function isExtCallMetaExecution(arg) {
    return arg !== undefined && arg !== null && "execution" in arg;
}
exports.isExtCallMetaExecution = isExtCallMetaExecution;
function isExtCallMetaExecuted(arg) {
    return arg !== undefined && arg !== null && "executed" in arg;
}
exports.isExtCallMetaExecuted = isExtCallMetaExecuted;
function isExtCallMetaFailed(arg) {
    return arg !== undefined && arg !== null && "failed" in arg;
}
exports.isExtCallMetaFailed = isExtCallMetaFailed;
function isSupportedChainInfoType(arg) {
    return arg !== null && arg !== undefined && "supported" in arg;
}
exports.isSupportedChainInfoType = isSupportedChainInfoType;
var BridgeState;
(function (BridgeState) {
    BridgeState[BridgeState["WORK"] = 0] = "WORK";
    BridgeState[BridgeState["PAUSE"] = 1] = "PAUSE";
})(BridgeState = exports.BridgeState || (exports.BridgeState = {}));
function isSendBridge(arg) {
    return "send" in arg;
}
exports.isSendBridge = isSendBridge;
function isMintBridge(arg) {
    return "mint" in arg;
}
exports.isMintBridge = isMintBridge;
function isActiveDiscount(arg) {
    return "active" in arg;
}
exports.isActiveDiscount = isActiveDiscount;
//# sourceMappingURL=interfaces.js.map