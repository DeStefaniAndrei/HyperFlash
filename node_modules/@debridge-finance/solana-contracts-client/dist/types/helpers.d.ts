import { Connection, VersionedTransaction } from "@solana/web3.js";
import { helpers } from "@debridge-finance/solana-utils";
import { Wallet } from "@coral-xyz/anchor";
import { NonCompiledTransaction } from "./interfaces";
export declare const buildSendFn: (conn: Connection, wallet: helpers.Wallet) => (...txs: NonCompiledTransaction[]) => Promise<string[]>;
export declare function waitForTxFinalization(connection: Connection, txId: string): Promise<void>;
export declare const getCompiledTxWithPriority: (tx: NonCompiledTransaction) => VersionedTransaction;
export declare function getWallet(): Wallet | helpers.Wallet;
//# sourceMappingURL=helpers.d.ts.map