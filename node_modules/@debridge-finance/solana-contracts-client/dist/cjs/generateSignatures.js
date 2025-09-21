"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.packSignatures = exports.restoreSignaturePubkey = exports.generateSignatures = void 0;
const buffer_1 = require("buffer");
const buffer_layout_1 = require("@solana/buffer-layout");
const web3_js_1 = require("@solana/web3.js");
const secp256k1_1 = require("secp256k1");
const js_sha3_1 = require("js-sha3");
const solana_utils_1 = require("@debridge-finance/solana-utils");
const utils_1 = require("./utils");
const keccak256 = (data) => `0x${(0, js_sha3_1.keccak256)(data)}`;
function msgsToInstructionData(messages, instructionIndex) {
    const START_OFFSET = 1;
    const PUBKEY_SIZE = 20;
    const secpStruct = (0, buffer_layout_1.struct)([
        (0, buffer_layout_1.u16)("secp_signature_offset"),
        (0, buffer_layout_1.u8)("secp_instruction_index"),
        (0, buffer_layout_1.u16)("secp_pubkey_offset"),
        (0, buffer_layout_1.u8)("secp_pubkey_instruction_index"),
        (0, buffer_layout_1.u16)("secp_message_data_offset"),
        (0, buffer_layout_1.u16)("secp_message_data_size"),
        (0, buffer_layout_1.u8)("secp_message_instruction_index"),
    ]);
    const sigStruct = (0, buffer_layout_1.struct)([(0, buffer_layout_1.blob)(64, "signature"), (0, buffer_layout_1.u8)("recid"), (0, buffer_layout_1.blob)(PUBKEY_SIZE, "pubkey")]);
    const BUFFER_SIZE = START_OFFSET +
        secpStruct.span * messages.length +
        sigStruct.span * messages.length +
        messages.reduce((total, msg) => total + msg.msg.length, 0);
    const DATA_OFFSET = secpStruct.span * messages.length + START_OFFSET;
    const instruction = buffer_1.Buffer.alloc(BUFFER_SIZE);
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
        (0, buffer_layout_1.blob)(message.msg.length).encode(message.msg, acc.buffer, acc.offset);
        acc.offset += message.msg.length;
        return acc;
    }, result);
    return result.buffer;
}
function createSignedMsg(message, signer) {
    const preHash = (0, utils_1.preHashMessage)(message);
    const messageHash = buffer_1.Buffer.from(keccak256(preHash).slice(2), "hex");
    const { signature, recid: recoveryId } = (0, secp256k1_1.ecdsaSign)(messageHash, signer);
    const pub = (0, secp256k1_1.publicKeyCreate)(signer, false).slice(1);
    return {
        msg: preHash,
        sig: buffer_1.Buffer.from(signature),
        recid: recoveryId,
        ethPubkey: web3_js_1.Secp256k1Program.publicKeyToEthAddress(buffer_1.Buffer.from(pub)),
    };
}
function generateSignatures(message, privateKeys, instructionIndex) {
    return msgsToInstructionData(privateKeys.map((privKeyBuf) => {
        const privKey = solana_utils_1.helpers.hexToBuffer(privKeyBuf, 32);
        return createSignedMsg(message, privKey);
    }), instructionIndex);
}
exports.generateSignatures = generateSignatures;
function restoreSignaturePubkey(message, signature, output = "hex") {
    const msg = (0, utils_1.preHashMessage)(message);
    const msgHash = keccak256(msg);
    // 65-bytes pubkey
    const pubkey = (0, secp256k1_1.ecdsaRecover)(signature.slice(0, 64), signature[64] - 27, solana_utils_1.helpers.hexToBuffer(msgHash), false);
    // remove first byte 0x04 padding
    const ethAddress = web3_js_1.Secp256k1Program.publicKeyToEthAddress(pubkey.slice(1));
    switch (output) {
        case "hex": {
            return solana_utils_1.helpers.bufferToHex(ethAddress);
        }
        case "buffer": {
            return ethAddress;
        }
    }
}
exports.restoreSignaturePubkey = restoreSignaturePubkey;
/**
 * Packs signatures and signed data into solana secp instruction data
 * @param message signed data
 * @param signatures array of signatures
 * @returns secp instruction data
 */
function packSignatures(message, signatures, instructionIndex = 0) {
    const msg = (0, utils_1.preHashMessage)(message);
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
exports.packSignatures = packSignatures;
//# sourceMappingURL=generateSignatures.js.map