/// <reference types="bn.js" />
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
export declare class InitError extends Error {
    readonly idlPath: string;
    readonly baseError: Error;
    constructor(idlPath: string, baseError: Error);
}
export declare class AccountError extends Error {
    readonly publicKey: PublicKey;
    constructor(publicKey: PublicKey);
}
export declare class AccountNotInitialized extends AccountError {
    toString(): string;
}
export declare class BridgeStateNotExists extends AccountNotInitialized {
}
export declare class BridgeStateMalformed extends AccountError {
}
export declare class ChainSupportInfoNotInitialized extends AccountNotInitialized {
}
export declare class ChainSupportInfoNotSupported extends AccountError {
}
export declare class BridgeFeeNotInitialized extends AccountNotInitialized {
}
export declare class AssetFeeNotSupported extends AccountError {
}
export declare class BridgeFeeMalformed extends AccountError {
}
export declare class ChainSupportInfoMalformed extends AccountError {
}
export declare class DiscountInfoMalformed extends AccountError {
}
export declare class ConfirmationStorageMalformed extends AccountError {
}
export declare class DiscountNotActive extends AccountError {
}
export declare class DiscountNotExists extends AccountError {
}
export declare class SubmissionInfoNotExists extends AccountError {
}
export declare class ExternalCallMetaNotExists extends AccountError {
}
export declare class AssociatedWalletNotInitialized extends AccountNotInitialized {
    readonly associatedWallet: PublicKey;
    constructor(pk: PublicKey, associatedWallet: PublicKey);
}
export declare class InsufficientFunds extends Error {
    readonly account: PublicKey;
    readonly neededAmount: BN;
    readonly currentBalance: BN;
    constructor(account: PublicKey, needed: number | BN, currentBalance: number | BN);
}
export interface IDLError {
    code: number;
    name: string;
    msg: string;
}
export declare class TransactionExecutionError extends Error {
    readonly programLogs: string[];
    readonly customErrors: IDLError[];
    constructor(logs: string[], idlErrors: IDLError[]);
}
export declare class NotEnoughTokens extends Error {
    readonly associatedWallet: PublicKey;
    readonly currentAmount: BN;
    readonly neededAmount: BN;
    constructor(wallet: PublicKey, current: number | BN, needed: number | BN);
}
export declare class AlreadyClaimed extends Error {
    readonly submissionId: Uint8Array;
    constructor(submissionId: Uint8Array);
}
export declare class BridgeError extends Error {
    readonly bridgeId: PublicKey;
    constructor(bridgeId: PublicKey);
}
export declare class BridgePaused extends AccountError {
}
export declare class BridgeNotExists extends AccountError {
}
export declare class BridgeMalformed extends AccountError {
}
export declare class StructDecodeError extends Error {
    readonly rawData: Uint8Array;
    constructor(rawData: Uint8Array);
}
//# sourceMappingURL=errors.d.ts.map