export var AccountType;
(function (AccountType) {
    AccountType[AccountType["System"] = 0] = "System";
    AccountType[AccountType["Token"] = 1] = "Token";
    AccountType[AccountType["CorrectATA"] = 2] = "CorrectATA";
    AccountType[AccountType["Unknown"] = 3] = "Unknown";
    AccountType[AccountType["NotExists"] = 4] = "NotExists";
})(AccountType || (AccountType = {}));
export var WalletCheckEnum;
(function (WalletCheckEnum) {
    WalletCheckEnum[WalletCheckEnum["AllowUninitialized"] = 0] = "AllowUninitialized";
    WalletCheckEnum[WalletCheckEnum["Create"] = 1] = "Create";
    WalletCheckEnum[WalletCheckEnum["ThrowError"] = 2] = "ThrowError";
})(WalletCheckEnum || (WalletCheckEnum = {}));
export var FixedFeeType;
(function (FixedFeeType) {
    FixedFeeType[FixedFeeType["ASSET"] = 0] = "ASSET";
    FixedFeeType[FixedFeeType["NATIVE"] = 1] = "NATIVE";
})(FixedFeeType || (FixedFeeType = {}));
export var ProtocolStatusEnum;
(function (ProtocolStatusEnum) {
    ProtocolStatusEnum[ProtocolStatusEnum["WORKING"] = 0] = "WORKING";
    ProtocolStatusEnum[ProtocolStatusEnum["PAUSED"] = 1] = "PAUSED";
})(ProtocolStatusEnum || (ProtocolStatusEnum = {}));
export function isExtCallMetaAccumulation(arg) {
    return arg !== undefined && arg !== null && "accumulation" in arg;
}
export function isExtCallMetaExecution(arg) {
    return arg !== undefined && arg !== null && "execution" in arg;
}
export function isExtCallMetaExecuted(arg) {
    return arg !== undefined && arg !== null && "executed" in arg;
}
export function isExtCallMetaFailed(arg) {
    return arg !== undefined && arg !== null && "failed" in arg;
}
export function isSupportedChainInfoType(arg) {
    return arg !== null && arg !== undefined && "supported" in arg;
}
export var BridgeState;
(function (BridgeState) {
    BridgeState[BridgeState["WORK"] = 0] = "WORK";
    BridgeState[BridgeState["PAUSE"] = 1] = "PAUSE";
})(BridgeState || (BridgeState = {}));
export function isSendBridge(arg) {
    return "send" in arg;
}
export function isMintBridge(arg) {
    return "mint" in arg;
}
export function isActiveDiscount(arg) {
    return "active" in arg;
}
//# sourceMappingURL=interfaces.js.map