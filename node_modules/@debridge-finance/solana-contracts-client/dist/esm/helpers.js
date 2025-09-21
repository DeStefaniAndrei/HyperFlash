import { __awaiter } from "tslib";
import { readFileSync } from "fs";
import { ComputeBudgetProgram, Keypair, MessageV0, VersionedTransaction } from "@solana/web3.js";
import { constants, helpers } from "@debridge-finance/solana-utils";
import { utils, Wallet } from "@coral-xyz/anchor";
export const buildSendFn = (conn, wallet) => (...txs) => helpers.sendAll(conn, wallet, txs.map((ntx) => new VersionedTransaction(MessageV0.compile({
    instructions: ntx.instructions,
    payerKey: ntx.payer,
    recentBlockhash: constants.FAKE_BLOCKHASH,
    addressLookupTableAccounts: ntx.ALTs,
}))), {
    blockhashCommitment: "finalized",
    simulationCommtiment: "confirmed",
    // eslint-disable-next-line no-console
    logger: console.log,
});
export function waitForTxFinalization(connection, txId) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const state = yield connection.getSignatureStatus(txId);
            if (((_a = state.value) === null || _a === void 0 ? void 0 : _a.confirmationStatus) === "finalized")
                return;
            yield helpers.sleep(3000);
        }
    });
}
export const getCompiledTxWithPriority = (tx) => {
    const filteredInstructions = tx.instructions.filter((ix) => !ix.programId.equals(ComputeBudgetProgram.programId));
    return new VersionedTransaction(MessageV0.compile({
        instructions: [
            ComputeBudgetProgram.setComputeUnitLimit({ units: 300000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 30000 }),
            ...filteredInstructions,
        ],
        payerKey: tx.payer,
        recentBlockhash: constants.FAKE_BLOCKHASH,
    }));
};
export function getWallet() {
    if (process.env.ANCHOR_WALLET) {
        const fileData = readFileSync(process.env.ANCHOR_WALLET, {
            encoding: "utf-8",
        });
        const keypairData = Buffer.from(JSON.parse(fileData));
        const keypair = Keypair.fromSecretKey(keypairData);
        return new Wallet(keypair);
    }
    else if (process.env.WALLET_DATA) {
        const keypairData = utils.bytes.bs58.decode(process.env.WALLET_DATA);
        const keypair = Keypair.fromSecretKey(keypairData);
        return new helpers.Wallet(keypair);
    }
    else {
        throw new Error("No wallet data provided!");
    }
}
//# sourceMappingURL=helpers.js.map