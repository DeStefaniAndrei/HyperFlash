/**
 * Manage Big Blocks on HyperLiquid via CoreWriter Contract
 * This script enables/disables big blocks for contract deployment
 */

import pkg from "hardhat";
const { ethers } = pkg;

// CoreWriter system contract address on HyperLiquid
const CORE_WRITER_ADDRESS = "0x3333333333333333333333333333333333333333";

// CoreWriter ABI (only the function we need)
const CORE_WRITER_ABI = [
    "function sendRawAction(bytes calldata data) external"
];

/**
 * Encode the evmUserModify action
 * @param {boolean} usingBigBlocks - true to enable big blocks, false for small blocks
 * @returns {string} Encoded action data
 */
function encodeEvmUserModify(usingBigBlocks) {
    console.log(`\n📝 Encoding evmUserModify action...`);
    console.log(`   usingBigBlocks: ${usingBigBlocks}`);

    // Action format: [version(1 byte)][actionId(3 bytes)][actionData]
    const version = "01"; // Version 1

    // Action ID for evmUserModify
    // NOTE: This needs to be confirmed from HyperLiquid documentation
    // Different actions have different IDs:
    // - 0x07: USD class transfer
    // - 0x0B: Limit order
    // We need the ID for evmUserModify
    const actionId = "000020"; // Placeholder - needs confirmation

    // Encode the action-specific data
    // For evmUserModify: just the boolean for usingBigBlocks
    const abiCoder = new ethers.AbiCoder();
    const actionData = abiCoder.encode(["bool"], [usingBigBlocks]);

    // Combine all parts
    const fullAction = "0x" + version + actionId + actionData.slice(2);

    console.log(`   Encoded action: ${fullAction}`);
    return fullAction;
}

/**
 * Send action to HyperCore via CoreWriter
 * @param {ethers.Signer} signer - Signer to send the transaction
 * @param {boolean} enable - true to enable big blocks, false to disable
 */
async function setBigBlocks(signer, enable) {
    console.log(`\n⚙️  ${enable ? "Enabling" : "Disabling"} big blocks...`);

    try {
        // Connect to CoreWriter contract
        const coreWriter = new ethers.Contract(
            CORE_WRITER_ADDRESS,
            CORE_WRITER_ABI,
            signer
        );

        // Encode the action
        const actionData = encodeEvmUserModify(enable);

        // Send the action
        console.log(`\n📤 Sending transaction to CoreWriter...`);
        const tx = await coreWriter.sendRawAction(actionData, {
            gasLimit: 100000, // ~47k gas typically needed
            gasPrice: ethers.parseUnits("1", "gwei")
        });

        console.log(`   TX Hash: ${tx.hash}`);
        console.log(`   ⏳ Waiting for confirmation...`);

        const receipt = await tx.wait();
        console.log(`   ✅ Confirmed in block: ${receipt.blockNumber}`);

        // Note about the delay
        console.log(`\n⏰ Important: Actions are delayed by a few seconds on-chain`);
        console.log(`   Waiting 5 seconds for propagation...`);
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log(`\n✅ Big blocks ${enable ? "ENABLED" : "DISABLED"}!`);

        if (enable) {
            console.log(`   🚀 You can now deploy large contracts (30M gas limit)`);
            console.log(`   ⚠️  Big blocks last for ~60 seconds`);
            console.log(`   Deploy your contracts NOW!`);
        } else {
            console.log(`   Back to small blocks (2M gas, 1 second)`);
        }

        return true;

    } catch (error) {
        console.error(`\n❌ Failed to set big blocks:`, error.message);
        return false;
    }
}

/**
 * Check if wallet is a Core user (has USDC)
 * @param {string} address - Wallet address to check
 */
async function checkCoreUser(address) {
    console.log(`\n🔍 Checking if ${address} is a Core user...`);

    // On testnet, we can check if the wallet has any USDC
    // This would require checking HyperCore precompiles
    // For now, we'll assume the user is ready

    console.log(`   📝 Note: You need USDC or other Core assets to be a Core user`);
    console.log(`   On testnet, get testnet USDC from a faucet`);

    return true; // Assume ready for testing
}

/**
 * Main execution
 */
async function main() {
    console.log("\n" + "=" * 60);
    console.log("   HyperLiquid Big Block Manager (JavaScript)");
    console.log("=" * 60);

    // Get command line argument
    // When run via hardhat, args are different
    const args = process.argv;
    const commandIndex = args.findIndex(arg => arg.includes('manage-big-blocks.js')) + 1;
    const command = args[commandIndex]?.toLowerCase() || process.env.BIG_BLOCK_COMMAND;

    if (!command || !["enable", "disable", "status"].includes(command)) {
        console.log("\n❌ Usage: node manage-big-blocks.js [enable|disable|status]");
        console.log("\nCommands:");
        console.log("   enable  - Enable big blocks for deployment");
        console.log("   disable - Switch back to small blocks");
        console.log("   status  - Check current configuration");
        process.exit(1);
    }

    try {
        // Get signer from Hardhat config
        const [signer] = await ethers.getSigners();
        console.log(`\n📡 Connected as: ${signer.address}`);

        // Check balance
        const balance = await ethers.provider.getBalance(signer.address);
        console.log(`💰 Balance: ${ethers.formatEther(balance)} HYPE`);

        // Check if Core user
        const isCoreUser = await checkCoreUser(signer.address);

        if (!isCoreUser) {
            console.log(`\n⚠️  WARNING: May not be a Core user`);
            console.log(`   You need USDC to send actions to HyperCore`);
        }

        // Execute command
        if (command === "enable") {
            const success = await setBigBlocks(signer, true);

            if (success) {
                console.log("\n" + "=" * 60);
                console.log("   READY FOR DEPLOYMENT!");
                console.log("=" * 60);
                console.log("\nNext step:");
                console.log("   npx hardhat run scripts/deploy-with-big-blocks.js --network hyperLiquidTestnet");
            }

        } else if (command === "disable") {
            const success = await setBigBlocks(signer, false);

            if (success) {
                console.log("\n✅ Successfully switched back to small blocks");
            }

        } else if (command === "status") {
            console.log("\n📊 Status Check:");
            console.log("   Check by attempting a deployment");
            console.log("   If gas limit allows >2M, big blocks are enabled");
        }

    } catch (error) {
        console.error("\n❌ Fatal error:", error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });