import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
    console.log("Starting HyperFlash contract deployment...");

    // Get the deployer's signer
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Get balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    // Hardcoded addresses for MVP
    // Backend service address (will run the monitoring service)
    const backendAddress = "0xF5AD9A14152ee5c12d17d9C1e99fe8193F27Eb8F";  // Using test wallet as backend for now

    // Shared EOA that will execute trades
    // For MVP, we'll manually fund this address on HyperLiquid testnet
    const sharedEOA = "0x1234567890123456789012345678901234567890";  // Placeholder - replace with actual funded EOA

    console.log("\nConfiguration:");
    console.log("- Backend Address:", backendAddress);
    console.log("- Shared EOA:", sharedEOA);

    // Deploy Factory contract
    console.log("\nDeploying Factory contract...");
    const Factory = await ethers.getContractFactory("Factory");
    const factory = await Factory.deploy(backendAddress, sharedEOA);

    // Wait for deployment
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();

    console.log("Factory deployed to:", factoryAddress);

    // Verify deployment
    const deployedBackend = await factory.backend();
    const deployedSharedEOA = await factory.sharedEOA();

    console.log("\nVerification:");
    console.log("- Backend address set:", deployedBackend);
    console.log("- Shared EOA set:", deployedSharedEOA);

    console.log("\n✅ Deployment complete!");
    console.log("\nNext steps:");
    console.log("1. Fund the shared EOA on HyperLiquid testnet");
    console.log("2. Deploy backend monitoring service");
    console.log("3. Users can call factory.deployStakingContract(validatorAddress)");

    return {
        factoryAddress,
        backendAddress,
        sharedEOA
    };
}

// Run the deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });