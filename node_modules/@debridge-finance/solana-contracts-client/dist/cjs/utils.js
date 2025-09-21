"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAccountEmpty = exports.checkFlag = exports.preHashMessage = exports.normalize = void 0;
const buffer_1 = require("buffer");
const anchor_1 = require("@coral-xyz/anchor");
function normalize(amount, nominator) {
    const amountBN = new anchor_1.BN(amount);
    const nominatorBN = new anchor_1.BN(10 ** nominator);
    return amountBN.div(nominatorBN);
}
exports.normalize = normalize;
function preHashMessage(data) {
    const preamble = buffer_1.Buffer.from(`\x19Ethereum Signed Message:\n${data.length}`);
    const ethMessage = buffer_1.Buffer.concat([preamble, data]);
    return ethMessage;
}
exports.preHashMessage = preHashMessage;
function checkFlag(flags, toCheck) {
    if (flags === undefined || flags === null) {
        return false;
    }
    const flagsBN = new anchor_1.BN(flags, "be");
    return !flagsBN.and(new anchor_1.BN(toCheck)).eqn(0); // flags & flag != 0 -> flag is set
}
exports.checkFlag = checkFlag;
function isAccountEmpty(acc) {
    return acc === null || (acc === null || acc === void 0 ? void 0 : acc.lamports) === 0;
}
exports.isAccountEmpty = isAccountEmpty;
//# sourceMappingURL=utils.js.map