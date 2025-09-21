"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWallet = exports.getCompiledTxWithPriority = exports.waitForTxFinalization = exports.buildSendFn = void 0;
const fs_1 = require("fs");
const web3_js_1 = require("@solana/web3.js");
const solana_utils_1 = require("@debridge-finance/solana-utils");
const anchor_1 = require("@coral-xyz/anchor");
const buildSendFn = (conn, wallet) => (...txs) => solana_utils_1.helpers.sendAll(conn, wallet, txs.map((ntx) => new web3_js_1.VersionedTransaction(web3_js_1.MessageV0.compile({
    instructions: ntx.instructions,
    payerKey: ntx.payer,
    recentBlockhash: solana_utils_1.constants.FAKE_BLOCKHASH,
    addressLookupTableAccounts: ntx.ALTs,
}))), {
    blockhashCommitment: "finalized",
    simulationCommtiment: "confirmed",
    // eslint-disable-next-line no-console
    logger: console.log,
});
exports.buildSendFn = buildSendFn;
async function waitForTxFinalization(connection, txId) {
    var _a;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const state = await connection.getSignatureStatus(txId);
        if (((_a = state.value) === null || _a === void 0 ? void 0 : _a.confirmationStatus) === "finalized")
            return;
        await solana_utils_1.helpers.sleep(3000);
    }
}
exports.waitForTxFinalization = waitForTxFinalization;
const getCompiledTxWithPriority = (tx) => {
    const filteredInstructions = tx.instructions.filter((ix) => !ix.programId.equals(web3_js_1.ComputeBudgetProgram.programId));
    return new web3_js_1.VersionedTransaction(web3_js_1.MessageV0.compile({
        instructions: [
            web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({ units: 300000 }),
            web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 30000 }),
            ...filteredInstructions,
        ],
        payerKey: tx.payer,
        recentBlockhash: solana_utils_1.constants.FAKE_BLOCKHASH,
    }));
};
exports.getCompiledTxWithPriority = getCompiledTxWithPriority;
function getWallet() {
    if (process.env.ANCHOR_WALLET) {
        const fileData = (0, fs_1.readFileSync)(process.env.ANCHOR_WALLET, {
            encoding: "utf-8",
        });
        const keypairData = Buffer.from(JSON.parse(fileData));
        const keypair = web3_js_1.Keypair.fromSecretKey(keypairData);
        return new anchor_1.Wallet(keypair);
    }
    else if (process.env.WALLET_DATA) {
        const keypairData = anchor_1.utils.bytes.bs58.decode(process.env.WALLET_DATA);
        const keypair = web3_js_1.Keypair.fromSecretKey(keypairData);
        return new solana_utils_1.helpers.Wallet(keypair);
    }
    else {
        throw new Error("No wallet data provided!");
    }
}
exports.getWallet = getWallet;
//# sourceMappingURL=helpers.js.map