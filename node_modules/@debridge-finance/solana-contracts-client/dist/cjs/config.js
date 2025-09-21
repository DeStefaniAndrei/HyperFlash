"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
const web3_js_1 = require("@solana/web3.js");
const solana_utils_1 = require("@debridge-finance/solana-utils");
function getEnv() {
    if (typeof process === undefined) {
        return {};
    }
    else {
        return process.env;
    }
}
class Config {
    constructor() {
        var _a, _b, _c;
        this._debridgeProgramId = new web3_js_1.PublicKey(((_a = getEnv()) === null || _a === void 0 ? void 0 : _a.programId) || "Lima82j8YvHFYe8qa4kGgb3fvPFEnR3PoV6UyGUpHLq");
        this._settingsProgramId = new web3_js_1.PublicKey(((_b = getEnv()) === null || _b === void 0 ? void 0 : _b.settingsProgramId) || "settFZVDbqC9zBmV2ZCBfNMCtTzia2R7mVeR6ccK2nN");
        this._associatedTokenProgramId = new web3_js_1.PublicKey(((_c = getEnv()) === null || _c === void 0 ? void 0 : _c.associatedTokenProgramId) || solana_utils_1.ASSOCIATED_TOKEN_PROGRAM_ID);
    }
    get DEBRIDGE_PROGRAM_ID() {
        return this._debridgeProgramId;
    }
    get SETTINGS_PROGRAM_ID() {
        return this._settingsProgramId;
    }
    get ASSOCIATED_TOKEN_PROGRAM_ID() {
        return this._associatedTokenProgramId;
    }
}
exports.DEFAULT_CONFIG = new Config();
//# sourceMappingURL=config.js.map