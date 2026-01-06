const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("Account:", signer.address);
  try {
    const balance = await hre.ethers.provider.getBalance(signer.address);
    console.log("Balance:", hre.ethers.formatEther(balance));
  } catch (error) {
    console.error("Error fetching balance:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
