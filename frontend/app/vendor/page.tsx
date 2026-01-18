"use client";
import { useState, useRef, useEffect } from 'react';
import { useWriteContract, useAccount, useReadContract, useChainId } from 'wagmi';
import { getContracts, RELIEF_FUND_ABI, RELIEF_TOKEN_ABI } from '../../config/contracts';
import { parseEther, formatEther } from 'viem';
import Navbar from '../components/Navbar';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

export default function VendorDashboard() {
  const { address } = useAccount();
  const [status, setStatus] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  
  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();
  const contracts = getContracts(chainId);

  // 1. Fetch Vendor Balance
  const { data: balanceData } = useReadContract({
    address: contracts.RELIEF_TOKEN_ADDRESS as `0x${string}`,
    abi: RELIEF_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: { enabled: !!address, refetchInterval: 3000 }
  });

  // 2. Fetch Category and Name
  const { data: categoryId } = useReadContract({
    address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
    abi: RELIEF_FUND_ABI,
    functionName: 'entityCategory',
    args: [address as `0x${string}`],
  });

  const { data: categoryData } = useReadContract({
      address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
      abi: RELIEF_FUND_ABI,
      functionName: 'categories',
      args: [categoryId ? BigInt(categoryId as bigint) : BigInt(0)],
      query: { enabled: !!categoryId }
  });

  const formattedBalance = balanceData ? formatEther(balanceData as bigint) : '0';
  const categoryName = categoryData ? (categoryData as any)[0] : 'Unverified';

  // Transaction History State
  const [txHistory, setTxHistory] = useState<any[]>([]);
  
  // Charge State
  const [bioAddress, setBioAddress] = useState('');
  const [bioAmount, setBioAmount] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pinInput, setPinInput] = useState('');

  // Handle Charge via PIN
  const handlePinCharge = async (pinSecret: string) => {
      try {
          setShowAuthModal(false); 
          setStatus(`⌛ Verifying PIN On-Chain...`);
          
          const tx = await writeContractAsync({
              address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
              abi: RELIEF_FUND_ABI,
              functionName: 'chargeBeneficiary',
              args: [
                  bioAddress as `0x${string}`,
                  parseEther(bioAmount),
                  pinSecret 
              ]
          });
          
          setStatus(`Success! Charged ${bioAmount} rUSD. Tx: ${tx}`);
          setTxHistory([{
             id: tx, beneficiary: bioAddress, amount: bioAmount, time: new Date().toLocaleTimeString()
          }, ...txHistory]);
          
          setBioAddress('');
          setBioAmount('');
          setPinInput('');
      } catch (e: any) {
          console.error(e);
          setStatus(`Charge Failed: ${e.message}`);
      }
  };

  // QR Scan Handler (Detect Address)
  const onScanSuccess = (decodedText: string) => {
    // Simple validation for Ethereum Address
    if (decodedText.startsWith("0x") && decodedText.length === 42) {
        setBioAddress(decodedText);
        setShowScanner(false); // Close scanner on success
        setStatus("✅ Address Detected!");
    } else {
        console.warn("Scanned data does not look like an address:", decodedText);
    }
  };

  // Toggle Camera Scanner
  useEffect(() => {
     if (showScanner) {
         const scanner = new Html5QrcodeScanner(
             "reader", { fps: 10, qrbox: 250 }, false
         );
         scanner.render(onScanSuccess, (err) => console.log(err));
         return () => { scanner.clear().catch(e => console.error(e)); };
     }
  }, [showScanner]);

  return (
    <div className="container" style={{ paddingTop: '100px' }}>
      <Navbar />
      <header>
        <h1>Vendor Terminal</h1>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
             <div className="card" style={{ padding: '1rem', border: '1px solid #ffd700' }}>
                <small>Store Balance</small>
                <h3>{formattedBalance} rUSD</h3>
            </div>
            <div className="card" style={{ padding: '1rem', border: '1px solid #00d0ff' }}>
                 <small>Authorized Category</small>
                 <h3>{categoryName} (ID: {categoryId?.toString() || '0'})</h3>
            </div>
        </div>
      </header>

      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', border: '1px solid #00ff88' }}>
          <h2 style={{ borderBottom: '1px solid #444', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              💳 Process Payment
          </h2>
          
          {/* 1. Beneficiary Address Input + Scanner */}
          <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#aaa' }}>Beneficiary</label>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                      placeholder="Scan QR or Enter Address (0x...)" 
                      value={bioAddress}
                      onChange={(e) => setBioAddress(e.target.value)}
                      style={{ flex: 1, fontFamily: 'monospace', borderColor: bioAddress ? '#00ff88' : '#444' }}
                  />
                  <button 
                    onClick={() => setShowScanner(!showScanner)}
                    style={{ background: showScanner ? '#ff007a' : '#333', border: '1px solid #555', borderRadius: '8px', cursor: 'pointer', padding: '0 1rem' }}
                    title="Toggle Camera"
                  >
                    📷
                  </button>
              </div>

              {/* Scanner Viewport */}
              {showScanner && (
                  <div id="reader" style={{ marginTop: '1rem', border: '1px solid #00ff88', borderRadius: '8px', overflow: 'hidden' }}></div>
              )}
          </div>

          {/* 2. Amount Input */}
          <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#aaa' }}>Amount to Charge (rUSD)</label>
              <input 
                  placeholder="e.g. 50" 
                  type="number"
                  value={bioAmount}
                  onChange={(e) => setBioAmount(e.target.value)}
                  style={{ fontSize: '1.5rem', fontWeight: 'bold' }}
              />
          </div>

          {/* 3. Action Button */}
          <button 
            className="btn" 
            style={{ width: '100%', background: bioAddress && bioAmount ? '#00d0ff' : '#444', color: bioAddress && bioAmount ? '#000' : '#888', border: 'none', transition: 'all 0.3s' }} 
            onClick={() => {
                if(bioAddress && bioAmount) setShowAuthModal(true);
                else setStatus("⚠️ Please enter Address and Amount");
            }}
            disabled={!bioAddress || !bioAmount}
          >
              🔐 Client Auth & Charge
          </button>
      
        {/* Biometric/PIN POS Modal */}
        {showAuthModal && (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
                <div style={{ background: '#111', padding: '2rem', borderRadius: '16px', border: '1px solid #00d0ff', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                    <h2 style={{ color: '#fff', marginBottom: '1rem' }}>🔐 Beneficiary Authorization</h2>
                    <p style={{ color: '#aaa', marginBottom: '2rem' }}>Please ask the customer to enter their <strong>Relief Card PIN</strong>.</p>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                        <input 
                            type="password" 
                            placeholder="• • • •" 
                            maxLength={4}
                            value={pinInput}
                            style={{ textAlign: 'center', fontSize: '2rem', letterSpacing: '1rem', width: '200px', padding: '0.5rem', borderRadius: '8px', border: '1px solid #00d0ff', background: '#000', color: '#fff' }} 
                            onChange={(e) => {
                                setPinInput(e.target.value);
                                if(e.target.value.length === 4) handlePinCharge(e.target.value);
                            }}
                            autoFocus
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                         <button className="btn" style={{ background: 'transparent', border: '1px solid #666' }} onClick={() => setShowAuthModal(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}

        {status && <div style={{ marginTop: '1rem', padding: '1rem', background: status.includes('Success') || status.includes('Detected') ? 'rgba(0,255,136,0.1)' : 'rgba(255,100,100,0.1)', borderRadius: '8px', fontWeight: 'bold', wordBreak: 'break-all', color: status.includes('Success') || status.includes('Detected') ? '#00ff88' : 'orange' }}>{status}</div>}
      </div>

      {txHistory.length > 0 && (
          <div className="card" style={{ marginTop: '2rem' }}>
              <h3>Recent Transactions (Session)</h3>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                      <tr style={{ borderBottom: '1px solid #444' }}>
                          <th style={{ padding: '0.5rem' }}>Time</th>
                          <th style={{ padding: '0.5rem' }}>Beneficiary</th>
                          <th style={{ padding: '0.5rem' }}>Amount</th>
                          <th style={{ padding: '0.5rem' }}>Status</th>
                      </tr>
                  </thead>
                  <tbody>
                      {txHistory.map((tx) => (
                          <tr key={tx.id} style={{ borderBottom: '1px solid #333' }}>
                              <td style={{ padding: '0.5rem' }}>{tx.time}</td>
                              <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{tx.beneficiary.slice(0,6)}...{tx.beneficiary.slice(-4)}</td>
                              <td style={{ padding: '0.5rem', color: '#00ff88' }}>+{tx.amount} rUSD</td>
                              <td style={{ padding: '0.5rem' }}>Confimed</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}
    </div>
  );
}
