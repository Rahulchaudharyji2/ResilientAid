"use client";
import { useState, useEffect } from 'react';
import { useChainId } from 'wagmi';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { getContracts, RELIEF_FUND_ABI } from '../../config/contracts';
import { formatEther, parseEther } from 'viem';
import Navbar from '../components/Navbar';

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
    <div className="container" style={{ paddingTop: '100px' }}>
      <Navbar />
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', background: 'linear-gradient(45deg, #00ff88, #00d0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Support a Cause
        </h1>
        <p style={{ color: '#aaa', fontSize: '1.2rem' }}>Directly fund transparent, blockchain-verified relief campaigns.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {categories.length > 0 ? categories.map(c => (
              <div key={c.id} className="card" style={{ border: '1px solid #444', transition: 'all 0.3s ease', cursor: 'default' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ background: '#333', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', color: '#888' }}>
                          #{c.id}
                      </span>
                      <span style={{ color: '#00ff88', fontWeight: 'bold' }}>
                          {Number(formatEther(c.raised)).toFixed(2)} POL Raised
                      </span>
                  </div>
                  
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{c.name}</h2>
                  <p style={{ color: '#888', marginBottom: '1.5rem' }}>
                      Verified Campaign. Funds are seamlessly converted to rUSD for local vendors.
                  </p>

                  <div style={{ background: '#111', padding: '1rem', borderRadius: '8px' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>
                          Donation Amount (POL/MATIC)
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input 
                            type="number" 
                            placeholder="e.g. 5"
                            value={donateAmounts[c.id] || ''}
                            onChange={(e) => setDonateAmounts(prev => ({...prev, [c.id]: e.target.value}))}
                            style={{ flex: 1, marginBottom: 0 }}
                          />
                          <button 
                            className="btn" 
                            style={{ background: 'linear-gradient(90deg, #00ff88, #00d0ff)', color: '#000', fontWeight: 'bold' }}
                            onClick={() => handleDonate(c.id)}
                          >
                              Donate
                          </button>
                      </div>
                  </div>
              </div>
          )) : (
              <p style={{ textAlign: 'center', color: '#666', gridColumn: '1/-1' }}>Loading Campaigns...</p>
          )}
      </div>
      
      {/* Transparency Portal */}
      <div style={{ marginTop: '4rem', padding: '2rem', borderTop: '1px solid #333' }}>
        <h2 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
            🔍 Transparency Portal
        </h2>
        <TransparencyLogs />
      </div>
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
                // Fetch 'AidDistributed' events
                const logs = await publicClient.getContractEvents({
                    address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
                    abi: RELIEF_FUND_ABI,
                    eventName: 'AidDistributed',
                    fromBlock: BigInt(0), // Scan from Genesis (or a specific block)
                });

                // Format logs
                const formattedLogs = logs.map((log: any) => ({
                    txHash: log.transactionHash,
                    beneficiary: log.args.beneficiary,
                    amount: formatEther(log.args.amount),
                    blockNumber: log.blockNumber
                })).reverse(); // Newest first

                setLogs(formattedLogs);
            } catch (e) {
                console.error("Error fetching transparency logs:", e);
            }
        };

        fetchLogs();
    }, [publicClient]);

    return (
        <div style={{ background: '#111', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ccc' }}>
                <thead style={{ background: '#222', color: '#fff' }}>
                    <tr>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Beneficiary</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Amount Received</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Proof (Tx Hash)</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.length > 0 ? logs.map((log, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                            <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#00d0ff' }}>
                                {log.beneficiary.slice(0, 6)}...{log.beneficiary.slice(-4)}
                            </td>
                            <td style={{ padding: '1rem', color: '#00ff88', fontWeight: 'bold' }}>
                                + {Number(log.amount).toFixed(2)} rUSD
                            </td>
                            <td style={{ padding: '1rem' }}>
                                <a 
                                    href={`https://amoy.polygonscan.com/tx/${log.txHash}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    style={{ color: '#aaa', textDecoration: 'none', fontSize: '0.9rem' }}
                                >
                                    {log.txHash.slice(0, 10)}... ↗
                                </a>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                                No distribution records found yet.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
