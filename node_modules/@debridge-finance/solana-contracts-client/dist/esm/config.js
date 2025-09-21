import { PublicKey } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@debridge-finance/solana-utils";
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
        this._debridgeProgramId = new PublicKey(((_a = getEnv()) === null || _a === void 0 ? void 0 : _a.programId) || "Lima82j8YvHFYe8qa4kGgb3fvPFEnR3PoV6UyGUpHLq");
        this._settingsProgramId = new PublicKey(((_b = getEnv()) === null || _b === void 0 ? void 0 : _b.settingsProgramId) || "settFZVDbqC9zBmV2ZCBfNMCtTzia2R7mVeR6ccK2nN");
        this._associatedTokenProgramId = new PublicKey(((_c = getEnv()) === null || _c === void 0 ? void 0 : _c.associatedTokenProgramId) || ASSOCIATED_TOKEN_PROGRAM_ID);
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
export const DEFAULT_CONFIG = new Config();
//# sourceMappingURL=config.js.map