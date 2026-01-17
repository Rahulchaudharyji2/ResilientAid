

import { WeilWallet } from '@weilliptic/weil-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("🚀 Starting Weilliptic SDK Deployment...");

    // 1. Setup Wallet (Mocking Private Key for Demo)
    const PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000001"; 
    const SENTINEL_URL = "http://localhost:8000"; 

    console.log(`🔌 Connecting to Sentinel at ${SENTINEL_URL}...`);
    
    try {
        const wallet = new WeilWallet({
            privateKey: PRIVATE_KEY,
            sentinelEndpoint: SENTINEL_URL
        });

        // 2. Load WASM
        const wasmPath = path.join(__dirname, 'target/wasm32-unknown-unknown/release/audit_log.wasm');
        if (!fs.existsSync(wasmPath)) {
            console.error(`❌ WASM file not found at: ${wasmPath}`);
            console.error(`👉 Solution: Run 'cargo build --target wasm32-unknown-unknown --release' first.`);
            return;
        }
        const wasmBuffer = fs.readFileSync(wasmPath);
        console.log(`📦 Loaded WASM: ${wasmBuffer.length} bytes`);

        // 3. Deploy
        console.log("📤 Deploying Applet to Weilliptic Chain...");
        
        try {
            const result = await wallet.deploy(wasmBuffer);
            console.log(`✅ Deployment Success!`);
            console.log(`📄 Contract Address: ${result.address}`);
        } catch (netErr) {
            console.warn(`⚠️ Network unreachable (Expected if no local node).`);
            console.warn(`🛠️ Mocking Deployment Success for Demo Script...`);
            
            // Generate a deterministic mock address for the demo
            console.log(`✅ [MOCK] Deployment Success!`);
            console.log(`📄 Contract Address: 7b2c9e7d30f8823ec1ce7e3c6ff2600500afa0e58eb59a1572afd25d0d4d16eb7`);
        }

    } catch (e) {
        console.error("❌ SDK Error:", e.message);
    }
}

main();

