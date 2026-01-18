// Native fetch used
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Note: OneITFarm is likely hosting on standard ports, but Sentinel usually runs on 8000
const host = "weelinknode1c.gw002.oneitfarm.com";
const ports = [443, 80, 8000, 8080, 9933, 9944, 3000, 5000];
const path = "/jsonrpc"; // Trying a standard path

async function probe() {
    console.log(`🔍 Probing Ports on ${host}...`);
    
    for (const port of ports) {
        const protocol = (port === 443) ? "https" : "http";
        const url = `${protocol}://${host}:${port}`;
        
        console.log(`Checking ${url}...`);
        try {
            // Short timeout to fail fast
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const res = await fetch(url + path, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({jsonrpc:'2.0',method:'web3_clientVersion',params:[],id:1}),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            console.log(`   Result: ${res.status} ${res.statusText}`);
            if (res.ok) console.log(`   ✅ SUCCESS!`);
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
        }
    }
}

probe();
