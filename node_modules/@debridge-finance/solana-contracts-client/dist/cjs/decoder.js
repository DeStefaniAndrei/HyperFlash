"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDebridgeDecoder = void 0;
const debridge_program_1 = require("./idl/debridge_program");
const debridge_settings_program_1 = require("./idl/debridge_settings_program");
function capitalize(str) {
    return (str.charAt(0).toUpperCase() + str.slice(1));
}
function buildDebridgeDecoder(debridge, settings) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: will be filled later
    const result = {};
    for (const account of debridge_program_1.IDL.accounts) {
        result[`decode${capitalize(account.name)}`] = (data) => {
            if (data === null)
                return null;
            let buffer;
            if ("lamports" in data) {
                buffer = data.data;
            }
            else {
                buffer = Buffer.from(data);
            }
            return debridge.coder.accounts.decode(account.name, buffer);
        };
    }
    for (const account of debridge_settings_program_1.IDL.accounts) {
        result[`decode${capitalize(account.name)}`] = (data) => {
            if (data === null)
                return null;
            let buffer;
            if ("lamports" in data) {
                buffer = data.data;
            }
            else {
                buffer = Buffer.from(data);
            }
            return settings.coder.accounts.decode(account.name, buffer);
        };
    }
    return result;
}
exports.buildDebridgeDecoder = buildDebridgeDecoder;
//# sourceMappingURL=decoder.js.map