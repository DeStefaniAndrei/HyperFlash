import { PublicKey } from "@solana/web3.js";
declare class Config {
    private _debridgeProgramId;
    private _settingsProgramId;
    private _associatedTokenProgramId;
    constructor();
    get DEBRIDGE_PROGRAM_ID(): PublicKey;
    get SETTINGS_PROGRAM_ID(): PublicKey;
    get ASSOCIATED_TOKEN_PROGRAM_ID(): PublicKey;
}
export declare const DEFAULT_CONFIG: Config;
export {};
//# sourceMappingURL=config.d.ts.map