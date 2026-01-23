"use client";
import { useState, useEffect } from 'react';
import { useChainId, useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { getContracts, RELIEF_FUND_ABI } from '../../config/contracts';
import { formatEther, parseEther } from 'viem';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageWrapper } from '../components/ui/PageWrapper';
import { Heart, Activity, ArrowUpRight, TrendingUp, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DonorDashboard() {
  const { address } = useAccount();
  const [donateAmounts, setDonateAmounts] = useState<{[key: number]: string}>({});
  const [status, setStatus] = useState('');
  
  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();
  const contracts = getContracts(chainId);

  // Fetch Category Count
  const { data: catCount } = useReadContract({
      address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
      abi: RELIEF_FUND_ABI,
      functionName: 'categoryCount',
  });

  // State to hold fetched categories
  const [categories, setCategories] = useState<any[]>([]);

  // Fetch Categories 1, 2, 3 (Simplification for hackathon)
  const { data: cat1 } = useReadContract({ address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`, abi: RELIEF_FUND_ABI, functionName: 'categories', args: [BigInt(1)], query: { enabled: (catCount as bigint) >= BigInt(1) } });
  const { data: cat2 } = useReadContract({ address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`, abi: RELIEF_FUND_ABI, functionName: 'categories', args: [BigInt(2)], query: { enabled: (catCount as bigint) >= BigInt(2) } });
  const { data: cat3 } = useReadContract({ address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`, abi: RELIEF_FUND_ABI, functionName: 'categories', args: [BigInt(3)], query: { enabled: (catCount as bigint) >= BigInt(3) } });
  
  useEffect(() => {
      const cats = [];
      if (cat1 && (cat1 as any)[3]) cats.push({ id: 1, name: (cat1 as any)[0], raised: (cat1 as any)[1], distributed: (cat1 as any)[2] });
      if (cat2 && (cat2 as any)[3]) cats.push({ id: 2, name: (cat2 as any)[0], raised: (cat2 as any)[1], distributed: (cat2 as any)[2] });
      if (cat3 && (cat3 as any)[3]) cats.push({ id: 3, name: (cat3 as any)[0], raised: (cat3 as any)[1], distributed: (cat3 as any)[2] });
      setCategories(cats);
  }, [cat1, cat2, cat3]);

  const handleDonate = async (categoryId: number) => {
      const amount = donateAmounts[categoryId];
      if (!amount || isNaN(parseFloat(amount))) return alert("Enter valid amount");
      
      try {
          setStatus(`Donating ${amount} POL to Category #${categoryId}...`);
          
          const tx = await writeContractAsync({
              address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
              abi: RELIEF_FUND_ABI,
              functionName: 'donate',
              args: [BigInt(categoryId)],
              value: parseEther(amount) // Payable Function
          });
          
          setStatus(`Thank you! Donation successful. Tx: ${tx}`);
          setDonateAmounts(prev => ({...prev, [categoryId]: ''}));
      } catch (error: any) {
          console.error(error);
          setStatus(`Donation Failed: ${error.shortMessage || error.message}`);
      }
  };

  return (
    <div className="min-h-screen pb-20 pt-24 bg-background text-text-primary">
      <Navbar />
      <PageWrapper>
        <div className="container mx-auto px-6">
          <header className="-text-center mb-16 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
            <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
             className="relative z-10 text-center"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm mb-4">
                    <Heart className="w-4 h-4" />
                    <span>Empower Change</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
                    Support a <span className="text-gradient">Cause</span>
                </h1>
                <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                    Directly fund transparent, blockchain-verified relief campaigns. Your contribution makes a real-world difference.
                </p>
            </motion.div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 relative z-10">
              <AnimatePresence>
              {categories.length > 0 ? categories.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                      <Card className="h-full flex flex-col justify-between border-glass-border">
                          <div>
                              <div className="flex justify-between items-center mb-4">
                                  <span className="px-3 py-1 rounded-full bg-surface-light border border-white/5 text-xs text-text-muted">
                                      #{c.id}
                                  </span>
                                  <div className="flex items-center gap-1 text-accent font-bold">
                                      <TrendingUp className="w-4 h-4" />
                                      {Number(formatEther(c.raised)).toFixed(2)} POL
                                  </div>
                              </div>
                              
                              <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{c.name}</h2>
                              <p className="text-text-secondary mb-6 text-sm leading-relaxed">
                                  Verified Campaign. Funds are seamlessly converted to rUSD for local vendors, ensuring direct impact.
                              </p>
                          </div>

                          <div className="bg-surface p-4 rounded-xl border border-white/5">
                              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                                  Donation Amount (POL)
                              </label>
                              <div className="flex gap-2">
                                  <input 
                                    type="number" 
                                    placeholder="e.g. 5"
                                    className="flex-1 bg-surface-dark border border-white/10 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                                    value={donateAmounts[c.id] || ''}
                                    onChange={(e) => setDonateAmounts(prev => ({...prev, [c.id]: e.target.value}))}
                                  />
                                  <Button 
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleDonate(c.id)}
                                    rightIcon={<ArrowUpRight className="w-4 h-4" />}
                                  >
                                      Donate
                                  </Button>
                              </div>
                          </div>
                      </Card>
                  </motion.div>
              )) : (
                  <p className="col-span-full text-center text-text-muted animate-pulse">Loading Active Campaigns...</p>
              )}
              </AnimatePresence>
          </div>
          
          {/* Transparency Section */}
          <div className="relative">
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
             <div className="max-w-5xl mx-auto relative z-10 glass-panel rounded-2xl p-8 border border-white/10">
                <div className="flex items-center justify-center gap-3 mb-8">
                    <Activity className="w-6 h-6 text-primary" />
                    <h2 className="text-3xl font-bold text-center">Live Transparency Logs</h2>
                </div>
                <TransparencyLogs />
             </div>
          </div>

          {/* Status Toast */}
          <AnimatePresence>
            {status && (
                <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-8 right-8 z-50 p-4 bg-surface border border-primary/50 text-white rounded-lg shadow-2xl backdrop-blur-md max-w-sm"
                >
                    <div className="flex items-start gap-3">
                        <div className="w-2 h-2 mt-2 rounded-full bg-primary animate-pulse" />
                        <p className="text-sm font-medium">{status}</p>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PageWrapper>
    </div>
  );
}

function TransparencyLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const publicClient = usePublicClient();
    const chainId = useChainId();
    const contracts = getContracts(chainId);

    useEffect(() => {
        if (!publicClient) return;

        const fetchLogs = async () => {
            try {
                // 1. Fetch 'AidDistributed' (Admin -> Beneficiary)
                const distLogs = await publicClient.getContractEvents({
                    address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
                    abi: RELIEF_FUND_ABI,
                    eventName: 'AidDistributed',
                    fromBlock: BigInt(0), 
                });

                // 2. Fetch 'AidUsed' (Beneficiary -> Vendor)
                const usedLogs = await publicClient.getContractEvents({
                    address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
                    abi: RELIEF_FUND_ABI,
                    eventName: 'AidUsed',
                    fromBlock: BigInt(0), 
                });

                // Format Distributed Logs
                const formattedDist = distLogs.map((log: any) => ({
                    type: 'DISTRIBUTED',
                    txHash: log.transactionHash,
                    from: 'Relief Fund',
                    to: log.args.beneficiary,
                    amount: formatEther(log.args.amount),
                    blockNumber: log.blockNumber,
                    timestamp: 'Recent' 
                }));

                // Format Used Logs
                const formattedUsed = usedLogs.map((log: any) => ({
                    type: 'SPENT',
                    txHash: log.transactionHash,
                    from: log.args.beneficiary,
                    to: log.args.vendor,
                    amount: formatEther(log.args.amount),
                    blockNumber: log.blockNumber,
                    timestamp: 'Recent'
                }));

                // Merge and Sort (Newest First)
                const allLogs = [...formattedDist, ...formattedUsed].sort((a, b) => 
                     Number(b.blockNumber) - Number(a.blockNumber)
                );

                setLogs(allLogs);
            } catch (e) {
                console.error("Error fetching transparency logs:", e);
            }
        };

        const interval = setInterval(fetchLogs, 5000); // Poll every 5s for live updates
        fetchLogs();
        return () => clearInterval(interval);
    }, [publicClient, chainId]);

    const getExplorerLink = (hash: string) => {
        if (chainId === 31337) return `https://dashboard.tenderly.co/tx/localhost/${hash}`; 
        return `https://amoy.polygonscan.com/tx/${hash}`;
    };

    return (
        <div className="overflow-hidden rounded-xl border border-white/5 bg-surface-dark/50">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-text-muted text-xs uppercase tracking-wider">
                            <th className="p-4 font-semibold">Event Type</th>
                            <th className="p-4 font-semibold">From &rarr; To</th>
                            <th className="p-4 font-semibold">Amount (rUSD)</th>
                            <th className="p-4 font-semibold">Proof</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {logs.length > 0 ? logs.map((log, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        log.type === 'DISTRIBUTED' 
                                            ? 'bg-success/10 text-success border border-success/20' 
                                            : 'bg-warning/10 text-warning border border-warning/20'
                                    }`}>
                                        {log.type}
                                    </span>
                                </td>
                                <td className="p-4 font-mono text-text-secondary">
                                    <div className="flex flex-col">
                                        <span><span className="text-text-muted">Of:</span> {log.from.slice(0,6)}...</span>
                                        <span><span className="text-text-muted">To:</span> {log.to.slice(0,6)}...</span>
                                    </div>
                                </td>
                                <td className="p-4 font-bold text-white">
                                    {log.amount}
                                </td>
                                <td className="p-4">
                                    <a 
                                        href={getExplorerLink(log.txHash)} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-accent hover:text-accent-glow transition-colors text-xs"
                                    >
                                        View Tx <ArrowUpRight className="w-3 h-3" />
                                    </a>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-text-muted italic">
                                    Waiting for blockchain activity...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
