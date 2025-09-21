import { Buffer } from "buffer";
import { BN } from "@coral-xyz/anchor";
export function normalize(amount, nominator) {
    const amountBN = new BN(amount);
    const nominatorBN = new BN(10 ** nominator);
    return amountBN.div(nominatorBN);
}
export function preHashMessage(data) {
    const preamble = Buffer.from(`\x19Ethereum Signed Message:\n${data.length}`);
    const ethMessage = Buffer.concat([preamble, data]);
    return ethMessage;
}
export function checkFlag(flags, toCheck) {
    if (flags === undefined || flags === null) {
        return false;
    }
    const flagsBN = new BN(flags, "be");
    return !flagsBN.and(new BN(toCheck)).eqn(0); // flags & flag != 0 -> flag is set
}
export function isAccountEmpty(acc) {
    return acc === null || (acc === null || acc === void 0 ? void 0 : acc.lamports) === 0;
}
//# sourceMappingURL=utils.js.map