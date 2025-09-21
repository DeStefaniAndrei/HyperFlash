import { Buffer } from "buffer";
import { struct, blob, u8, u16 } from "@solana/buffer-layout";
import { Secp256k1Program } from "@solana/web3.js";
import { ecdsaSign, publicKeyCreate, ecdsaRecover } from "secp256k1";
import { keccak256 as rawKeccak256 } from "js-sha3";
import { helpers } from "@debridge-finance/solana-utils";
import { preHashMessage } from "./utils";
const keccak256 = (data) => `0x${rawKeccak256(data)}`;
function msgsToInstructionData(messages, instructionIndex) {
    const START_OFFSET = 1;
    const PUBKEY_SIZE = 20;
    const secpStruct = struct([
        u16("secp_signature_offset"),
        u8("secp_instruction_index"),
        u16("secp_pubkey_offset"),
        u8("secp_pubkey_instruction_index"),
        u16("secp_message_data_offset"),
        u16("secp_message_data_size"),
        u8("secp_message_instruction_index"),
    ]);
    const sigStruct = struct([blob(64, "signature"), u8("recid"), blob(PUBKEY_SIZE, "pubkey")]);
    const BUFFER_SIZE = START_OFFSET +
        secpStruct.span * messages.length +
        sigStruct.span * messages.length +
        messages.reduce((total, msg) => total + msg.msg.length, 0);
    const DATA_OFFSET = secpStruct.span * messages.length + START_OFFSET;
    const instruction = Buffer.alloc(BUFFER_SIZE);
    instruction[0] = messages.length;
    const result = { offset: DATA_OFFSET, buffer: instruction };
    messages.reduce((acc, message, index) => {
        secpStruct.encode({
            secp_signature_offset: acc.offset,
            secp_instruction_index: instructionIndex,
            secp_pubkey_offset: acc.offset + 65,
            secp_pubkey_instruction_index: instructionIndex,
            secp_message_data_offset: acc.offset + sigStruct.span,
            secp_message_data_size: message.msg.length,
            secp_message_instruction_index: instructionIndex,
        }, acc.buffer, secpStruct.span * index + START_OFFSET);
        sigStruct.encode({
            signature: message.sig,
            recid: message.recid,
            pubkey: message.ethPubkey,
        }, acc.buffer, acc.offset);
        acc.offset += sigStruct.span;
        blob(message.msg.length).encode(message.msg, acc.buffer, acc.offset);
        acc.offset += message.msg.length;
        return acc;
    }, result);
    return result.buffer;
}
function createSignedMsg(message, signer) {
    const preHash = preHashMessage(message);
    const messageHash = Buffer.from(keccak256(preHash).slice(2), "hex");
    const { signature, recid: recoveryId } = ecdsaSign(messageHash, signer);
    const pub = publicKeyCreate(signer, false).slice(1);
    return {
        msg: preHash,
        sig: Buffer.from(signature),
        recid: recoveryId,
        ethPubkey: Secp256k1Program.publicKeyToEthAddress(Buffer.from(pub)),
    };
}
export function generateSignatures(message, privateKeys, instructionIndex) {
    return msgsToInstructionData(privateKeys.map((privKeyBuf) => {
        const privKey = helpers.hexToBuffer(privKeyBuf, 32);
        return createSignedMsg(message, privKey);
    }), instructionIndex);
}
export function restoreSignaturePubkey(message, signature, output = "hex") {
    const msg = preHashMessage(message);
    const msgHash = keccak256(msg);
    // 65-bytes pubkey
    const pubkey = ecdsaRecover(signature.slice(0, 64), signature[64] - 27, helpers.hexToBuffer(msgHash), false);
    // remove first byte 0x04 padding
    const ethAddress = Secp256k1Program.publicKeyToEthAddress(pubkey.slice(1));
    switch (output) {
        case "hex": {
            return helpers.bufferToHex(ethAddress);
        }
        case "buffer": {
            return ethAddress;
        }
    }
}
/**
 * Packs signatures and signed data into solana secp instruction data
 * @param message signed data
 * @param signatures array of signatures
 * @returns secp instruction data
 */
export function packSignatures(message, signatures, instructionIndex = 0) {
    const msg = preHashMessage(message);
    return msgsToInstructionData(Array.from(signatures, (signatureItem) => {
        if (signatureItem.length !== 65)
            throw new Error("Signature must have lenght of 65 bytes");
        const tmp = {
            msg,
            sig: signatureItem.slice(0, 64),
            recid: signatureItem[64] - 27,
            ethPubkey: restoreSignaturePubkey(message, signatureItem, "buffer"),
        };
        // First 64 bytes is signature itself, 65-th byte is recoveryId
        //console.log(`pk: ${tmp.ethPubkey.toString("hex")}, recid: ${tmp.recid}`);
        return tmp;
    }), instructionIndex);
}
//# sourceMappingURL=generateSignatures.js.map