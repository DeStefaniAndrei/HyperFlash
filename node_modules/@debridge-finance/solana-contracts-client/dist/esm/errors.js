import { BN } from "@coral-xyz/anchor";
export class InitError extends Error {
    constructor(idlPath, baseError) {
        super();
        this.idlPath = idlPath;
        this.baseError = baseError;
    }
}
export class AccountError extends Error {
    constructor(publicKey) {
        super();
        this.publicKey = publicKey;
    }
}
export class AccountNotInitialized extends AccountError {
    toString() {
        return `AccountNotInitialized: couldn't find info about ${this.publicKey.toBase58()} in blockchain`;
    }
}
export class BridgeStateNotExists extends AccountNotInitialized {
}
export class BridgeStateMalformed extends AccountError {
}
export class ChainSupportInfoNotInitialized extends AccountNotInitialized {
}
export class ChainSupportInfoNotSupported extends AccountError {
}
export class BridgeFeeNotInitialized extends AccountNotInitialized {
}
export class AssetFeeNotSupported extends AccountError {
}
export class BridgeFeeMalformed extends AccountError {
}
export class ChainSupportInfoMalformed extends AccountError {
}
export class DiscountInfoMalformed extends AccountError {
}
export class ConfirmationStorageMalformed extends AccountError {
}
export class DiscountNotActive extends AccountError {
}
export class DiscountNotExists extends AccountError {
}
export class SubmissionInfoNotExists extends AccountError {
}
export class ExternalCallMetaNotExists extends AccountError {
}
export class AssociatedWalletNotInitialized extends AccountNotInitialized {
    constructor(pk, associatedWallet) {
        super(pk);
        this.associatedWallet = associatedWallet;
    }
}
export class InsufficientFunds extends Error {
    constructor(account, needed, currentBalance) {
        super();
        this.account = account;
        this.neededAmount = new BN(needed);
        this.currentBalance = new BN(currentBalance);
    }
}
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
export class TransactionExecutionError extends Error {
    constructor(logs, idlErrors) {
        super();
        this.programLogs = getLogs(logs);
        this.customErrors = getCustomErrors(this.programLogs, idlErrors);
    }
}
export class NotEnoughTokens extends Error {
    constructor(wallet, current, needed) {
        super();
        this.associatedWallet = wallet;
        this.currentAmount = new BN(current);
        this.neededAmount = new BN(needed);
    }
}
export class AlreadyClaimed extends Error {
    constructor(submissionId) {
        super();
        this.submissionId = submissionId;
    }
}
export class BridgeError extends Error {
    constructor(bridgeId) {
        super();
        this.bridgeId = bridgeId;
    }
}
export class BridgePaused extends AccountError {
}
export class BridgeNotExists extends AccountError {
}
export class BridgeMalformed extends AccountError {
}
export class StructDecodeError extends Error {
    constructor(rawData) {
        super();
        this.rawData = rawData;
    }
}
//# sourceMappingURL=errors.js.map