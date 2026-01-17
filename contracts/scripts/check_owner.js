
const hre = require("hardhat");

async function main() {
    // Read from centralized deployments.json
    const fs = require('fs');
    const path = require('path');
    const deploymentPath = path.join(__dirname, '../../frontend/config/deployments.json');
    const deployments = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    
    // Default to localhost (31337) if running on it, otherwise use available chain
    const chainId = hre.network.config.chainId || 31337;
    const networkData = deployments[chainId.toString()] || deployments["31337"];
    
    if (!networkData) {
        throw new Error(`No deployment found for chain ID ${chainId}`);
    }

    const FUND_ADDRESS = networkData.RELIEF_FUND; 
    
    console.log(`Checking Owner for Fund: ${FUND_ADDRESS}`);
    
    try {
        const ReliefFund = await hre.ethers.getContractFactory("ReliefFund");
        const fund = ReliefFund.attach(FUND_ADDRESS);
        
        const owner = await fund.owner();
        console.log(`✅ Contract Owner is: ${owner}`);
        
        const [deployer] = await hre.ethers.getSigners();
        console.log(`ℹ️  Deployer / Account #0 (Hardhat): ${deployer.address}`);
        
        if (owner.toLowerCase() === deployer.address.toLowerCase()) {
            console.log("-> Owner matches Hardhat Account #0.");
        } else {
            console.log("-> Owner is DIFFERENT from Account #0!!");
        }
        
    } catch (e) {
        console.error("❌ Failed to read owner. Is the address correct?");
        console.error(e.message);
    }
}

main().catch(console.error);
