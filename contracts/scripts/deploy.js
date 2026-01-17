const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  const chainId = network.chainId.toString();

  console.log(`Deploying contracts to chain ${chainId} with account: ${deployer.address}`);

  // 1. Deploy ReliefToken
  const ReliefToken = await hre.ethers.getContractFactory("ReliefToken");
  const token = await ReliefToken.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("ReliefToken deployed to:", tokenAddress);

  // 2. Deploy ReliefFund
  const ReliefFund = await hre.ethers.getContractFactory("ReliefFund");
  const fund = await ReliefFund.deploy(tokenAddress, deployer.address);
  await fund.waitForDeployment();
  const fundAddress = await fund.getAddress();
  console.log("ReliefFund deployed to:", fundAddress);

  // 3. Transfer ownership of Token to Fund
  console.log("Transferring Token ownership to ReliefFund...");
  await token.transferOwnership(fundAddress);
  console.log("Ownership transferred.");

  // 4. Update Frontend Config
  const deploymentsPath = path.join(__dirname, "../../frontend/config/deployments.json");
  
  let deployments = {};
  if (fs.existsSync(deploymentsPath)) {
    try {
        deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
    } catch (e) {
        console.warn("Could not parse existing deployments.json, starting fresh.");
    }
  }

  // Ensure chainId section exists
  if (!deployments[chainId]) {
      deployments[chainId] = {};
  }

  deployments[chainId] = {
      RELIEF_TOKEN: tokenAddress,
      RELIEF_FUND: fundAddress,
      updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log(`Updated deployments.json for chain ${chainId} at ${deploymentsPath}`);

  console.log("Setup complete.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
