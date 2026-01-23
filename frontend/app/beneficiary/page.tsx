"use client";
import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useChainId } from 'wagmi';
import { getContracts, RELIEF_PASS_ABI, RELIEF_TOKEN_ABI } from '../../config/contracts';
import { formatEther } from 'viem';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/Button';
import { PageWrapper } from '../components/ui/PageWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, RefreshCw, Key, CreditCard, Lock, User } from 'lucide-react';
import QRCode from 'react-qr-code';

export default function BeneficiaryDashboard() {
  const { address } = useAccount();
  const [isFlipped, setIsFlipped] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  
  const chainId = useChainId();
  const contracts = getContracts(chainId);

  // 1. Fetch Relief Pass (SBT) Details
  const { data: passBalance } = useReadContract({
      address: contracts.RELIEF_PASS_ADDRESS as `0x${string}`,
      abi: RELIEF_PASS_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
  });
  
  // 2. Fetch Relief Token Balance (Spendable)
  const { data: tokenBalance } = useReadContract({
      address: contracts.RELIEF_TOKEN_ADDRESS as `0x${string}`,
      abi: RELIEF_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
  });

  const handlePinChange = (index: number, value: string) => {
      if (value.length > 1) return;
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);
      
      // Auto-focus next input
      if (value && index < 3) {
          const nextInput = document.getElementById(`pin-${index + 1}`);
          nextInput?.focus();
      }
  };

  const handleSavePin = () => {
      // Logic to hash and save PIN on-chain or locally (Simulated)
      alert("PIN Secured On-Chain!");
      setShowPinModal(false);
  };

  return (
    <div className="min-h-screen pb-20 pt-24 bg-background text-text-primary perspective-1000">
      <Navbar />
      <PageWrapper>
      <div className="container mx-auto px-6 flex flex-col items-center">
          
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-2">My <span className="text-gradient">Relief Identity</span></h1>
            <p className="text-text-secondary">Your secure access to humanitarian aid.</p>
          </header>

          {passBalance && Number(passBalance) > 0 ? (
          <div className="relative w-full max-w-md h-[280px] perspective-1000 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
              <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                  
                  {/* FRONT OF CARD */}
                  <div className="absolute inset-0 w-full h-full backface-hidden">
                      <div className="w-full h-full rounded-2xl bg-gradient-to-br from-surface-light/80 to-surface/40 backdrop-blur-xl border border-white/20 shadow-2xl p-6 flex flex-col justify-between relative overflow-hidden">
                          {/* Glow Effects */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full pointer-events-none" />
                          <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/20 blur-[60px] rounded-full pointer-events-none" />
                          
                          <div className="flex justify-between items-start relative z-10">
                              <div className="flex items-center gap-2">
                                  <ShieldCheck className="w-8 h-8 text-primary" />
                                  <div>
                                      <h3 className="font-bold text-lg leading-none">ResilientID</h3>
                                      <span className="text-[10px] text-text-muted uppercase tracking-widest">Official Beneficiary</span>
                                  </div>
                              </div>
                              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                  <User className="w-5 h-5 text-white" />
                              </div>
                          </div>

                          <div className="space-y-4 relative z-10">
                              <div className="flex justify-between items-end">
                                  <div>
                                      <span className="text-xs text-text-muted uppercase block mb-1">Total Aid Utilized</span>
                                      <span className="text-2xl font-bold text-white font-mono">$1,250.00</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs text-text-muted uppercase block mb-1">Current Balance</span>
                                    <span className="text-xl font-bold text-accent font-mono">
                                        ${tokenBalance ? formatEther(tokenBalance as bigint) : '0.00'}
                                    </span>
                                  </div>
                              </div>
                              
                              <div className="pt-4 border-t border-white/10 flex justify-between items-center text-sm font-mono text-text-secondary">
                                  <span>**** **** **** {address?.slice(-4)}</span>
                                  <span className="flex items-center gap-1 text-xs">
                                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                      Active
                                  </span>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* BACK OF CARD (QR) */}
                  <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                      <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-black border border-white/20 shadow-2xl p-6 flex flex-col items-center justify-center relative">
                          <div className="bg-white p-2 rounded-xl mb-4">
                              <QRCode 
                                value={address || "Connect Wallet"} 
                                size={140}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                viewBox={`0 0 256 256`}
                              />
                          </div>
                          <p className="text-xs text-text-muted mb-2">Scan at Vendor Terminal to Pay</p>
                          <p className="font-mono text-xs text-white break-all max-w-[80%] text-center opacity-50">
                              {address}
                          </p>
                      </div>
                  </div>

              </div>
          </div>
          ) : (
            <div className="w-full max-w-md h-[280px] rounded-2xl bg-surface-dark border w-2 border-dashed border-white/10 flex flex-col items-center justify-center text-center p-6">
                <Lock className="w-12 h-12 text-text-muted mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-text-secondary mb-2">Identity Not Verified</h3>
                <p className="text-sm text-text-muted max-w-[200px]">
                    To access aid and generate your Relief ID, please complete verification at a local agent hub.
                </p>
            </div>
          )}

          <div className="mt-8 flex gap-4">
              <Button 
                variant="secondary" 
                onClick={() => setIsFlipped(!isFlipped)}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                  Flip Card
              </Button>
              <Button 
                variant="primary" 
                onClick={() => setShowPinModal(true)}
                leftIcon={<Key className="w-4 h-4" />}
              >
                  Set Security PIN
              </Button>
          </div>

          <div className="mt-16 w-full max-w-2xl">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-text-muted" />
                  Recent Activity
              </h3>
              <div className="space-y-3">
                  {[1, 2].map(i => (
                      <div key={i} className="bg-surface p-4 rounded-xl border border-white/5 flex justify-between items-center hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-4">
                              <div className="p-2 rounded-full bg-surface-dark">
                                  <Lock className="w-4 h-4 text-text-muted" />
                              </div>
                              <div>
                                  <div className="font-bold text-sm">Grocery Provisions</div>
                                  <div className="text-xs text-text-muted">Vendor: 0x12...4B</div>
                              </div>
                          </div>
                          <span className="font-mono font-bold text-red-400">-$45.00</span>
                      </div>
                  ))}
                  <div className="bg-surface p-4 rounded-xl border border-white/5 flex justify-between items-center hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-surface-dark">
                              <ShieldCheck className="w-4 h-4 text-success" />
                          </div>
                          <div>
                              <div className="font-bold text-sm">Disaster Relief Fund</div>
                              <div className="text-xs text-text-muted">Direct Aid Received</div>
                          </div>
                      </div>
                      <span className="font-mono font-bold text-success">+$250.00</span>
                  </div>
              </div>
          </div>

          {/* PIN MODAL */}
          <AnimatePresence>
            {showPinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowPinModal(false)}
                    />
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative z-10 w-full max-w-sm bg-surface-dark border border-white/10 rounded-2xl p-8 shadow-2xl"
                    >
                        <h3 className="text-2xl font-bold mb-2 text-center">Set Security PIN</h3>
                        <p className="text-text-muted text-center mb-8 text-sm">
                            This PIN will be required to authorize payments at vendor terminals.
                        </p>

                        <div className="flex justify-center gap-3 mb-8">
                            {pin.map((digit, i) => (
                                <input
                                    key={i}
                                    id={`pin-${i}`}
                                    type="password"
                                    maxLength={1}
                                    className="w-12 h-16 text-center text-2xl font-bold bg-surface border-2 border-white/10 rounded-lg focus:border-primary focus:outline-none transition-colors"
                                    value={digit}
                                    onChange={(e) => handlePinChange(i, e.target.value)}
                                />
                            ))}
                        </div>

                        <Button className="w-full" onClick={handleSavePin}>
                            Confirm PIN
                        </Button>
                    </motion.div>
                </div>
            )}
          </AnimatePresence>

      </div>
      </PageWrapper>

      <style jsx global>{`
        .perspective-1000 {
            perspective: 1000px;
        }
        .preserve-3d {
            transform-style: preserve-3d;
        }
        .backface-hidden {
            backface-visibility: hidden;
        }
        .rotate-y-180 {
            transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
