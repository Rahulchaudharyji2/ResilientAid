
const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy ReliefToken
  // 1. Attach to existing ReliefToken
  const tokenAddress = "0xFBFC72329eB24C43745fCA901a4b1c65133819B9";
  const ReliefToken = await hre.ethers.getContractFactory("ReliefToken");
  const token = ReliefToken.attach(tokenAddress);
  console.log("Using existing ReliefToken at:", tokenAddress);

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

  const deploymentData = {
    RELIEF_TOKEN_ADDRESS: tokenAddress,
    RELIEF_FUND_ADDRESS: fundAddress
  };

  fs.writeFileSync("deployment.json", JSON.stringify(deploymentData, null, 2));
  console.log("Deployment data saved to deployment.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
