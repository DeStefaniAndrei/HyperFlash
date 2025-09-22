import { ethers } from "ethers";
import dotenv from 'dotenv';

dotenv.config();

const factoryAddress = '0xE51F12Dbc2fC2BD855887f247FB3793dC564a9A6';

const FACTORY_ABI = [
    "function getUserStakingContract(address user) view returns (address)",
    "function hasStakingContract(address user) view returns (bool)",
    "function backend() view returns (address)",
    "function sharedEOA() view returns (address)",
    "function deployedContracts(uint256 index) view returns (address)",
    "function getTotalContracts() view returns (uint256)"
];

async function test() {
    console.log("Testing contract at:", factoryAddress);

    const provider = new ethers.JsonRpcProvider("https://rpc.hyperliquid.xyz/evm");
    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);

    try {
        const backend = await factory.backend();
        console.log("Backend address:", backend);

        const sharedEOA = await factory.sharedEOA();
        console.log("Shared EOA:", sharedEOA);

        const total = await factory.getTotalContracts();
        console.log("Total contracts:", total.toString());

    } catch (error) {
        console.error("Error:", error);
    }
}

test();