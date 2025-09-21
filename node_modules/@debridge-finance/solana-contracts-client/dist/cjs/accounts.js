"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatableAccountInfo = exports.buildDecodedAccountInfoWithAddress = void 0;
function buildDecodedAccountInfoWithAddress(address, info, decoder) {
    return {
        ...info,
        address,
        data: info && (info === null || info === void 0 ? void 0 : info.data.length) !== 0 ? decoder(info.data) : null,
    };
}
exports.buildDecodedAccountInfoWithAddress = buildDecodedAccountInfoWithAddress;
class UpdatableAccountInfo {
    constructor(accountAddress, info, decoder) {
        this.accountAddress = accountAddress;
        this.decoder = decoder;
        this.accountInfo = info === null ? null : buildDecodedAccountInfoWithAddress(accountAddress, info, decoder);
    }
    toString() {
        if (this.isEmpty) {
            return `${this.accountAddress.toBase58()}: empty`;
        }
        else {
            const info = this.accountInfo;
            const strData = (info === null || info === void 0 ? void 0 : info.data) ? (Buffer.isBuffer(info.data) ? info.data.toString("hex") : JSON.stringify(info.data)) : "<empty>";
            return `${this.accountAddress.toBase58()}: balance ${info.lamports.toString()}, owner: ${info.owner.toBase58()}, data: ${strData}`;
        }
    }
    setData(newData) {
        this.accountInfo = buildDecodedAccountInfoWithAddress(this.accountAddress, newData, this.decoder);
    }
    get isEmpty() {
        return this.accountInfo === null || this.accountInfo.lamports === 0;
    }
    get address() {
        return this.accountAddress;
    }
    get lamports() {
        if (this.accountInfo === null)
            return undefined;
        return this.accountInfo.lamports;
    }
    get owner() {
        if (this.accountInfo === null || this.accountInfo.lamports === 0)
            return undefined;
        return this.accountInfo.owner;
    }
    get data() {
        if (this.accountInfo === null || this.accountInfo.lamports === 0)
            return undefined;
        return this.accountInfo.data;
    }
    get executable() {
        if (this.accountInfo === null || this.accountInfo.lamports === 0)
            return undefined;
        return this.accountInfo.executable;
    }
}
exports.UpdatableAccountInfo = UpdatableAccountInfo;
//# sourceMappingURL=accounts.js.map