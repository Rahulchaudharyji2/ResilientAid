
const hre = require("hardhat");

async function main() {
    // Read from centralized deployments.json
    const fs = require('fs');
    const path = require('path');
    const deploymentPath = path.join(__dirname, '../../frontend/config/deployments.json');
    const deployments = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    
    // Default to localhost (31337) if running on it
    const chainId = hre.network.config.chainId || 31337;
    const networkData = deployments[chainId.toString()] || deployments["31337"];

    const FUND_ADDRESS = networkData.RELIEF_FUND;
    const BENEFICIARY = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
    const VENDOR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // likely the sender/vendor

    console.log(`Checking State for Fund: ${FUND_ADDRESS}`);

    const ReliefFund = await hre.ethers.getContractFactory("ReliefFund");
    const fund = ReliefFund.attach(FUND_ADDRESS);

    // 1. Check Category Count
    const count = await fund.categoryCount();
    console.log(`Total Categories: ${count.toString()}`);

    // 2. Check Beneficiary
    const benCat = await fund.entityCategory(BENEFICIARY);
    console.log(`Beneficiary ${BENEFICIARY} Category ID: ${benCat.toString()}`);

    // 3. Check Vendor
    const vendCat = await fund.entityCategory(VENDOR);
    console.log(`Vendor ${VENDOR} Category ID: ${vendCat.toString()}`);
    
    // 4. Check Token Address & Owner
    const tokenAddr = await fund.token();
    const ReliefToken = await hre.ethers.getContractFactory("ReliefToken");
    const token = ReliefToken.attach(tokenAddr);
    const tokenOwner = await token.owner();
    
    console.log(`Token Address: ${tokenAddr}`);
    console.log(`Token Owner: ${tokenOwner}`);
    console.log(`Fund Address: ${FUND_ADDRESS}`);
    
    if (tokenOwner === FUND_ADDRESS) {
        console.log("✅ Token Ownership is Correct (Fund owns Token)");
    } else {
        console.log("❌ Token Ownership MISMATCH!");
    }
}

main().catch(console.error);
