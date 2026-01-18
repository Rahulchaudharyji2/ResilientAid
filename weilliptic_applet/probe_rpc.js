// import fetch from 'node-fetch'; // Native fetch used
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const baseUrl = "https://weelinknode1c.gw002.oneitfarm.com";
const paths = ["", "/rpc", "/jsonrpc", "/api", "/api/v1", "/sentinel", "/health"];

async function probe() {
    console.log("🔍 Probing RPC Paths...");
    
    for (const p of paths) {
        const url = baseUrl + p;
        // Try POST (RPC standard)
        try {
            console.log(`Trying POST: ${url}`);
            const res = await fetch(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "web3_clientVersion",
                    params: [],
                    id: 1
                })
            });
            console.log(`   Result: ${res.status} ${res.statusText}`);
            if (res.ok) console.log(`   ✅ POST SUCCESS!`);
        } catch (e) { console.log(`   ❌ POST Error: ${e.message}`); }

        // Try GET (REST/Health standard)
        try {
            console.log(`Trying GET: ${url}`);
            const res = await fetch(url);
            console.log(`   Result: ${res.status} ${res.statusText}`);
            if (res.ok) console.log(`   ✅ GET SUCCESS!`);
        } catch (e) { console.log(`   ❌ GET Error: ${e.message}`); }
    }
}

probe();
