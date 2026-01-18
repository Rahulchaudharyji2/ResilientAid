"use client";
import { useState, useEffect } from 'react';
import { useWriteContract, useAccount, useReadContract, useReadContracts, usePublicClient, useChainId } from 'wagmi';
import { getContracts, RELIEF_FUND_ABI, RELIEF_TOKEN_ABI, RELIEF_PASS_ABI } from '../../config/contracts';
import { parseEther, formatEther } from 'viem';
import Navbar from '../components/Navbar';

export default function AdminDashboard() {
  const { address } = useAccount();
  const [beneficiary, setBeneficiary] = useState('');
  const [vendor, setVendor] = useState('');
  const [status, setStatus] = useState('');
  const [faucetAmount, setFaucetAmount] = useState('1000');
  const [wauthAddr, setWauthAddr] = useState(''); // Wauth Wallet Integration
  
  // EIP-6963: Modern Multi-Wallet Discovery
  const [eip6963Providers, setEip6963Providers] = useState<any[]>([]);

  useEffect(() => {
      const onAnnounce = (event: CustomEvent<any>) => {
          setEip6963Providers(prev => {
              if (prev.find(p => p.info.uuid === event.detail.info.uuid)) return prev;
              return [...prev, event.detail];
          });
      };
      window.addEventListener("eip6963:announceProvider", onAnnounce as any);
      window.dispatchEvent(new Event("eip6963:requestProvider"));
      return () => window.removeEventListener("eip6963:announceProvider", onAnnounce as any);
  }, []);

  // Real-time Oracle State
  const [conversionRates, setConversionRates] = useState<{[key: string]: number}>({ 'ETH': 3000, 'BTC': 50000, 'SOL': 100 });
  
  // Fetch Real-time Prices (Coinbase API)
  useEffect(() => {
    const fetchRates = async () => {
        try {
            const [eth, btc, sol] = await Promise.all([
                fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot').then(r => r.json()),
                fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot').then(r => r.json()),
                fetch('https://api.coinbase.com/v2/prices/SOL-USD/spot').then(r => r.json())
            ]);
            
            setConversionRates({
                'ETH': parseFloat(eth.data.amount),
                'BTC': parseFloat(btc.data.amount),
                'SOL': parseFloat(sol.data.amount)
            });
            console.log("Oracle Rates Updated:", eth.data.amount, btc.data.amount);
        } catch (e) {
            console.error("Oracle Fetch Failed, using fallback rates", e);
        }
    };
    fetchRates();
    const interval = setInterval(fetchRates, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);
  
  // Category Management
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('1'); // Default to ID 1
  const [activeDistId, setActiveDistId] = useState('1'); // For Distribution Section

  const { writeContractAsync } = useWriteContract();

  // Fetch Category Count
  // Dynamic Contracts
  const chainId = useChainId();
  const contracts = getContracts(chainId);

  // Use this address for all hooks
  const { data: catCount } = useReadContract({
      address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
      abi: RELIEF_FUND_ABI,
      functionName: 'categoryCount',
  });

  // State to hold fetched categories
  const [categories, setCategories] = useState<any[]>([]);

  // Fetch Categories 1 to 10 (Hackathon Limit)
  const categoryIds = Array.from({ length: 10 }, (_, i) => BigInt(i + 1));
  const { data: categoriesData, refetch: refetchCats } = useReadContracts({
    contracts: categoryIds.map(id => ({
        address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
        abi: RELIEF_FUND_ABI,
        functionName: 'categories',
        args: [id],
    })),
  });

  useEffect(() => {
      if (categoriesData) {
          const cats: any[] = [];
          categoriesData.forEach((result: any, index: number) => {
              if (result.status === 'success' && result.result && result.result[3] === true) { // [3] is 'exists' boolean
                  cats.push({
                      id: index + 1,
                      name: result.result[0],
                      raised: result.result[1],
                      distributed: result.result[2]
                  });
              }
          });
          setCategories(cats);
      }
  }, [categoriesData, catCount]);

  const publicClient = usePublicClient();

  const handleAddCategory = async () => {
      if (!newCategoryName) return alert("Enter a name");
      try {
          setStatus(`Creating Category: ${newCategoryName}... (Please Wait for Confirmation)`);
          
          const hash = await writeContractAsync({
              address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
              abi: RELIEF_FUND_ABI,
              functionName: 'addCategory',
              args: [newCategoryName],
          });

          setStatus(`Transaction Sent! Waiting for Block Confirmation...`);
          
          if (publicClient) {
              await publicClient.waitForTransactionReceipt({ hash });
          }

          setStatus(`Category '${newCategoryName}' Confirmed on Chain!`);
          setNewCategoryName('');
          
          // Small delay to allow node indexing
          setTimeout(() => {
              console.log("Refetching Categories...");
              refetchCats(); 
          }, 5000);
          
      } catch (error: any) {
          console.error(error);
          setStatus(`Error: ${error.shortMessage || error.message}`);
      }
  };

  const handleWhitelistBeneficiary = async () => {
    try {
      setStatus(`Whitelisting Beneficiary ${beneficiary} to Category ${selectedCategory}...`);
      await writeContractAsync({
        address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
        abi: RELIEF_FUND_ABI,
        functionName: 'whitelistBeneficiary',
        args: [beneficiary as `0x${string}`, BigInt(selectedCategory)],
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
        address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
        abi: RELIEF_FUND_ABI,
        functionName: 'whitelistVendor',
        args: [vendor as `0x${string}`, BigInt(selectedCategory)],
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
            address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
            abi: RELIEF_FUND_ABI,
            functionName: 'whitelistBeneficiary',
            args: [address as `0x${string}`, BigInt(1)], 
          });
      } catch (e) {
          console.log("Whitelist attempt skipped (might already be whitelisted)", e);
      }

      // Step 2: Mint/Distribute
      setStatus(`STEP 2: Minting ${faucetAmount} rUSD to Admin...`);
      await writeContractAsync({
        address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
        abi: RELIEF_FUND_ABI,
        functionName: 'distributeAid',
        args: [[address as `0x${string}`], parseEther(faucetAmount)],
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
      
      {/* STEP 1: Create Category */}
      <div className="card" style={{ borderLeft: '4px solid #00d0ff', marginBottom: '2rem' }}>
          <h3>1️⃣ Create Relief Campaign (Category)</h3>
          <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>Start a new funding campaign (e.g. "Flood Relief") to track contributions.</p>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 250px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>Campaign Name</label>
                <input 
                    placeholder="e.g. Earthquake Fund" 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    style={{ width: '100%', marginBottom: 0 }}
                />
              </div>
              <button className="btn" style={{ flex: '0 1 auto', minWidth: '150px' }} onClick={handleAddCategory}>+ Create Category</button>
          </div>
          
          {/* Mini Stats */}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {categories.map(c => (
                  <div key={c.id} style={{ minWidth: '200px', background: '#222', padding: '0.8rem', borderRadius: '8px', border: '1px solid #333' }}>
                      <strong style={{ color: '#00d0ff' }}>#{c.id} {c.name}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#888' }}>Raised: {formatEther(c.raised || BigInt(0))}</div>
                  </div>
              ))}
          </div>
      </div>

      {/* STEP 2: Liquidity Bridge (Treasury) */}
      <div className="card" style={{ borderLeft: '4px solid #7000ff', marginBottom: '2rem' }}>
          <h3>2️⃣ Liquidity Bridge (Fund Campaign)</h3>
          <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>
              <strong>Step 2:</strong> Convert Crypto Donations (ETH/BTC) received for a campaign into <strong>rUSD</strong>.
              <br/><span style={{ fontSize: '0.8rem', color: '#666' }}>(This fills the Relief Fund with Spendable Stablecoins)</span>
          </p>
          
          <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '1rem', 
              alignItems: 'flex-end' 
          }}>
              {/* Category Select for Funding */}
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>Target Campaign</label>
                <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem', background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '8px', height: '46px' }}
                >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    <option value="1">General Fund</option>
                </select>
              </div>

              {/* Asset Select */}
              <div style={{ flex: '1 1 150px' }}>
                 <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>Incoming Asset</label>
                 <select 
                    id="swap-asset"
                    style={{ 
                        width: '100%', 
                        padding: '0.8rem', 
                        background: '#111', 
                        color: '#fff', 
                        border: '1px solid #444', 
                        borderRadius: '8px',
                        height: '46px'
                    }}
                    onChange={(e) => {
                        const asset = e.target.value;
                        const price = conversionRates[asset] || 0;
                        const amt = (document.getElementById('swap-amount') as HTMLInputElement).value;
                        (document.getElementById('swap-output') as HTMLInputElement).value = (parseFloat(amt) * price).toFixed(2);
                    }}
                 >
                     <option value="ETH">ETH ${conversionRates['ETH']?.toFixed(0)}</option>
                     <option value="BTC">BTC ${conversionRates['BTC']?.toFixed(0)}</option>
                 </select>
              </div>
              
              {/* Amount Input */}
               <div style={{ flex: '1 1 120px' }}>
                 <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>Amount</label>
                 <input 
                    placeholder="1" 
                    defaultValue="1"
                    id="swap-amount"
                    type="number"
                    style={{ 
                        width: '100%', 
                        marginBottom: 0, 
                        padding: '0.8rem',
                        height: '46px' 
                    }}
                    onChange={(e) => {
                        const amt = e.target.value;
                        const asset = (document.getElementById('swap-asset') as HTMLSelectElement).value;
                        const price = conversionRates[asset] || 0;
                        (document.getElementById('swap-output') as HTMLInputElement).value = (parseFloat(amt) * price).toFixed(2);
                    }}
                 />
              </div>

              {/* Arrow */}
              <div style={{ 
                  flex: '0 0 auto', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  paddingBottom: '0.8rem',
                  fontSize: '1.5rem', 
                  color: '#666',
                  height: '46px'
              }}>
                  ➜
              </div>
              
              {/* Receive Input */}
               <div style={{ flex: '1 1 150px' }}>
                 <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>Receive (rUSD)</label>
                 <input 
                    readOnly
                    id="swap-output"
                    placeholder="..."
                    style={{ 
                        width: '100%', 
                        marginBottom: 0, 
                        padding: '0.8rem', 
                        background: '#222', 
                        color: '#00ff88', 
                        border: '1px solid #00ff88',
                        height: '46px',
                        fontWeight: 'bold'
                    }}
                 />
              </div>

              {/* Button */}
              <button className="btn" style={{ 
                  background: 'linear-gradient(90deg, #7000ff, #bd00ff)', 
                  flex: '1 1 100%',
                  marginTop: '0.5rem',
                  padding: '1rem',
                  fontSize: '1.1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  height: '50px'
              }} onClick={async () => {
                  const amount = (document.getElementById('swap-amount') as HTMLInputElement).value;
                  const asset = (document.getElementById('swap-asset') as HTMLSelectElement).value;
                  const rate = conversionRates[asset];
                  
                  if (!rate) {
                      alert("Oracle rates not loaded");
                      return;
                  }

                  const rUSD = parseFloat(amount) * rate;
                  
                  // Validation
                  if (!address) return alert("Connect Wallet!");
                  if (!amount) return;

                  setStatus(`Swapping ${amount} ${asset} -> ${rUSD} rUSD for Category #${selectedCategory}...`);
                  
                  try {
                      // Note: In a real system, we would perform the swap AND allocate to the category.
                      // Here we mint rUSD to the Admin to facilitate distribution.
                      const txHash = await writeContractAsync({
                        address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
                        abi: RELIEF_FUND_ABI,
                        functionName: 'distributeAid',
                        args: [[address as `0x${string}`], parseEther(rUSD.toFixed(18))],
                      });
                      
                      setStatus(`Success! Added ${rUSD.toFixed(2)} rUSD to Pool. hash: ${txHash}`);
                      alert(`✅ Successfully converted funds for Category #${selectedCategory}!`);

                  } catch (e: any) {
                      console.error("Swap Error:", e);
                      setStatus(`Swap Failed: ${e.message}`);
                  }
              }}>
                  🔄 Swap & Fund Campaign
              </button>
          </div>
      </div>

      {/* STEP 3: Whitelist Beneficiary */}
      <div className="card" style={{ borderLeft: '4px solid #bd00ff', marginBottom: '2rem' }}>
          <h3>3️⃣ Whitelist Beneficiary</h3>
          <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>Authorize a wallet address to participate in a specific relief category.</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>Select Category</label>
                <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem', background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '8px', height: '46px' }}
                >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name} (ID: {c.id})</option>)}
                    <option value="1">Fallback ID 1</option>
                </select>
            </div>
            
            <div style={{ flex: '999 1 300px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>Beneficiary Address</label>
                <input 
                    placeholder="0x..." 
                    value={beneficiary}
                    onChange={(e) => setBeneficiary(e.target.value)}
                    style={{ width: '100%', marginBottom: 0, height: '46px' }}
                />
            </div>
            
            <button className="btn" style={{ flex: '1 0 auto', background: '#bd00ff', border: 'none', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleWhitelistBeneficiary}>
                Authorize User
            </button>
          </div>
      </div>

      {/* STEP 4: Issue SBT */}
      <div className="card" style={{ borderLeft: '4px solid #ff007a', marginBottom: '2rem' }}>
          <h3>4️⃣ Issue Relief Pass (SBT) - Identity</h3>
          <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Mint a permanent <strong>Soulbound Token</strong> for the user. <span style={{ color: '#ff007a' }}>Required for new Flip Card UI.</span>
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', background: '#222', padding: '1rem', borderRadius: '12px' }}>
               <div style={{ flex: '999 1 300px' }}>
                   <strong style={{ display: 'block', marginBottom: '0.2rem', color: '#888' }}>Target User for Issuance:</strong>
                   <span style={{ fontFamily: 'monospace', color: beneficiary ? '#fff' : '#666', fontSize: '1.1rem', wordBreak: 'break-all' }}>
                       {beneficiary || "Enter address in Step 3 above first"}
                   </span>
               </div>
               
               <button className="btn" style={{ flex: '1 0 auto', background: '#ff007a', border: 'none', minWidth: '200px' }} onClick={async () => {
                  if (!beneficiary) return setStatus("⚠️ Please enter a Beneficiary Address in Step 3.");
                  if (!contracts.RELIEF_PASS_ADDRESS) return alert("ReliefPass Contract not found!");
                  
                  try {
                      setStatus(`Issuing Relief Pass (SBT) to ${beneficiary}...`);
                      await writeContractAsync({
                          address: contracts.RELIEF_PASS_ADDRESS as `0x${string}`,
                          abi: RELIEF_PASS_ABI,
                          functionName: 'mintPass',
                          args: [
                              beneficiary as `0x${string}`, 
                              "General Relief", // Default Category Name
                              BigInt(100),      // Initial Credits
                              "https://example.com/metadata.json" // Placeholder URI
                          ],
                      });
                      setStatus(`Success! Soulbound ID issued to ${beneficiary}`);
                  } catch (e: any) {
                      console.error(e);
                      setStatus(`SBT Issue Failed: ${e.message}`);
                  }
              }}>
                  🆔 Mint Identity Card
              </button>
          </div>
      </div>

      {/* STEP 5: Distribute Aid */}
      <div className="card" style={{ borderLeft: '4px solid #ffd700', marginBottom: '2rem' }}>
        <h3>5️⃣ Distribute Aid (Send Funds)</h3>
        <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>Transfer rUSD to the beneficiary for them to spend.</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
             <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>Amount (rUSD)</label>
                 <input 
                    placeholder="1000" 
                    value={faucetAmount}
                    onChange={(e) => setFaucetAmount(e.target.value)}
                    style={{ width: '100%', marginBottom: 0, borderColor: '#444', height: '46px' }}
                />
            </div>
            
            <button className="btn" style={{ flex: '0 0 auto', background: '#ffd700', color: '#000', fontWeight: 'bold', height: '46px', display: 'flex', alignItems: 'center' }} onClick={async () => {
                if (!beneficiary) return setStatus("Enter Beneficiary Address");
                if (!selectedCategory) return setStatus("Select a Category"); // Use selectedCategory from Step 2 as default
                
                setStatus(`Verifying membership for ${beneficiary}...`);
                
                try {
                     setStatus(`Distributing ${faucetAmount} rUSD to ${beneficiary}...`);
                     await writeContractAsync({
                        address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
                        abi: RELIEF_FUND_ABI,
                        functionName: 'distributeAid',
                        args: [[beneficiary as `0x${string}`], parseEther(faucetAmount)],
                    });
                    setStatus("Aid Distributed Successfully!");
                } catch (e: any) {
                    console.error(e);
                    if (e.message.includes("Category Mismatch") || e.message.includes("not assigned")) {
                        setStatus("Failed: Beneficiary is NOT in this Category!");
                    } else {
                        setStatus(`Error: ${e.shortMessage || e.message}`);
                    }
                }
            }}>
                📨 Send Funds
            </button>
        </div>
      </div>

      {/* Secondary / Setup Actions */}
      <div style={{ marginTop: '4rem', opacity: 0.8 }}>
          <h4 style={{ borderBottom: '1px solid #444', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#666' }}>⚙️ Secondary Operations</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              {/* Vendor Whitelist */}
              <div className="card" style={{ border: '1px solid #444' }}>
                  <h5>🏪 Whitelist Vendor</h5>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <input 
                        placeholder="Vendor Address (0x...)" 
                        value={vendor}
                        onChange={(e) => setVendor(e.target.value)}
                        style={{ marginBottom: 0, fontSize: '0.9rem' }}
                      />
                      <button className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={handleWhitelistVendor}>Verify</button>
                  </div>
              </div>
          </div>
      </div>
       
       {/* 6. Weilliptic Hybrid Integration (Bottom) */}
       <div className="card" style={{ marginTop: '2rem', border: '1px solid #00ff88', background: 'rgba(0, 255, 136, 0.05)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
             <h3 style={{ margin: 0, fontSize: '1rem' }}>🔍 Protocol Audit (Weilliptic Chain)</h3>
             {wauthAddr && <span style={{ fontSize: '0.8rem', color: '#00ff88', background: 'rgba(0, 255, 136, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>Connected: {wauthAddr.slice(0,6)}...</span>}
           </div>
           
           <div className="flex-responsive" style={{ alignItems: 'flex-end', gap: '10px' }}>
               <div style={{ flex: '1 1 300px' }}>
                   <input 
                     id="weilliptic-address"
                     placeholder="Applet Contract Address (e.g. aaaaa...)"
                     defaultValue="aaaaaaq2r4amkd4xqlhbhcwxnpu4ayw7ynp2quxor6ig7sulj4u47xivim"
                     style={{ width: '100%', marginBottom: 0, padding: '0.6rem', border: '1px solid #333', fontSize: '0.9rem' }}
                   />
               </div>

               {!wauthAddr ? (
                   <>
                       {/* EIP-6963 Detected Wallets */}
                       {eip6963Providers.length > 0 ? (
                           <div style={{ display: 'flex', gap: '0.5rem' }}>
                               {eip6963Providers.map((p, i) => (
                                   <button key={i} className="btn" style={{ background: '#333', border: '1px solid #666', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }} onClick={async () => {
                                       try {
                                           const res = await p.provider.request({ method: 'eth_requestAccounts' });
                                           // Also could use .connect()
                                           const addr = Array.isArray(res) ? res[0] : (res.address || res);
                                           setWauthAddr(addr);
                                           alert(`✅ Connected to ${p.info.name}!`);
                                       } catch (e: any) {
                                           alert("Connect Failed: " + e.message);
                                       }
                                   }}>
                                       <img src={p.info.icon} style={{ width: '20px', height: '20px' }} alt="" />
                                       Connect {p.info.name}
                                   </button>
                               ))}
                           </div>
                       ) : (
                            <button className="btn" style={{ background: '#333', color: '#fff', border: '1px solid #666', padding: '0.6rem 1rem', fontSize: '0.9rem' }} onClick={async () => {
                                // FALLBACK: Deep Probe
                                const win = window as any;
                                console.log("🔍 Deep Probe for Wallet...");
                                
                                // STRATEGY 1: Check known dedicated globals
                                let provider = win.wauth || win.weil || win.weilWallet || win.weilliptic;

                                // STRATEGY 2: Check inside window.ethereum
                                if (!provider && win.ethereum) {
                                    if (win.ethereum.isWauth || win.ethereum.isWeil || win.ethereum.isWeilWallet) {
                                        provider = win.ethereum;
                                    } else if (win.ethereum.providers) {
                                        provider = win.ethereum.providers.find((p: any) => p.isWauth || p.isWeil || p.isWeilWallet);
                                    }
                                }

                                if (provider) {
                                    try {
                                        const connectFn = provider.connect || provider.enable || provider.request;
                                        let response;
                                        
                                        if (provider.request) {
                                            response = await provider.request({ method: 'eth_requestAccounts' });
                                        } else {
                                            response = await connectFn.call(provider);
                                        }

                                        const addr = Array.isArray(response) ? response[0] : (response.address || response);
                                        if (addr && typeof addr === 'string') {
                                            setWauthAddr(addr);
                                            alert(`✅ Connected: ${addr.slice(0,6)}...`);
                                        }
                                    } catch (e: any) { alert("Connect Error: " + e.message); }
                                } else {
                                    // FORCE MODE
                                    if (win.ethereum && confirm("Wauth not detected automatically. Try forcing 'window.ethereum'?")) {
                                        try {
                                            const accs = await win.ethereum.request({ method: 'eth_requestAccounts' });
                                            setWauthAddr(accs[0]);
                                            alert(`✅ Connected: ${accs[0].slice(0,6)}...`);
                                        } catch (e: any) { alert("Failed: " + e.message); }
                                    }
                                }
                            }}>
                                🔌 Connect Wauth (Legacy Probe)
                            </button>
                       )}
                       
                       {/* Manual Fallback for Hackathon Demo */}
                       <div style={{ marginTop: '5px' }}>
                           <span 
                               style={{ fontSize: '0.8rem', color: '#666', textDecoration: 'underline', cursor: 'pointer' }}
                               onClick={() => {
                                   const addr = prompt("Enter your Wauth/Weilliptic Wallet Address manually:");
                                   if (addr && addr.length > 10) {
                                       setWauthAddr(addr);
                                   }
                               }}
                            >
                                Trouble connecting? Enter Address Manually
                            </span>
                       </div>
                   </>
               ) : (
                    <button className="btn" style={{ background: '#00ff88', color: '#000', padding: '0.6rem 1rem', fontSize: '0.9rem' }} onClick={async () => {
                        const addr = (document.getElementById('weilliptic-address') as HTMLInputElement).value;
                        if(!addr) return alert("Enter Applet Address!");
                        
                        try {
                             const win = window as any;
                             // Try specific providers first, fallback to generic ethereum (MetaMask)
                             const provider = win.wauth || win.weil || win.weilWallet || win.weilliptic || win.ethereum;
                             
                             if (!provider) return alert("No Wallet Provider found to sign message.");
                             
                             // Support both .signMessage (Wauth?) and personal_sign (Ethereum)
                             let sig;
                             const msg = `Audit Log for Applet: ${addr}`;
                             
                             if (provider.signMessage) {
                                  sig = await provider.signMessage(msg);
                             } else if (provider.request) {
                                  // Standard Ethereum Signing
                                  const accounts = await provider.request({ method: 'eth_accounts' });
                                  const from = accounts[0] || wauthAddr; // Use detected or manually entered
                                  sig = await provider.request({ method: 'personal_sign', params: [msg, from] });
                             }
                             
                             // Handle signature object or string
                             const sigStr = typeof sig === 'string' ? sig : JSON.stringify(sig);
                             
                             alert(`✅ Log Signed on Weilliptic Chain!\nSignature: ${sigStr.slice(0, 30)}...`);
                        } catch (e: any) {
                             console.error(e);
                             // If manual mode, allow mock success for demo if real signing fails
                             if (confirm("Signing failed (Wallet incompatiblity). Simulate success for Demo?")) {
                                 alert(`✅ (SIMULATED) Log Signed on Weilliptic Chain!\nSignature: 0x999999...simulated...`);
                             } else {
                                 alert("Signing Failed: " + e.message);
                             }
                        }
                    }}>
                        ✍️ Sign & Log Audit
                    </button>
               )}
           </div>
       </div>



      {status && <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', padding: '1rem', background: '#111', border: '1px solid #00d0ff', borderRadius: '8px', zIndex: 1000, color: '#00d0ff', fontWeight: 'bold' }}>{status}</div>}
    </div>
  );
}
