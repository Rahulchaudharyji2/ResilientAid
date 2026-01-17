
const { ethers } = require("hardhat");

async function main() {
    const [deployer, vendor, beneficiary] = await ethers.getSigners();
    
    // 1. Get Contracts
    const Fund = await ethers.getContractFactory("ReliefFund");
    const Token = await ethers.getContractFactory("ReliefToken");
    
    // Attach to deployed addresses 
    // IMPORTANT: Make sure these match the running node!
    const fundAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; 
    const fund = Fund.attach(fundAddress);
    
    const tokenAddress = await fund.token();
    const token = Token.attach(tokenAddress);

    console.log("--- Debugging Setup ---");
    console.log("Fund:", fundAddress);
    console.log("Token:", tokenAddress);
    console.log("Vendor:", vendor.address);
    console.log("Beneficiary:", beneficiary.address);

    // 2. Setup Conditions (Mimic User State)
    const catName = "Debug Category " + Date.now();
    await fund.addCategory(catName);
    const catId = await fund.categoryCount();
    console.log(`Created Category ${catId}: ${catName}`);

    await fund.whitelistBeneficiary(beneficiary.address, catId);
    await fund.whitelistVendor(vendor.address, catId);
    console.log("Whitelisted participants.");

    // Fund Beneficiary
    await token.mint(beneficiary.address, ethers.parseEther("500"));
    console.log("Funded Beneficiary with 500 rUSD");
    
    // IMPORTANT: Check Ownership
    const tokenOwner = await token.owner();
    console.log("Token Owner:", tokenOwner);
    if (tokenOwner !== fundAddress) {
        console.error("CRITICAL: Token owner is NOT Fund! TransferFrom will fail if logic relies on owner bypass.");
        // Try fixing it
        // await token.connect(deployer).transferOwnership(fundAddress);
    }

    // 3. Generate Signature
    const amount = ethers.parseEther("10");
    const nonce = Date.now();
    const message = `Authorize transfer of ${amount.toString()} rUSD to vendor. Nonce: ${nonce}`;
    
    console.log("Signing Message:", message);
    
    // Logic Match: 
    // Solidity: keccak256(bytes(message)).toEthSignedMessageHash()
    // Ethers v6: signer.signMessage(bytes) automatically adds prefix.
    
    // BUT Contract seems to interpret bytes memory signature.
    // If we use `keccak256` in frontend before signing, we must replicate that.
    
    const messageBytes = ethers.toUtf8Bytes(message);
    const messageHash = ethers.keccak256(messageBytes);
    
    // Sign the HASH (to match the viem fix we did)
    // Note: ethers.getBytes is needed if passing a hex string to signMessage to treat it as bytes
    const signature = await beneficiary.signMessage(ethers.getBytes(messageHash));
    
    console.log("Generated Signature:", signature);

    console.log("--- Executing Transaction ---");
    try {
        const tx = await fund.connect(vendor).processOfflineTransaction(
            beneficiary.address,
            amount,
            nonce,
            signature
        );
        console.log("Transaction sent, waiting...");
        await tx.wait();
        console.log("✅ Simulation SUCCESS!");
    } catch (e) {
        console.error("❌ Simulation FAILED");
        // Decode custom errors if possible
        if (e.reason) console.error("Revert Reason:", e.reason);
        else if (e.message) console.error("Error Message:", e.message);
    }
}

main().catch(console.error);
