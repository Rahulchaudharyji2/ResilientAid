const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Fixing permissions for account:", deployer.address);

  // Load Deployment
  const deployment = require("../deployment.json");
  const fundAddress = deployment.RELIEF_FUND_ADDRESS;
  
  const ReliefFund = await hre.ethers.getContractFactory("ReliefFund");
  const fund = ReliefFund.attach(fundAddress);

  // 1. Ensure Category 1 exists
  console.log("Checking categories...");
  const cat1 = await fund.categories(1);
  if (!cat1.exists) {
      console.log("Creating 'General Liquidity' Category...");
      const tx = await fund.addCategory("General Liquidity");
      await tx.wait();
      console.log("Category created.");
  } else {
      console.log("Category 1 exists:", cat1.name);
  }

  // 2. Whitelist Admin
  console.log("Whitelisting Admin as Beneficiary (for Swap Demo)...");
  try {
      const tx = await fund.whitelistBeneficiary(deployer.address, 1);
      await tx.wait();
      console.log("Admin whitelisted successfully!");
  } catch (e) {
      console.log("Admin listing failed or already done:", e.message);
  }

  console.log("✅ Ready for Swap/Mint Demo.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
