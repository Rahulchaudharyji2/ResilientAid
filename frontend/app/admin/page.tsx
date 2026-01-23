"use client";
import { useState, useEffect } from 'react';
import { useWriteContract, useAccount, useReadContract, useReadContracts, usePublicClient, useChainId } from 'wagmi';
import { getContracts, RELIEF_FUND_ABI, RELIEF_PASS_ABI } from '../../config/contracts';
import { parseEther, formatEther } from 'viem';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageWrapper } from '../components/ui/PageWrapper';
import { motion } from 'framer-motion';
import { Plus, ArrowRightLeft, UserCheck, ShieldCheck, Send, RotateCcw, Wallet, Search } from 'lucide-react';

export default function AdminDashboard() {
  const { address } = useAccount();
  const [beneficiary, setBeneficiary] = useState('');
  const [vendor, setVendor] = useState('');
  const [status, setStatus] = useState('');
  const [faucetAmount, setFaucetAmount] = useState('1000');
  const [wauthAddr, setWauthAddr] = useState(''); 
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

  const [conversionRates, setConversionRates] = useState<{[key: string]: number}>({ 'ETH': 3000, 'BTC': 50000, 'SOL': 100 });
  
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
        } catch (e) {
            console.error("Oracle Fetch Failed, using fallback rates", e);
        }
    };
    fetchRates();
    const interval = setInterval(fetchRates, 30000); 
    return () => clearInterval(interval);
  }, []);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('1'); 

  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();
  const contracts = getContracts(chainId);

  const { data: catCount } = useReadContract({
      address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
      abi: RELIEF_FUND_ABI,
      functionName: 'categoryCount',
  });

  const [categories, setCategories] = useState<any[]>([]);

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
              if (result.status === 'success' && result.result && result.result[3] === true) { 
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
          setStatus(`Creating Category: ${newCategoryName}...`);
          
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

          setStatus(`Category '${newCategoryName}' Confirmed!`);
          setNewCategoryName('');
          setTimeout(() => { refetchCats(); }, 5000);
          
      } catch (error: any) {
          console.error(error);
          setStatus(`Error: ${error.shortMessage || error.message}`);
      }
  };

  const handleWhitelistBeneficiary = async () => {
    try {
      setStatus(`Whitelisting Beneficiary...`);
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
      setStatus(`Whitelisting Vendor...`);
      await writeContractAsync({
        address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
        abi: RELIEF_FUND_ABI,
        functionName: 'whitelistVendor',
        args: [vendor as `0x${string}`, BigInt(selectedCategory)],
      });
      setStatus('Vendor Whitelisted successfully!');
    } catch (error: any) {
        setStatus(`Error: ${error.shortMessage || error.message}`);
    }
  };

  return (
    <div className="min-h-screen pb-20 pt-24 bg-background text-text-primary">
      <Navbar />
      <PageWrapper>
      <div className="container mx-auto px-6">
          <header className="mb-12">
            <h1 className="text-4xl font-bold mb-2">Admin <span className="text-gradient">Console</span></h1>
            <p className="text-text-secondary">Manage campaigns, verifying entities, and distribute funds.</p>
          </header>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* STEP 1: Create Category */}
              <Card className="border-l-4 border-l-primary hover:border-l-primary">
                  <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Plus className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold">1. Create Campaign</h3>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase mb-2">Campaign Name</label>
                        <input 
                            placeholder="e.g. Flood Relief Fund" 
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:border-primary/50 focus:bg-white/15 outline-none transition-all text-white placeholder-slate-400"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleAddCategory} className="w-full">
                          Create Category
                      </Button>
                  </div>
                  
                  <div className="mt-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {categories.map(c => (
                          <div key={c.id} className="min-w-[140px] bg-surface-dark border border-white/5 rounded-lg p-3">
                              <div className="text-primary font-bold text-sm mb-1 truncate">#{c.id} {c.name}</div>
                              <div className="text-xs text-text-muted">Raised: {Number(formatEther(c.raised)).toFixed(1)}</div>
                          </div>
                      ))}
                  </div>
              </Card>

              {/* STEP 2: Liquidity Bridge */}
              <Card className="border-l-4 border-l-secondary hover:border-l-secondary">
                  <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                          <Wallet className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold">2. Liquidity Bridge</h3>
                  </div>

                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-text-muted uppercase mb-2">Target</label>
                            <select 
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full bg-surface-dark border border-white/10 rounded-lg px-4 py-3 outline-none text-white appearance-none"
                            >
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                <option value="1">General Fund</option>
                            </select>
                        </div>
                        <div>
                             <label className="block text-xs font-semibold text-text-muted uppercase mb-2">Asset</label>
                             <select id="swap-asset" className="w-full bg-surface-dark border border-white/10 rounded-lg px-4 py-3 outline-none text-white appearance-none">
                                 <option value="ETH">ETH ${conversionRates['ETH']?.toFixed(0)}</option>
                                 <option value="BTC">BTC ${conversionRates['BTC']?.toFixed(0)}</option>
                             </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                          <div className="flex-1">
                                <label className="block text-xs font-semibold text-text-muted uppercase mb-2">Amount</label>
                                <input 
                                    id="swap-amount"
                                    type="number"
                                    placeholder="1"
                                    defaultValue="1"
                                    className="w-full bg-surface-dark border border-white/10 rounded-lg px-4 py-3 outline-none text-white placeholder-gray-500"
                                    onChange={(e) => {
                                        const amt = e.target.value;
                                        const asset = (document.getElementById('swap-asset') as HTMLSelectElement).value;
                                        const price = conversionRates[asset] || 0;
                                        (document.getElementById('swap-output') as HTMLInputElement).value = (parseFloat(amt) * price).toFixed(2);
                                    }}
                                />
                          </div>
                          <div className="pt-6 text-text-muted">➜</div>
                          <div className="flex-1">
                                <label className="block text-xs font-semibold text-text-muted uppercase mb-2">rUSD</label>
                                <input 
                                    id="swap-output"
                                    readOnly
                                    placeholder="..."
                                    className="w-full bg-surface-dark border border-secondary/50 text-secondary font-bold rounded-lg px-4 py-3 outline-none"
                                />
                          </div>
                      </div>

                      <Button 
                        variant="secondary" 
                        className="w-full"
                        onClick={async () => {
                            const amount = (document.getElementById('swap-amount') as HTMLInputElement).value;
                            const asset = (document.getElementById('swap-asset') as HTMLSelectElement).value;
                            const rate = conversionRates[asset];
                            if (!rate) return alert("Oracle rates not loaded");
                            
                            const rUSD = parseFloat(amount) * rate;
                            if (!address) return alert("Connect Wallet!");
                            if (!amount) return;

                            setStatus(`Swapping ${amount} ${asset} -> ${rUSD} rUSD...`);
                            
                            try {
                                const txHash = await writeContractAsync({
                                    address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
                                    abi: RELIEF_FUND_ABI,
                                    functionName: 'distributeAid',
                                    args: [[address as `0x${string}`], parseEther(rUSD.toFixed(18))],
                                });
                                setStatus(`Success! Added ${rUSD.toFixed(2)} rUSD to Pool.`);
                            } catch (e: any) {
                                setStatus(`Swap Failed: ${e.message}`);
                            }
                        }}
                      >
                          Swap & Fund
                      </Button>
                  </div>
              </Card>

              {/* STEP 3: Whitelist & SBT */}
              <Card className="border-l-4 border-l-accent hover:border-l-accent lg:col-span-2">
                 <div className="flex flex-col md:flex-row gap-8">
                     <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-accent/10 text-accent">
                                <UserCheck className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold">3. Registration</h3>
                        </div>
                        
                        <div className="flex gap-4">
                            <input 
                                placeholder="Beneficiary Address (0x...)" 
                                value={beneficiary}
                                onChange={(e) => setBeneficiary(e.target.value)}
                                className="flex-1 bg-surface-dark border border-white/10 rounded-lg px-4 py-3 outline-none font-mono text-white placeholder-gray-500"
                            />
                            <select 
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="bg-surface-dark border border-white/10 rounded-lg px-4 outline-none w-32 text-white appearance-none"
                            >
                                {categories.map(c => <option key={c.id} value={c.id}>#{c.id}</option>)}
                            </select>
                        </div>
                        <Button onClick={handleWhitelistBeneficiary} className="w-full" variant="ghost">Authorize User</Button>
                     </div>

                     <div className="w-px bg-white/10 hidden md:block" />

                     <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold">4. Issue Identity</h3>
                        </div>
                        
                        <div className="p-4 bg-surface-dark rounded-lg border border-white/5 mb-4">
                            <span className="text-xs text-text-muted uppercase block mb-1">Target User</span>
                            <span className="font-mono text-sm break-all">{beneficiary || "Select User in Step 3"}</span>
                        </div>

                        <Button 
                            className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                            onClick={async () => {
                                if (!beneficiary) return setStatus("Enter Beneficiary Address");
                                if (!contracts.RELIEF_PASS_ADDRESS) return alert("Contract missing");
                                try {
                                    setStatus(`Issuing Relief Pass to ${beneficiary}...`);
                                    await writeContractAsync({
                                        address: contracts.RELIEF_PASS_ADDRESS as `0x${string}`,
                                        abi: RELIEF_PASS_ABI,
                                        functionName: 'mintPass',
                                        args: [beneficiary as `0x${string}`, "General Relief", BigInt(100), "https://example.com/metadata.json"],
                                    });
                                    setStatus(`Success! Soulbound ID issued.`);
                                } catch (e: any) { setStatus(`Failed: ${e.message}`); }
                            }}
                        >
                            Mint Soulbound ID
                        </Button>
                     </div>
                 </div>
              </Card>

              {/* STEP 5: Distribute Aid */}
              <Card className="border-l-4 border-l-yellow-500 hover:border-l-yellow-500">
                  <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                          <Send className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold">5. Distribute Aid</h3>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-semibold text-text-muted uppercase mb-2">Amount (rUSD)</label>
                          <input 
                                placeholder="1000" 
                                value={faucetAmount}
                                onChange={(e) => setFaucetAmount(e.target.value)}
                                className="w-full bg-surface-dark border border-white/10 rounded-lg px-4 py-3 outline-none font-bold text-lg text-white placeholder-gray-500"
                            />
                      </div>
                      <Button 
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                        onClick={async () => {
                            if (!beneficiary) return setStatus("Enter Beneficiary Address");
                            try {
                                 setStatus(`Distributing ${faucetAmount} rUSD...`);
                                 await writeContractAsync({
                                    address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
                                    abi: RELIEF_FUND_ABI,
                                    functionName: 'distributeAid',
                                    args: [[beneficiary as `0x${string}`], parseEther(faucetAmount)],
                                });
                                setStatus("Aid Distributed Successfully!");
                            } catch (e: any) { setStatus(`Error: ${e.shortMessage || e.message}`); }
                        }}
                      >
                          Send Funds
                      </Button>
                  </div>
              </Card>

              {/* Vendor Whitelist */}
              <Card className="border border-white/10">
                   <div className="flex items-center gap-3 mb-4 opacity-70">
                      <div className="p-2 rounded-lg bg-surface-light">
                          <RotateCcw className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold">Helper: Vendor Whitelist</h3>
                  </div>
                  <div className="flex gap-2">
                      <input 
                        placeholder="Vendor Address" 
                        value={vendor}
                        onChange={(e) => setVendor(e.target.value)}
                        className="flex-1 bg-surface-dark border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
                      />
                      <Button size="sm" variant="ghost" onClick={handleWhitelistVendor}>Add</Button>
                  </div>
              </Card>
          </div>

          {/* Weilliptic Integration */}
          <Card className="mt-8 border border-primary/20 bg-primary/5">
               <div className="flex flex-col md:flex-row items-center gap-6">
                   <div className="flex-1">
                       <h3 className="text-primary font-bold mb-2">Protocol Audit (Weilliptic Chain)</h3>
                       <p className="text-xs text-text-muted mb-4">Log immutable audit records to the hybrid chain.</p>
                       <input 
                         id="weilliptic-address"
                         placeholder="Applet Contract Address"
                         defaultValue="aaaaaaq2r4amkd4xqlhbhcwxnpu4ayw7ynp2quxor6ig7sulj4u47xivim"
                         className="w-full bg-surface-dark border border-primary/20 rounded-lg px-4 py-2 text-sm text-primary"
                       />
                   </div>
                   
                   <div className="flex flex-col items-end gap-2">
                       {!wauthAddr ? (
                           <Button 
                             variant="primary" 
                             onClick={() => {
                                 const addr = prompt("Enter Wauth Address manually for demo:");
                                 if (addr) setWauthAddr(addr);
                             }}
                           >
                               Connect Audit Wallet
                           </Button>
                       ) : (
                           <div className="text-right">
                               <div className="text-xs text-primary mb-2">Connected: {wauthAddr.slice(0,6)}...</div>
                               <Button 
                                variant="primary"
                                onClick={() => alert("✅ Log Signed on Weilliptic Chain (Simulated)")}
                               >
                                   ✍️ Sign Audit Log
                               </Button>
                           </div>
                       )}
                   </div>
               </div>
          </Card>

          {/* Status Toast */}
          {status && (
            <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-8 right-8 z-50 p-4 bg-surface border border-primary/50 text-white rounded-lg shadow-2xl backdrop-blur-md max-w-sm"
            >
                <p className="text-sm font-medium text-accent">{status}</p>
            </motion.div>
          )}

      </div>
      </PageWrapper>
    </div>
  );
}
