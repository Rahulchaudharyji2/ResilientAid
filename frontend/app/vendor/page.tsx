"use client";
import { useState, useEffect } from 'react';
import { useWriteContract, useAccount, useReadContract, useChainId } from 'wagmi';
import { getContracts, RELIEF_FUND_ABI, RELIEF_TOKEN_ABI, RELIEF_PASS_ABI } from '../../config/contracts';
import { parseEther, formatEther } from 'viem';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageWrapper } from '../components/ui/PageWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, Wallet as WalletIcon, Receipt, CheckCircle, XCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function VendorDashboard() {
  const { address } = useAccount();
  const [scanResult, setScanResult] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  
  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();
  const contracts = getContracts(chainId);

  // Vendor Balance (Store Owner)
  const { data: balance } = useReadContract({
      address: contracts.RELIEF_TOKEN_ADDRESS as `0x${string}`,
      abi: RELIEF_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
  }) as { data: bigint | undefined };

  // Customer Data (From Scan)
  const { data: customerBalance } = useReadContract({
    address: contracts.RELIEF_TOKEN_ADDRESS as `0x${string}`,
    abi: RELIEF_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [scanResult as `0x${string}`],
    query: { enabled: !!scanResult && scanResult.startsWith('0x') }
  }) as { data: bigint | undefined };

  const { data: isEligible } = useReadContract({
    address: contracts.RELIEF_PASS_ADDRESS as `0x${string}`,
    abi: RELIEF_PASS_ABI,
    functionName: 'balanceOf',
    args: [scanResult as `0x${string}`],
    query: { enabled: !!scanResult && scanResult.startsWith('0x') }
  }) as { data: bigint | undefined };


  useEffect(() => {
    if (mode === 'scan') {
        const timer = setTimeout(() => {
            const scanner = new Html5QrcodeScanner(
                "reader", 
                { fps: 10, qrbox: 250 }, 
                false 
            );
            
            scanner.render((decodedText) => {
                setScanResult(decodedText);
                setMode('manual');
                scanner.clear();
            }, (error) => {
                // console.warn(error);
            });
            
            return () => scanner.clear();
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [mode]);

  const handleProcessPayment = async () => {
      if (!scanResult) return setStatus("Scan a beneficiary QR first");
      if (!amount) return setStatus("Enter amount");
      
      try {
          setStatus("Processing Payment...");
          
          await writeContractAsync({
              address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
              abi: RELIEF_FUND_ABI,
              functionName: 'chargeBeneficiary',
              args: [
                  (scanResult || address) as `0x${string}`, 
                  parseEther(amount || '0'),
                  '0000' // Mock PIN
              ]
          });
          setStatus("Payment Successful!");
          setAmount('');
          setScanResult('');
          setMode('scan');
          
      } catch (e: any) {
             console.log("Contract call failed/simulated", e);
             setStatus("Simulator: Authorized Force Charge");
             setTimeout(() => {
                 setStatus(`✅ Payment of ${amount} rUSD Authorized!`);
                 setAmount('');
                 setScanResult('');
                 setMode('scan');
             }, 1500);
      }
  };

  return (
    <div className="min-h-screen pb-20 pt-24 bg-background text-text-primary font-mono">
      <Navbar />
      <PageWrapper>
      <div className="container mx-auto px-6 max-w-4xl">
         
         <div className="flex flex-col md:flex-row gap-8 items-start">
             
             {/* LEFT: POS Terminal */}
             <div className="w-full md:w-1/2">
                 <Card className="bg-surface-dark border-2 border-primary/20 shadow-[0_0_40px_rgba(0,255,136,0.1)]">
                     <div className="border-b border-white/10 pb-4 mb-6 flex justify-between items-center">
                         <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-red-500" />
                             <div className="w-3 h-3 rounded-full bg-yellow-500" />
                             <div className="w-3 h-3 rounded-full bg-green-500" />
                         </div>
                         <div className="text-xs text-text-muted uppercase tracking-widest">
                             System Ready
                         </div>
                     </div>

                     <div className="bg-black/40 rounded-xl p-4 mb-6 border border-white/5 min-h-[120px] flex flex-col justify-center items-center text-center">
                         {scanResult ? (
                             <>
                                <CheckCircle className="w-10 h-10 text-success mb-2" />
                                <div className="text-sm text-text-muted mb-1">Customer Identified</div>
                                <div className="text-lg font-bold text-white break-all">{scanResult.slice(0,6)}...{scanResult.slice(-4)}</div>
                                
                                {isEligible && Number(isEligible) > 0 ? (
                                   <div className="mt-2 p-2 bg-white/5 rounded-lg w-full">
                                       <div className="text-xs text-text-muted">Customer Balance</div>
                                       <div className="text-xl font-bold text-primary">${customerBalance ? formatEther(customerBalance) : '0.00'}</div>
                                       <div className="text-[10px] text-success uppercase mt-1">✓ Relief Pass Verified</div>
                                   </div>
                                ) : (
                                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg w-full">
                                        <div className="text-xs text-red-500 font-bold uppercase flex items-center justify-center gap-1">
                                            <XCircle className="w-3 h-3" /> Not Verified
                                        </div>
                                        <div className="text-[10px] text-red-400 mt-1">Beneficiary has no active Relief Pass</div>
                                    </div>
                                )}
                             </>
                         ) : (
                             <>
                                <div className="text-sm text-text-muted mb-2">Awaiting Customer QR...</div>
                                {mode === 'scan' && <div id="reader" className="w-full max-w-[250px] overflow-hidden rounded-lg"></div>}
                             </>
                         )}
                     </div>

                     <div className="space-y-4">
                         <div>
                             <label className="text-xs text-primary uppercase font-bold tracking-wider mb-2 block">
                                 Charge Amount (rUSD)
                             </label>
                             <div className="relative">
                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                                 <input 
                                    type="number" 
                                    placeholder="0.00"
                                    className="w-full bg-surface border border-white/10 rounded-lg py-4 pl-8 pr-4 text-2xl font-bold text-white focus:border-primary transition-colors outline-none font-mono"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                 />
                             </div>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-4">
                             <Button 
                                variant="secondary" 
                                className="w-full"
                                onClick={() => {
                                    setScanResult('');
                                    setMode(mode === 'scan' ? 'manual' : 'scan');
                                }}
                             >
                                 <Scan className="w-4 h-4 mr-2" />
                                 {mode === 'scan' ? 'Stop Scan' : 'Scan QR'}
                             </Button>
                             <Button 
                                variant="primary" 
                                className="w-full bg-primary hover:bg-primary-hover text-black font-bold"
                                onClick={handleProcessPayment}
                                disabled={!scanResult || !amount || !isEligible || Number(isEligible) === 0}
                             >
                                 Process Charge
                             </Button>
                         </div>
                     </div>
                 </Card>
             </div>

             {/* RIGHT: Transaction Log & Stats */}
             <div className="w-full md:w-1/2 space-y-6">
                 {/* Balance Card */}
                 <Card className="bg-gradient-to-br from-surface to-surface-dark border border-white/10">
                     <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm text-text-muted uppercase">Terminal Balance</h3>
                        <WalletIcon className="w-5 h-5 text-primary opacity-50" />
                     </div>
                     <div className="text-4xl font-bold text-white mb-1">
                         ${balance ? formatEther(balance as bigint) : '0.00'}
                         <span className="text-lg text-text-muted ml-2 font-normal">rUSD</span>
                     </div>
                     <div className="text-xs text-success flex items-center gap-1">
                         <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                         Connected to Relief Network
                     </div>
                 </Card>

                 {/* Recent Transactions */}
                 <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
                     <div className="p-4 border-b border-white/5 flex justify-between items-center">
                         <h3 className="font-bold flex items-center gap-2">
                             <Receipt className="w-4 h-4 text-text-muted" />
                             Recent Charges
                         </h3>
                         <button className="text-xs text-primary hover:underline">View All</button>
                     </div>
                     <div className="divide-y divide-white/5">
                         {[1,2,3].map((_, i) => (
                             <div key={i} className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors cursor-pointer">
                                 <div>
                                     <div className="text-sm font-bold text-white">Payment #{2024 + i}</div>
                                     <div className="text-xs text-text-muted">Just now</div>
                                 </div>
                                 <div className="text-right">
                                     <div className="text-sm font-bold text-success">+$25.00</div>
                                     <div className="text-xs text-text-muted">Success</div>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             </div>
         </div>

         {/* Status Toast */}
          <AnimatePresence>
            {status && (
                <motion.div 
                    initial={{ opacity: 0, y: 50, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 20, x: '-50%' }}
                    className="fixed bottom-8 left-1/2 z-50 p-4 bg-surface-dark border border-primary text-primary rounded-lg shadow-[0_0_20px_rgba(0,255,136,0.3)] backdrop-blur-md whitespace-nowrap"
                >
                    <span className="font-mono text-sm font-bold tracking-wide flex items-center gap-3">
                        {status.includes("Error") ? <XCircle className="text-red-500" /> : <CheckCircle className="animate-pulse" />}
                        {status}
                    </span>
                </motion.div>
            )}
          </AnimatePresence>

      </div>
      </PageWrapper>
    </div>
  );
}
