"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructDecodeError = exports.BridgeMalformed = exports.BridgeNotExists = exports.BridgePaused = exports.BridgeError = exports.AlreadyClaimed = exports.NotEnoughTokens = exports.TransactionExecutionError = exports.InsufficientFunds = exports.AssociatedWalletNotInitialized = exports.ExternalCallMetaNotExists = exports.SubmissionInfoNotExists = exports.DiscountNotExists = exports.DiscountNotActive = exports.ConfirmationStorageMalformed = exports.DiscountInfoMalformed = exports.ChainSupportInfoMalformed = exports.BridgeFeeMalformed = exports.AssetFeeNotSupported = exports.BridgeFeeNotInitialized = exports.ChainSupportInfoNotSupported = exports.ChainSupportInfoNotInitialized = exports.BridgeStateMalformed = exports.BridgeStateNotExists = exports.AccountNotInitialized = exports.AccountError = exports.InitError = void 0;
const anchor_1 = require("@coral-xyz/anchor");
class InitError extends Error {
    constructor(idlPath, baseError) {
        super();
        this.idlPath = idlPath;
        this.baseError = baseError;
    }
}
exports.InitError = InitError;
class AccountError extends Error {
    constructor(publicKey) {
        super();
        this.publicKey = publicKey;
    }
}
exports.AccountError = AccountError;
class AccountNotInitialized extends AccountError {
    toString() {
        return `AccountNotInitialized: couldn't find info about ${this.publicKey.toBase58()} in blockchain`;
    }
}
exports.AccountNotInitialized = AccountNotInitialized;
class BridgeStateNotExists extends AccountNotInitialized {
}
exports.BridgeStateNotExists = BridgeStateNotExists;
class BridgeStateMalformed extends AccountError {
}
exports.BridgeStateMalformed = BridgeStateMalformed;
class ChainSupportInfoNotInitialized extends AccountNotInitialized {
}
exports.ChainSupportInfoNotInitialized = ChainSupportInfoNotInitialized;
class ChainSupportInfoNotSupported extends AccountError {
}
exports.ChainSupportInfoNotSupported = ChainSupportInfoNotSupported;
class BridgeFeeNotInitialized extends AccountNotInitialized {
}
exports.BridgeFeeNotInitialized = BridgeFeeNotInitialized;
class AssetFeeNotSupported extends AccountError {
}
exports.AssetFeeNotSupported = AssetFeeNotSupported;
class BridgeFeeMalformed extends AccountError {
}
exports.BridgeFeeMalformed = BridgeFeeMalformed;
class ChainSupportInfoMalformed extends AccountError {
}
exports.ChainSupportInfoMalformed = ChainSupportInfoMalformed;
class DiscountInfoMalformed extends AccountError {
}
exports.DiscountInfoMalformed = DiscountInfoMalformed;
class ConfirmationStorageMalformed extends AccountError {
}
exports.ConfirmationStorageMalformed = ConfirmationStorageMalformed;
class DiscountNotActive extends AccountError {
}
exports.DiscountNotActive = DiscountNotActive;
class DiscountNotExists extends AccountError {
}
exports.DiscountNotExists = DiscountNotExists;
class SubmissionInfoNotExists extends AccountError {
}
exports.SubmissionInfoNotExists = SubmissionInfoNotExists;
class ExternalCallMetaNotExists extends AccountError {
}
exports.ExternalCallMetaNotExists = ExternalCallMetaNotExists;
class AssociatedWalletNotInitialized extends AccountNotInitialized {
    constructor(pk, associatedWallet) {
        super(pk);
        this.associatedWallet = associatedWallet;
    }
}
exports.AssociatedWalletNotInitialized = AssociatedWalletNotInitialized;
class InsufficientFunds extends Error {
    constructor(account, needed, currentBalance) {
        super();
        this.account = account;
        this.neededAmount = new anchor_1.BN(needed);
        this.currentBalance = new anchor_1.BN(currentBalance);
    }
}
exports.InsufficientFunds = InsufficientFunds;
const PROGRAM_LOG_START_MARKER = "Program log: ";
const PROGRAM_LOG_ERROR_MARKER = "Custom program error: ";
function getLogs(logs) {
    return logs.filter((log) => log.startsWith(PROGRAM_LOG_START_MARKER)).map((log) => log.substr(PROGRAM_LOG_START_MARKER.length));
}
function getCustomErrors(logs, idlErrors) {
    const logsWithErrors = logs
        .filter((log) => log.startsWith(PROGRAM_LOG_ERROR_MARKER))
        .map((log) => parseInt(log.substr(PROGRAM_LOG_ERROR_MARKER.length), 16));
    const result = [];
    for (const errorCode of logsWithErrors) {
        const mappedError = idlErrors.find((x) => x.code == errorCode);
        if (mappedError)
            result.push(mappedError);
    }
    return result;
}
class TransactionExecutionError extends Error {
    constructor(logs, idlErrors) {
        super();
        this.programLogs = getLogs(logs);
        this.customErrors = getCustomErrors(this.programLogs, idlErrors);
    }
}
exports.TransactionExecutionError = TransactionExecutionError;
class NotEnoughTokens extends Error {
    constructor(wallet, current, needed) {
        super();
        this.associatedWallet = wallet;
        this.currentAmount = new anchor_1.BN(current);
        this.neededAmount = new anchor_1.BN(needed);
    }
}
exports.NotEnoughTokens = NotEnoughTokens;
class AlreadyClaimed extends Error {
    constructor(submissionId) {
        super();
        this.submissionId = submissionId;
    }
}
exports.AlreadyClaimed = AlreadyClaimed;
class BridgeError extends Error {
    constructor(bridgeId) {
        super();
        this.bridgeId = bridgeId;
    }
}
exports.BridgeError = BridgeError;
class BridgePaused extends AccountError {
}
exports.BridgePaused = BridgePaused;
class BridgeNotExists extends AccountError {
}
exports.BridgeNotExists = BridgeNotExists;
class BridgeMalformed extends AccountError {
}
exports.BridgeMalformed = BridgeMalformed;
class StructDecodeError extends Error {
    constructor(rawData) {
        super();
        this.rawData = rawData;
    }
}
exports.StructDecodeError = StructDecodeError;
//# sourceMappingURL=errors.js.map