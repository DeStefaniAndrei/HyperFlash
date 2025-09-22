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
    const backendAddress = "0x9F5ADC9EC328a249ebde3d46CB00c48C3Ba8e8Cf";  // Using deployer wallet as backend

    // Shared EOA that will execute trades
    // For MVP, using same wallet for everything
    const sharedEOA = "0x9F5ADC9EC328a249ebde3d46CB00c48C3Ba8e8Cf";  // Same as deployer for MVP

    console.log("\nConfiguration:");
    console.log("- Backend Address:", backendAddress);
    console.log("- Shared EOA:", sharedEOA);

    // Deploy Optimized Factory contract (smaller gas usage)
    console.log("\nDeploying FactoryOptimized contract...");
    const Factory = await ethers.getContractFactory("FactoryOptimized");
    const factory = await Factory.deploy(backendAddress);

    // Wait for deployment
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();

    console.log("Factory deployed to:", factoryAddress);

    // Skip verification for FactoryOptimized (no public getters)

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