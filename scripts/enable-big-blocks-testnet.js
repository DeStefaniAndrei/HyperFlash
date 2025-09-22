/**
 * Enable Big Blocks on HyperLiquid Testnet
 * Simplified script to enable big blocks via CoreWriter contract
 */

import pkg from "hardhat";
const { ethers } = pkg;

const CORE_WRITER_ADDRESS = "0x3333333333333333333333333333333333333333";

async function main() {
    console.log("\n============================================================");
    console.log("   Enabling Big Blocks on HyperLiquid Testnet");
    console.log("============================================================\n");

    try {
        const [signer] = await ethers.getSigners();
        console.log("Connected as:", signer.address);

        const balance = await ethers.provider.getBalance(signer.address);
        console.log("Balance:", ethers.formatEther(balance), "HYPE\n");

        // CoreWriter interface
        const coreWriterABI = ["function sendRawAction(bytes calldata data) external"];
        const coreWriter = new ethers.Contract(CORE_WRITER_ADDRESS, coreWriterABI, signer);

        // Encode evmUserModify action
        // Format: [version(1)][actionId(3)][data]
        console.log("Encoding evmUserModify action...");

        // Try common action IDs (need to find correct one)
        const actionIds = ["000001", "000010", "000020", "00000F", "000100"];

        console.log("Trying to enable big blocks...\n");

        for (const actionId of actionIds) {
            try {
                console.log(`Testing action ID: 0x${actionId}`);

                // Encode: version + actionId + bool(true)
                const abiCoder = new ethers.AbiCoder();
                const boolData = abiCoder.encode(["bool"], [true]);
                const actionData = "0x01" + actionId + boolData.slice(2);

                console.log("Sending action to CoreWriter...");
                const tx = await coreWriter.sendRawAction(actionData, {
                    gasLimit: 100000,
                    gasPrice: ethers.parseUnits("1", "gwei")
                });

                console.log("TX Hash:", tx.hash);
                await tx.wait();

                console.log("[SUCCESS] Action sent with ID:", actionId);
                console.log("\nWaiting 5 seconds for propagation...");
                await new Promise(resolve => setTimeout(resolve, 5000));

                console.log("\n============================================================");
                console.log("   BIG BLOCKS POTENTIALLY ENABLED!");
                console.log("   Try deploying contracts now (30M gas limit)");
                console.log("============================================================\n");

                return; // Success, exit

            } catch (error) {
                console.log(`Failed with ID ${actionId}:`, error.message.substring(0, 50));
            }
        }

        console.log("\n[WARN] Could not enable big blocks via known action IDs");
        console.log("The evmUserModify action ID may not be public yet");

    } catch (error) {
        console.error("\n[ERROR] Fatal:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });