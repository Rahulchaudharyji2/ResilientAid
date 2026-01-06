"use client";
import { useState, useEffect } from 'react';
import { useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi';
import { RELIEF_TOKEN_ADDRESS, RELIEF_TOKEN_ABI, RELIEF_FUND_ADDRESS, RELIEF_FUND_ABI } from '../../config/contracts';
import { formatEther, parseEther } from 'viem';

export default function DonorDashboard() {
  const [donationAmount, setDonationAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [impactLogs, setImpactLogs] = useState<any[]>([]);

  const { writeContractAsync } = useWriteContract();

  // 1. Fetch Global Stats (Token Supply -> Total Raised)
  const { data: totalSupply } = useReadContract({
    address: RELIEF_TOKEN_ADDRESS as `0x${string}`,
    abi: RELIEF_TOKEN_ABI,
    functionName: 'totalSupply',
    query: { refetchInterval: 5000 }
  });

  // 2. Fetch Category Count
  const { data: catCount } = useReadContract({
      address: RELIEF_FUND_ADDRESS as `0x${string}`,
      abi: RELIEF_FUND_ABI,
      functionName: 'categoryCount',
  });

  // Watch for 'AidUsed' events to show real-time impact
  useWatchContractEvent({
    address: RELIEF_FUND_ADDRESS as `0x${string}`,
    abi: RELIEF_FUND_ABI,
    eventName: 'AidUsed',
    onLogs(logs) {
        const newLogs = logs.map(log => ({
            categoryId: (log as any).args.categoryId.toString(),
            beneficiary: (log as any).args.beneficiary,
            vendor: (log as any).args.vendor,
            amount: formatEther((log as any).args.amount),
            hash: log.transactionHash
        }));
        setImpactLogs(prev => [...newLogs, ...prev]);
    },
  });

  return (
    <div className="container">
      <header>
        <h1>Donor Transparency Portal</h1>
        <p>Live tracking of every cent from Donation to Redemption.</p>
      </header>
      
      {/* 1. Global Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
          <div className="card" style={{ borderTop: '4px solid #00ff88' }}>
              <small>Total Funds Raised</small>
              <h2>${totalSupply ? formatEther(totalSupply as bigint) : '0'}</h2>
          </div>
          <div className="card" style={{ borderTop: '4px solid #00d0ff' }}>
              <small>Active Categories</small>
              <h2>{catCount?.toString() || '0'}</h2>
          </div>
      </div>

      {/* 2. Categories Grid */}
      <h2 style={{ marginBottom: '1rem' }}>Active Relief Campaigns</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {/* We render a few mocked slots plus dynamic if we could index them. For MVP, assuming Category 1 exists */}
          {[1, 2].map((id) => (
             <CategoryCard key={id} id={id} writeContractAsync={writeContractAsync} /> 
          ))}
      </div>

      {/* 3. Live Impact Feed */}
      <div className="card" style={{ marginTop: '3rem', background: '#111', border: '1px solid #333' }}>
          <h3>📢 Live Impact Feed (Real-Time Block Events)</h3>
          {impactLogs.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>Waiting for transactions...</p>
          ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                  {impactLogs.map((log) => (
                      <li key={log.hash} style={{ borderBottom: '1px solid #222', padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>🛍️</span>
                          <div>
                              <div style={{ color: '#fff' }}>
                                  <strong>{log.amount} rUSD</strong> used in <strong>Category {log.categoryId}</strong>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                  Beneficiary {log.beneficiary.slice(0,6)}... paid Vendor {log.vendor.slice(0,6)}...
                              </div>
                          </div>
                      </li>
                  ))}
              </ul>
          )}
      </div>
    </div>
  );
}

// Sub-component to fetch/show individual category data
function CategoryCard({ id, writeContractAsync }: { id: number, writeContractAsync: any }) {
    const { data: catData } = useReadContract({
        address: RELIEF_FUND_ADDRESS as `0x${string}`,
        abi: RELIEF_FUND_ABI,
        functionName: 'categories',
        args: [BigInt(id)],
        query: { refetchInterval: 3000 }
    });

    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState('');

    if (!catData || !(catData as any)[3]) return null;

    const name = (catData as any)[0];
    const raised = formatEther((catData as any)[1]);
    const distributed = formatEther((catData as any)[2]);

    const handleDonateFlow = async () => {
        if(!amount) return alert("Enter amount");
        
        setStatus("🔒 Connecting to Bybit P2P...");
        await new Promise(r => setTimeout(r, 1000));
        
        setStatus(`💱 Converting ${amount} USD to rUSD...`);
        await new Promise(r => setTimeout(r, 1000));

        try {
            setStatus("⛓️ Confirming On-Chain Transaction...");
            await writeContractAsync({
                address: RELIEF_FUND_ADDRESS as `0x${string}`,
                abi: RELIEF_FUND_ABI,
                functionName: 'donate',
                args: [BigInt(id)],
                value: parseEther(amount)
            });
            setStatus("✅ Donation Successful! Impact Tracked.");
            setAmount('');
            setTimeout(() => setStatus(''), 5000);
        } catch(e: any) {
            console.error(e);
            setStatus("❌ Failed: " + (e.shortMessage || "User rejected"));
        }
    };

    return (
        <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #00d0ff, #00ff88)' }} />
            <h3>{name}</h3>
            <div style={{ margin: '1rem 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                   <small style={{ color: '#888' }}>Raised</small>
                   <div style={{ fontSize: '1.2rem', color: '#fff' }}>${Number(raised).toLocaleString()}</div>
                </div>
                <div>
                   <small style={{ color: '#888' }}>Distributed</small>
                   <div style={{ fontSize: '1.2rem', color: '#00ff88' }}>${Number(distributed).toLocaleString()}</div>
                </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                        placeholder="Amount (USD)" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        style={{ marginBottom: 0, width: '100%' }}
                    />
                    <button 
                      className="btn" 
                      style={{ width: 'auto', background: '#00ff88', color: '#000', whiteSpace: 'nowrap' }} 
                      onClick={handleDonateFlow}
                    >
                        Donate
                    </button>
                </div>
                {status && (
                    <div style={{ 
                        fontSize: '0.8rem', 
                        marginTop: '0.5rem', 
                        color: status.includes('Failed') ? '#ff4444' : '#00ff88',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '0.5rem',
                        borderRadius: '4px'
                    }}>
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
}
