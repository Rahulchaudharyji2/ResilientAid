
import { WeilWallet } from '@weilliptic/weil-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'; // Load .env

// POLYFILL: Fix "toSorted is not a function" on older Node.js (WSL)
if (!Array.prototype.toSorted) {
    Array.prototype.toSorted = function(compareFn) {
        return this.slice().sort(compareFn);
    };
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Bypass expired cert check for Testnet

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("🚀 Starting Weilliptic SDK Deployment...");

    // 1. Setup Wallet (Check for Real Credentials)
    const REAL_KEY = process.env.WEILLIPTIC_PRIVATE_KEY;
    const REAL_RPC = process.env.WEILLIPTIC_RPC_URL;

    // Default to Mock execution if credentials are missing
    let privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
    let sentinelUrl = "http://localhost:8000";
    let isMock = true;

    if (REAL_KEY && REAL_RPC) {
        console.log("✅ Real Credentials Detected! Switching to LIVE Deployment Mode.");
        privateKey = REAL_KEY;
        sentinelUrl = REAL_RPC;
        isMock = false;
    } else {
        console.warn("⚠️ No .env credentials found (WEILLIPTIC_PRIVATE_KEY, WEILLIPTIC_RPC_URL).");
        console.warn("🛠️ Defaulting to MOCK Mode (Simulation Only).");
    }

    console.log(`🔌 Connecting to Sentinel at ${sentinelUrl}...`);
    
    try {
        const wallet = new WeilWallet({
            privateKey: privateKey,
            sentinelEndpoint: sentinelUrl
        });

        // 2. Load WASM & WIDL
        const wasmPath = path.join(__dirname, 'target/wasm32-unknown-unknown/release/audit_log.wasm');
        const widlPath = path.join(__dirname, 'audit.widl');

        if (!fs.existsSync(wasmPath) || !fs.existsSync(widlPath)) {
            console.error(`❌ Missing Files!`);
            console.error(`Checking: ${wasmPath}`);
            console.error(`Checking: ${widlPath}`);
            return;
        }

        const wasmBuffer = fs.readFileSync(wasmPath);
        const widlBuffer = fs.readFileSync(widlPath);
        
        // CONVERSION: SDK likely expects HEX strings, not Buffers (Fixes 417 Expectation Failed)
        const wasmHex = wasmBuffer.toString('hex');
        const widlHex = widlBuffer.toString('hex');

        console.log(`📦 Loaded WASM: ${wasmBuffer.length} bytes (Converted to Hex)`);
        console.log(`📜 Loaded WIDL: ${widlBuffer.length} bytes (Converted to Hex)`);

        // 3. Deploy
        console.log(isMock ? "📤 Simulating Deployment..." : "📤 Deploying Applet to Weilliptic Chain...");
        
        try {
            if (isMock) {
                // Determineistic Mock Delay
                await new Promise(r => setTimeout(r, 1000));
                throw new Error("Simulated Network Unreachable"); 
            }

            // CORRECT API: wallet.contracts.deploy(wasm, widl, options)
            // Attempting with 'pods' array based on SDK source hints
            const result = await wallet.contracts.deploy(wasmHex, widlHex, { pods: ['POD_364bd4c435aa46bc8c48f92268daeadc'] });
            
            console.log(`✅ Deployment Success!`);
            console.log(`📄 Contract Address: ${result.address || result.contractId || JSON.stringify(result)}`);
            
        } catch (netErr) {
            if (!isMock) {
                console.error("❌ Real Deployment Failed:", netErr.message);
                return; // Don't fall back to mock if user wanted real deployment
            }

            console.warn(`⚠️ Network unreachable (Expected in Mock Mode).`);
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

