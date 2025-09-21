import { IDL as DebridgeIdl } from "./idl/debridge_program";
import { IDL as SettingsIdl } from "./idl/debridge_settings_program";
function capitalize(str) {
    return (str.charAt(0).toUpperCase() + str.slice(1));
}
export function buildDebridgeDecoder(debridge, settings) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: will be filled later
    const result = {};
    for (const account of DebridgeIdl.accounts) {
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
    for (const account of SettingsIdl.accounts) {
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
//# sourceMappingURL=decoder.js.map