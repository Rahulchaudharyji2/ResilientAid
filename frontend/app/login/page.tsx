"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useAccount, useConnect, useSignMessage } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/Button'; // Assuming you have this
import { Card } from '../components/ui/Card';
import { ShieldCheck, User, Store, Heart } from 'lucide-react';
import Navbar from '../components/Navbar'; // Import Navbar

export default function LoginPage() {
  const [role, setRole] = useState<'BENEFICIARY' | 'VENDOR' | 'DONOR'>('DONOR');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connectAsync } = useConnect();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  const handleWeb3Login = async () => {
    setIsLoading(true);
    try {
        let userAddress = address;
        if (!isConnected) {
            const result = await connectAsync({ connector: injected() });
            userAddress = result.accounts[0];
        }

        if (!userAddress) return;

        // Sign in with credentials, passing address and role
        const result = await signIn('web3', {
            address: userAddress,
            role: role,
            redirect: false,
        });

        if (result?.ok) {
            router.push('/dashboard');
        } else {
            console.error("Login failed");
        }

    } catch (error) {
        console.error("Web3 login error:", error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
       {/* Simple Header */}
       <header className="p-6 border-b border-white/5">
         <div className="container mx-auto font-bold text-2xl">Resilient<span className="text-accent">Aid</span></div>
       </header>

       <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
          {/* Background Ambient */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

          <Card className="w-full max-w-md p-8 relative z-10 glass-panel">
             <h1 className="text-3xl font-bold mb-2 text-center">Welcome Back</h1>
             <p className="text-slate-400 text-center mb-8">Access the Resilient-Aid Platform</p>

             <div className="space-y-6">
                {/* Admin Section */}
                <div className="border-b border-white/10 pb-6">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Admin Access</h2>
                    <Button 
                        variant="secondary" 
                        className="w-full justify-center flex items-center gap-2"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                    >
                        <ShieldCheck size={18} /> Sign in as Admin
                    </Button>
                </div>

                {/* Web3 Section */}
                <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">User Access</h2>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <button 
                            onClick={() => setRole('BENEFICIARY')}
                            className={`p-2 rounded-lg text-xs font-bold border transition-all flex flex-col items-center gap-1 ${role === 'BENEFICIARY' ? 'bg-primary text-black border-primary' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                        >
                            <User size={16} /> Beneficiary
                        </button>
                        <button 
                            onClick={() => setRole('VENDOR')}
                            className={`p-2 rounded-lg text-xs font-bold border transition-all flex flex-col items-center gap-1 ${role === 'VENDOR' ? 'bg-accent text-white border-accent' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                        >
                            <Store size={16} /> Vendor
                        </button>
                         <button 
                            onClick={() => setRole('DONOR')}
                            className={`p-2 rounded-lg text-xs font-bold border transition-all flex flex-col items-center gap-1 ${role === 'DONOR' ? 'bg-success text-black border-success' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                        >
                            <Heart size={16} /> Donor
                        </button>
                    </div>

                    <Button 
                        variant="primary" 
                        className="w-full justify-center"
                        onClick={handleWeb3Login}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Connecting...' : 'Connect Wallet & Login'}
                    </Button>
                    <p className="text-xs text-center text-slate-500 mt-2">
                        Select your role and connect your wallet.
                    </p>
                </div>
             </div>
          </Card>
       </main>
    </div>
  );
}
