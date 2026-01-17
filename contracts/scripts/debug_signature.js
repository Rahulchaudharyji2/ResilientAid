
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    // Test Data from User Error Log
    const amountStr = "10000000000000000000"; // 10 rUSD
    const nonce = 1768667490307; // From log
    
    console.log("--- Debugging Signature Mismatch ---");

    // 1. Reconstruct Message (Solidity Style) with Strings lib simulation
    // "Authorize transfer of " + amount + " rUSD to vendor. Nonce: " + nonce
    const message = `Authorize transfer of ${amountStr} rUSD to vendor. Nonce: ${nonce}`;
    console.log("Message String:", message);

    // 2. Hash Calculation (Solidity: keccak256(bytes(message)))
    const messageBytes = ethers.toUtf8Bytes(message);
    const messageHash = ethers.keccak256(messageBytes);
    console.log("Message Hash (Solidity keccak256):", messageHash);

    // 3. Frontend Approach (Current Implementation)
    // const msgHash = keccak256(toBytes(message)); -> matches messageHash above
    // signMessage({ raw: msgHash }) 
    
    // Simulate Signing the Hash
    // Ethers `signMessage` with bytes automatically adds prefix:
    // \x19Ethereum Signed Message:\n32 + hash
    const signature = await deployer.signMessage(ethers.getBytes(messageHash));
    console.log("Generated Signature:", signature);

    // 4. Verification (Recover)
    const splitSig = ethers.Signature.from(signature);
    
    // To recover, we need the "Eth Signed Message Hash" of the input we signed.
    // If we signed 'messageHash' bytes:
    // Prefixed = hash(prefix + messageHash)
    
    const ethSignedMessageHash = ethers.hashMessage(ethers.getBytes(messageHash));
    console.log("Eth Signed Message Hash:", ethSignedMessageHash);
    
    const recovered = ethers.recoverAddress(ethSignedMessageHash, signature);
    console.log("Recovered Address:", recovered);
    console.log("Expected Address:", deployer.address);
    
    if (recovered === deployer.address) {
        console.log("✅ Simulation Matches Ethers Logic");
    } else {
        console.log("❌ Simulation MISMATCH");
    }

    // 5. Test against Contract Logic
    const ReliefFund = await ethers.getContractFactory("ReliefFund");
    // Just deploy a mock or attach to existing to test `getMessageHash`?
    // Let's assume we can attach to existing since we know address
    const fund = ReliefFund.attach("0xc5a5C42992dECbae36851359345FE25997F5C42d");
    
    try {
        // Contract has getMessageHash(uint, uint) -> bytes32
        // It returns keccak256(bytes(msg))
        // amount is uint256, nonce is uint256
        const contractHash = await fund.getMessageHash(amountStr, nonce);
        console.log("Contract getMessageHash:", contractHash);
        
        if (contractHash === messageHash) {
             console.log("✅ JS String construction matches Solidity Strings.toString()");
        } else {
             console.log("❌ String Construction MISMATCH!");
             console.log("JS Msg:", message);
             // Maybe Solidity toString() behaves differently?
        }
    } catch (e) {
        console.warn("Could not call contract view function (network issue?)", e.message);
    }
}

main().catch(console.error);
