const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  const chainId = network.chainId.toString();

  console.log(`Deploying contracts to chain ${chainId} with account: ${deployer.address}`);

  let tokenAddress, token, fundAddress, passAddress;

  // ====================================================
  // STRATEGY: LOCALHOST (Fresh) vs AMOY (Optimized/Lite)
  // ====================================================
  
  if (chainId === "31337") {
      // --- LOCALHOST: DEPLOY EVERYTHING FRESH ---
      console.log("🛠️ Localhost detected: Deploying ALL contracts fresh...");

      // 1. Deploy ReliefToken
      const ReliefToken = await hre.ethers.getContractFactory("ReliefToken");
      token = await ReliefToken.deploy(deployer.address);
      await token.waitForDeployment();
      tokenAddress = await token.getAddress();
      console.log("ReliefToken deployed to:", tokenAddress);

      // 2. Deploy ReliefFund
      const ReliefFund = await hre.ethers.getContractFactory("ReliefFund");
      const fund = await ReliefFund.deploy(tokenAddress, deployer.address);
      await fund.waitForDeployment();
      fundAddress = await fund.getAddress();
      console.log("ReliefFund deployed to:", fundAddress);

      // 3. Deploy ReliefPass (SBT)
      const ReliefPass = await hre.ethers.getContractFactory("ReliefPass");
      const pass = await ReliefPass.deploy(deployer.address);
      await pass.waitForDeployment();
      passAddress = await pass.getAddress();
      console.log("ReliefPass (SBT) deployed to:", passAddress);

      // Link Pass
      console.log("Linking ReliefPass to ReliefFund...");
      await fund.setReliefPass(passAddress);

  } else {
      // --- AMOY/TESTNET: USE OPTIMIZED LITE MODE ---
      console.log("☁️ Testnet detected: Using LITE MODE (Gas Optimization)...");

      // 1. Reuse Token
      tokenAddress = "0x7C0FABE9cd79bF3657d1Fe2B8985f71cf158A5f6"; 
      token = await hre.ethers.getContractAt("ReliefToken", tokenAddress); 
      console.log("ReliefToken (Reused):", tokenAddress);

      // 2. Deploy Fund (Fresh)
      const ReliefFund = await hre.ethers.getContractFactory("ReliefFund");
      const fund = await ReliefFund.deploy(tokenAddress, deployer.address);
      await fund.waitForDeployment();
      fundAddress = await fund.getAddress();
      console.log("ReliefFund deployed to:", fundAddress);
      
      // 3. Skip Pass
      passAddress = "0x0000000000000000000000000000000000000000";
      console.log("ReliefPass (Skipped):", passAddress);
  }

  // Common: Transfer Ownership
  if (fundAddress && fundAddress.length > 10) {
      console.log("Transferring Token ownership to ReliefFund...");
      try {
        await token.transferOwnership(fundAddress);
        console.log("Ownership transferred.");
      } catch (e) {
        console.warn("Ownership Transfer skipped (likely already owned):", e.reason || e.message);
      }
  }

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
      RELIEF_PASS: passAddress, // New Soulbound Token
      updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log(`Updated deployments.json for chain ${chainId} at ${deploymentsPath}`);

  console.log("Setup complete.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n================ DEPLOYMENT ERROR ================");
    console.error(error.reason || error.message || error);
    console.error("==================================================\n");
    process.exit(1);
  });
