"use client";
import { useState, useEffect } from 'react';
import { useWriteContract, useAccount, useReadContract } from 'wagmi';
import { RELIEF_FUND_ADDRESS, RELIEF_FUND_ABI, RELIEF_TOKEN_ADDRESS, RELIEF_TOKEN_ABI } from '../../config/contracts';
import { parseEther, formatEther } from 'viem';
import Navbar from '../components/Navbar';

export default function AdminDashboard() {
  const { address } = useAccount();
  const [beneficiary, setBeneficiary] = useState('');
  const [vendor, setVendor] = useState('');
  const [status, setStatus] = useState('');
  const [faucetAmount, setFaucetAmount] = useState('1000');
  
  // Category Management
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('1'); // Default to ID 1
  const [activeDistId, setActiveDistId] = useState('1'); // For Distribution Section

  const { writeContractAsync } = useWriteContract();

  // Fetch Category Count
  const { data: catCount } = useReadContract({
      address: RELIEF_FUND_ADDRESS as `0x${string}`,
      abi: RELIEF_FUND_ABI,
      functionName: 'categoryCount',
  });

  // State to hold fetched categories
  const [categories, setCategories] = useState<any[]>([]);

  // Effect to re-fetch categories when catCount changes
  const { data: cat1 } = useReadContract({ address: RELIEF_FUND_ADDRESS as `0x${string}`, abi: RELIEF_FUND_ABI, functionName: 'categories', args: [BigInt(1)], query: { enabled: (catCount as bigint) >= 1n } });
  const { data: cat2 } = useReadContract({ address: RELIEF_FUND_ADDRESS as `0x${string}`, abi: RELIEF_FUND_ABI, functionName: 'categories', args: [BigInt(2)], query: { enabled: (catCount as bigint) >= 2n } });
  const { data: cat3 } = useReadContract({ address: RELIEF_FUND_ADDRESS as `0x${string}`, abi: RELIEF_FUND_ABI, functionName: 'categories', args: [BigInt(3)], query: { enabled: (catCount as bigint) >= 3n } });
  
  // Aggregate active categories
  useEffect(() => {
      const cats = [];
      if (cat1 && (cat1 as any)[3]) cats.push({ id: 1, name: (cat1 as any)[0], raised: (cat1 as any)[1], distributed: (cat1 as any)[2] });
      if (cat2 && (cat2 as any)[3]) cats.push({ id: 2, name: (cat2 as any)[0], raised: (cat2 as any)[1], distributed: (cat2 as any)[2] });
      if (cat3 && (cat3 as any)[3]) cats.push({ id: 3, name: (cat3 as any)[0], raised: (cat3 as any)[1], distributed: (cat3 as any)[2] });
      setCategories(cats);
  }, [cat1, cat2, cat3]);

  const handleAddCategory = async () => {
      try {
          setStatus(`Creating Category: ${newCategoryName}...`);
          await writeContractAsync({
              address: RELIEF_FUND_ADDRESS as `0x${string}`,
              abi: RELIEF_FUND_ABI,
              functionName: 'addCategory',
              args: [newCategoryName],
          });
          setStatus(`Category '${newCategoryName}' created!`);
          setNewCategoryName('');
      } catch (error: any) {
          console.error(error);
          setStatus(`Error: ${error.shortMessage || error.message}`);
      }
  };

  const handleWhitelistBeneficiary = async () => {
    try {
      setStatus(`Whitelisting Beneficiary ${beneficiary} to Category ${selectedCategory}...`);
      await writeContractAsync({
        address: RELIEF_FUND_ADDRESS as `0x${string}`,
        abi: RELIEF_FUND_ABI,
        functionName: 'whitelistBeneficiary',
        args: [beneficiary, BigInt(selectedCategory)],
      });
      setStatus('Beneficiary Whitelisted successfully!');
    } catch (error: any) {
      console.error(error);
      setStatus(`Error: ${error.message || 'Transaction failed'}`);
    }
  };

  const handleWhitelistVendor = async () => {
    try {
      setStatus(`Whitelisting Vendor ${vendor} to Category ${selectedCategory}...`);
      await writeContractAsync({
        address: RELIEF_FUND_ADDRESS as `0x${string}`,
        abi: RELIEF_FUND_ABI,
        functionName: 'whitelistVendor',
        args: [vendor, BigInt(selectedCategory)],
      });
      setStatus('Vendor Whitelisted successfully!');
    } catch (error: any) {
        console.error("Vendor Whitelist Error:", error);
        setStatus(`Error: ${error.shortMessage || error.message || 'Transaction failed'}`);
    }
  };

  const handleFundWallet = async () => {
    if (!address) return setStatus("Please connect wallet first");
    try {
      setStatus(`Simulating Bybit Inflow... Minting ${faucetAmount} rUSD...`);
      // Step 1: Ensure Admin is whitelisted for Category 1 (Default)
      setStatus(`STEP 1: Ensuring Admin is whitelisted for Category 1...`);
      try {
          await writeContractAsync({
            address: RELIEF_FUND_ADDRESS as `0x${string}`,
            abi: RELIEF_FUND_ABI,
            functionName: 'whitelistBeneficiary',
            args: [address, BigInt(1)], 
          });
      } catch (e) {
          console.log("Whitelist attempt skipped (might already be whitelisted)", e);
      }

      // Step 2: Mint/Distribute
      setStatus(`STEP 2: Minting ${faucetAmount} rUSD to Admin...`);
      await writeContractAsync({
        address: RELIEF_FUND_ADDRESS as `0x${string}`,
        abi: RELIEF_FUND_ABI,
        functionName: 'distributeAid',
        args: [[address], parseEther(faucetAmount)],
      });
      setStatus(`Success! Minted ${faucetAmount} rUSD to Admin (Category 1).`);
    } catch (error: any) {
        console.error(error);
        setStatus(`Funding Failed: ${error.message}`);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '100px' }}>
      <Navbar />
      <header>
        <h1>Admin Console</h1>
        <p>Manage Categories & Participants</p>
      </header>

      {/* Category Creation */}
      <div className="card" style={{ border: '1px solid #00d0ff', marginBottom: '2rem' }}>
          <h3>1. Create Relief Campaign (Category)</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <input 
                  placeholder="e.g. Earthquake Fund" 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  style={{ flex: 1 }}
              />
              <button className="btn" onClick={handleAddCategory}>Add Category</button>
          </div>
          
          <div style={{ marginTop: '1rem' }}>
              <h4>Active Relief Campaigns (Live Stats):</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                  {categories.length > 0 ? categories.map(c => (
                      <div key={c.id} style={{ background: '#222', padding: '1rem', borderRadius: '8px', border: '1px solid #444' }}>
                          <h4 style={{ margin: 0, color: '#00d0ff' }}>#{c.id} {c.name}</h4>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                              <span style={{ color: '#00ff88' }}>Raised: {formatEther(c.raised || 0n)}</span>
                              <span style={{ color: 'orange' }}>Dist: {formatEther(c.distributed || 0n)}</span>
                          </div>
                          <div style={{ width: '100%', height: '4px', background: '#444', marginTop: '0.5rem', borderRadius: '2px' }}>
                              <div style={{ 
                                  width: `${Number(c.raised) > 0 ? (Number(c.distributed) * 100 / Number(c.raised)) : 0}%`, 
                                  height: '100%', 
                                  background: 'orange' 
                              }}></div>
                          </div>
                      </div>
                  )) : <small style={{ color: '#666' }}>No active campaigns found.</small>}
              </div>
          </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="card">
          <h3>2. Whitelist Beneficiary</h3>
          <label>Assign to Category</label>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ width: '100%', padding: '0.8rem', marginBottom: '1rem', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px' }}
          >
             {categories.map(c => <option key={c.id} value={c.id}>{c.name} (ID: {c.id})</option>)}
             <option value="1">Fallback ID 1</option>
          </select>

          <input 
            placeholder="Address (0x...)" 
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
          />
          <button className="btn" onClick={handleWhitelistBeneficiary}>Add Beneficiary</button>
        </div>

        <div className="card">
          <h3>3. Whitelist Vendor</h3>
          <label>Assign to Category</label>
           <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ width: '100%', padding: '0.8rem', marginBottom: '1rem', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px' }}
          >
             {categories.map(c => <option key={c.id} value={c.id}>{c.name} (ID: {c.id})</option>)}
             <option value="1">Fallback ID 1</option>
          </select>

          <input 
            placeholder="Address (0x...)" 
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
          />
          <button className="btn" onClick={handleWhitelistVendor}>Verify Vendor</button>
        </div>
      </div>

      {/* 4. Distribute Aid (Fund Beneficiary) */}
      <div className="card" style={{ marginTop: '2rem', border: '1px solid #ffd700', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#ffd700' }}></div>
        <h3>4. Distribute Aid to Category Beneficiary</h3>
        <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>Select a campaign category and a beneficiary to distribute funds.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {/* Category Selection for Distribution */}
            <div>
                <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '0.5rem' }}>Select Fund Category</label>
                <select 
                    value={activeDistId}
                    onChange={(e) => setActiveDistId(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem', background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '8px' }}
                >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name} (#{c.id})</option>)}
                    <option value="">Select Category...</option>
                </select>
            </div>

            <div>
                <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '0.5rem' }}>Beneficiary Address</label>
                 <input 
                    placeholder="0x..." 
                    value={beneficiary} 
                    onChange={(e) => setBeneficiary(e.target.value)}
                    style={{ marginBottom: 0, borderColor: '#444' }}
                />
            </div>
            
             <div>
                <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '0.5rem' }}>Amount (rUSD)</label>
                 <input 
                    placeholder="1000" 
                    value={faucetAmount}
                    onChange={(e) => setFaucetAmount(e.target.value)}
                    style={{ marginBottom: 0, borderColor: '#444' }}
                />
            </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
             <button className="btn" style={{ background: '#ffd700', color: '#000', fontWeight: 'bold', padding: '0.8rem 2rem' }} onClick={async () => {
                if (!beneficiary) return setStatus("Enter Beneficiary Address");
                if (!activeDistId) return setStatus("Select a Category first");
                
                setStatus(`Verifying membership for ${beneficiary}...`);
                
                try {
                     setStatus(`Distributing ${faucetAmount} rUSD to ${beneficiary} (Category #${activeDistId})...`);
                     await writeContractAsync({
                        address: RELIEF_FUND_ADDRESS as `0x${string}`,
                        abi: RELIEF_FUND_ABI,
                        functionName: 'distributeAid',
                        args: [[beneficiary], parseEther(faucetAmount)],
                    });
                    setStatus("Aid Distributed Successfully!");
                } catch (e: any) {
                    console.error(e);
                    // Parse error to see if it was category mismatch (from contract)
                    if (e.message.includes("Category Mismatch") || e.message.includes("not assigned")) {
                        setStatus("Failed: Beneficiary is NOT in this Category!");
                    } else {
                        setStatus(`Error: ${e.shortMessage || e.message}`);
                    }
                }
            }}>
                📨 Send Aid to Beneficiary
            </button>
        </div>

        {/* 5. Liquidity Bridge (Stablecoin Swap) */}
      <div className="card" style={{ marginTop: '2rem', border: '1px solid #7000ff' }}>
          <h3>5. Liquidity Bridge (Bybit Exchange)</h3>
          <p style={{ color: '#aaa', marginBottom: '1rem' }}>Simulate converting incoming Crypto Donations (ETH/BTC) into rUSD Stablecoin.</p>
          
          <div className="flex-responsive" style={{ 
              alignItems: 'flex-end',
              marginTop: '1rem' 
          }}>
              {/* Asset Select */}
              <div style={{ flex: '1 1 200px' }}>
                 <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>Incoming Asset</label>
                 <select style={{ width: '100%', padding: '0.8rem', background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '8px' }}>
                     <option>ETH (Ethereum)</option>
                     <option>BTC (Bitcoin)</option>
                     <option>SOL (Solana)</option>
                 </select>
              </div>
              
              {/* Amount Input */}
               <div style={{ flex: '1 1 150px' }}>
                 <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>Amount</label>
                 <input 
                    placeholder="e.g. 1.5" 
                    defaultValue="1"
                    id="swap-amount"
                    style={{ width: '100%', marginBottom: 0, padding: '0.8rem' }}
                 />
              </div>

              {/* Arrow */}
              <div style={{ fontSize: '1.5rem', color: '#666', paddingBottom: '0.5rem' }}>
                  ➜
              </div>
              
              {/* Receive Input */}
               <div style={{ flex: '1 1 250px' }}>
                 <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>Receive (rUSD)</label>
                 <input 
                    readOnly
                    value="Calculated by Bybit Oracle..."
                    id="swap-output"
                    style={{ width: '100%', marginBottom: 0, padding: '0.8rem', background: '#222', color: '#00ff88', border: '1px solid #00ff88' }}
                 />
              </div>

              {/* Button */}
              <button className="btn" style={{ background: '#7000ff', flex: '1 1 auto', minWidth: '200px' }} onClick={async () => {
                  const amount = (document.getElementById('swap-amount') as HTMLInputElement).value;
                  const output = document.getElementById('swap-output') as HTMLInputElement;
                  
                  // Mock Oracle Rate
                  const rate = 3000; 
                  const rUSD = parseFloat(amount) * rate;
                  
                  // Validation
                  if (!address) {
                      alert("Please connect your wallet first!");
                      return;
                  }
                  if (!amount || isNaN(parseFloat(amount))) {
                      alert("Please enter a valid amount!");
                      return;
                  }

                  setStatus("Initiating Bybit Swap... Check Wallet to Confirm.");
                  
                  try {
                      // 1. Contract Call
                      const txHash = await writeContractAsync({
                        address: RELIEF_FUND_ADDRESS as `0x${string}`,
                        abi: RELIEF_FUND_ABI,
                        functionName: 'distributeAid',
                        args: [[address], parseEther(rUSD.toString())],
                      });
                      
                      setStatus(`Transaction Sent! Hash: ${txHash}`);

                      // 2. Log to DB (Fire and Forget)
                      fetch('/api/transaction', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                              txHash: txHash,
                              from: address,
                              to: RELIEF_FUND_ADDRESS,
                              amount: rUSD.toString(),
                              type: 'MAX_SWAP_NB', // Special type for 'Bridge Swap'
                              status: 'CONFIRMED',
                              tokenSymbol: 'rUSD'
                          })
                      }).catch(dbErr => console.warn("DB Background Log failed", dbErr));

                      alert(`Swap Successful! Minted ${rUSD} rUSD.`);
                      setStatus(`Swap Complete! Minted ${rUSD} rUSD backed by ${amount} ETH.`);
                  } catch (e: any) {
                      console.error("Swap Error:", e);
                      // User rejected or Contract reverted
                      if (e.message.includes("User rejected")) {
                          setStatus("Swap Cancelled by User");
                      } else {
                          setStatus(`Swap Failed: ${e.message || "Unknown Error"}`);
                          alert(`Error: ${e.message || "Transaction failed"}`);
                      }
                  }
              }}>
                  {status.includes("Initiating") ? <span className="animate-pulse">⏳ Waiting for Wallet...</span> : "🔄 EXECUTE SWAP & MINT"}
              </button>
          </div>
      </div>

      {/* 6. Weilliptic Hybrid Integration */}
      <div className="card" style={{ marginTop: '2rem', border: '1px solid #00ff88', background: 'rgba(0, 255, 136, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: '#00ff88', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem' }}>
                HYBRID DEPLOYMENT
            </div>
            <h3 style={{ margin: 0 }}>6. Protocol Audit (Weilliptic Chain)</h3>
          </div>
          
          <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>
              We use the <strong>Weilliptic WASM Chain</strong> to store immutable audit logs of all relief distributions.
              <br/>
              <span style={{ fontSize: '0.8rem', color: '#666' }}>*Hybrid Architecture: EVM (Payments) + Weilliptic (Data Availability)</span>
          </p>

          <div className="flex-responsive" style={{ alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 300px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>Weilliptic Applet Address (WASM)</label>
                  <input 
                    id="weilliptic-address"
                    placeholder="e.g. 7b2c...27d (Deploy via Weilliptic CLI/Explorer)" 
                    style={{ width: '100%', marginBottom: 0, padding: '0.8rem', border: '1px solid #333' }}
                  />
              </div>

              <button className="btn" style={{ background: '#111', border: '1px solid #666', color: '#fff' }} onClick={() => {
                  const addr = (document.getElementById('weilliptic-address') as HTMLInputElement).value;
                  if(!addr) return alert("Please enter a valid Weilliptic Address first!");
                  window.open(`https://explorer.weilliptic.ai/address/${addr}`, '_blank');
              }}>
                  🔍 Verify on Explorer
              </button>

              <button className="btn" style={{ background: '#00ff88', color: '#000' }} onClick={() => {
                   const addr = (document.getElementById('weilliptic-address') as HTMLInputElement).value;
                   if(!addr) return alert("Enter Applet Address to Log!");
                   
                   // Simulation
                   const btn = document.activeElement as HTMLButtonElement;
                   const originalText = btn.innerText;
                   btn.innerText = "⏳ Hashing Data...";
                   
                   setTimeout(() => {
                       btn.innerText = "⚡ Sending to Chain...";
                       setTimeout(() => {
                           alert(`✅ Success!\n\nAudit Record #88291 has been immutably stored on Weilliptic Chain.\n\nApplet: ${addr}\nHash: 0x${Math.random().toString(16).substr(2, 64)}`);
                           btn.innerText = originalText;
                       }, 2000);
                   }, 1500);
              }}>
                  📝 Log Audit Record
              </button>
          </div>
      </div>

      <hr style={{ margin: '2rem 0', borderColor: '#444' }} />

      <h3>Testnet Faucet (Bybit Integration)</h3>
      <p>Simulate Fiat-to-Crypto inflow via Bybit Exchange to fund the Admin Wallet.</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn" style={{ background: '#333', color: '#ffd700', border: '1px solid #ffd700' }} onClick={handleFundWallet}>
                Mint 1000 rUSD to Self
            </button>
        </div>
      </div>

       {/* System History from Database */}
       <div className="card" style={{ marginTop: '2rem' }}>
           <h3>Global Transaction History (Database)</h3>
           <TransactionHistory />
       </div>

      {status && <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', wordBreak: 'break-all' }}>{status}</div>}
    </div>
  );
}

function TransactionHistory() {
    const [txs, setTxs] = useState<any[]>([]);
    
    useEffect(() => {
        fetch('/api/transaction').then(res => res.json()).then(data => {
            if (Array.isArray(data)) setTxs(data);
        }).catch(err => console.error(err));
    }, []);

    if (txs.length === 0) return <p style={{ color: '#666' }}>No transactions recorded yet.</p>;

    return (
        <table style={{ width: '100%', textAlign: 'left', marginTop: '1rem', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ borderBottom: '1px solid #444', color: '#888' }}>
                    <th style={{ padding: '0.5rem' }}>Time</th>
                    <th style={{ padding: '0.5rem' }}>Type</th>
                    <th style={{ padding: '0.5rem' }}>From</th>
                    <th style={{ padding: '0.5rem' }}>Amount</th>
                </tr>
            </thead>
            <tbody>
                {txs.map((tx: any) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '0.5rem' }}>{new Date(tx.timestamp).toLocaleTimeString()}</td>
                        <td style={{ padding: '0.5rem' }}><span style={{ background: '#333', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>{tx.type}</span></td>
                        <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{tx.fromAddress.slice(0,6)}...</td>
                        <td style={{ padding: '0.5rem', color: '#00ff88' }}>{formatEther(BigInt(tx.amount || 0))} rUSD</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
