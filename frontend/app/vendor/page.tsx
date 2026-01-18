"use client";
import { useState, useRef, useEffect } from 'react';
import { useWriteContract, useAccount, useReadContract, useChainId } from 'wagmi';
import { getContracts, RELIEF_FUND_ABI, RELIEF_TOKEN_ABI } from '../../config/contracts';
import { parseEther, formatEther } from 'viem';
import Navbar from '../components/Navbar';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

export default function VendorDashboard() {
  const { address } = useAccount();
  const [voucherData, setVoucherData] = useState('');
  const [status, setStatus] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  



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

  // 2. Fetch Category
  const { data: categoryId } = useReadContract({
    address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
    abi: RELIEF_FUND_ABI,
    functionName: 'entityCategory',
    args: [address as `0x${string}`],
  });

  // 3. Get Category Name
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

  // Tab State
  const [activeTab, setActiveTab] = useState<'voucher' | 'bio'>('bio');
  
  // Biometric Charge State
  const [bioAddress, setBioAddress] = useState('');
  const [bioAmount, setBioAmount] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [pinInput, setPinInput] = useState('');

  const handlePinCharge = async (pinSecret: string) => {
      
      try {
          setShowAuthModal(false); // Close modal
          setStatus(`⌛ Verifying PIN On-Chain...`);
          
          const tx = await writeContractAsync({
              address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
              abi: RELIEF_FUND_ABI,
              functionName: 'chargeBeneficiary',
              args: [
                  bioAddress as `0x${string}`,
                  parseEther(bioAmount),
                  pinSecret // Pass the PIN
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

  // QR Scan Success Handler
  const onScanSuccess = (decodedText: string) => {
    try {
        JSON.parse(decodedText);
        setVoucherData(decodedText);
        setShowScanner(false);
    } catch (e) {
        console.warn("Scanned non-JSON data", decodedText);
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

  const handleFileUpload = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const html5QrCode = new Html5Qrcode("reader-hidden");
      try {
          const result = await html5QrCode.scanFileV2(file, true);
          console.log("QR Scan Result:", result);
          
          let text = '';
          if (typeof result === 'string') {
              text = result;
          } else if (typeof result === 'object' && (result as any).decodedText) {
               // Handle case where library returns object
              text = (result as any).decodedText;
          } else {
              // Fallback
              text = JSON.stringify(result);
          }
          
          setVoucherData(text);
          // Auto process or just show? Let's just set data for now.
      } catch (err) {
          console.error(err);
          setStatus("Error reading QR from image. Try another image.");
      }
  };

  const handleProcessVoucher = async () => {
    try {
        setStatus("Verifying and Processing Transaction...");
        const voucher = JSON.parse(voucherData);
        
        console.log("Processing Voucher:", voucher);
        
        // 1. Contract Interaction
        const tx = await writeContractAsync({
            address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
            abi: RELIEF_FUND_ABI,
            functionName: 'processOfflineTransaction',
            args: [
                voucher.beneficiary,
                BigInt(voucher.amount), // FIX: QR data is already in Wei. Do NOT parseEther again.
                BigInt(voucher.nonce),
                voucher.signature
            ]
        });
        
        // 2. Log to Persistent Database
        try {
            await fetch('/api/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    txHash: tx,
                    from: voucher.beneficiary,
                    to: address, // Vendor is recipient
                    amount: voucher.amount.toString(),
                    type: 'OFFLINE_QR',
                    status: 'CONFIRMED'
                })
            });
        } catch (dbError) {
            console.error("DB Log failed", dbError);
        }
        
        // 3. Update UI
        const newTx = {
            id: tx,
            beneficiary: voucher.beneficiary,
            amount: voucher.amount,
            time: new Date().toLocaleTimeString()
        };
        
        setTxHistory([newTx, ...txHistory]); // Add new tx to top
        setStatus(`Success! Payment Received.`);
        setVoucherData('');
    } catch (error: any) {
        console.error("Redemption Failed", error);
        setStatus(`Error: ${error.shortMessage || error.message || "Failed to redeem"}`);
    }
  };

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
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button 
            onClick={() => setActiveTab('bio')}
            style={{ 
                flex: 1, 
                padding: '1rem', 
                background: activeTab === 'bio' ? '#00d0ff' : '#222', 
                color: activeTab === 'bio' ? '#000' : '#888',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 'bold'
            }}>
             🔐 PIN Charge
          </button>
          <button 
             onClick={() => setActiveTab('voucher')}
             style={{ 
                flex: 1, 
                padding: '1rem', 
                background: activeTab === 'voucher' ? '#00d0ff' : '#222', 
                color: activeTab === 'voucher' ? '#000' : '#888',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 'bold'
             }}>
             📷 Scan Voucher
          </button>
        </div>
        {activeTab === 'voucher' ? (
          <div>
              <p style={{ color: '#bbb' }}>Scan a one-time Benefit Voucher QR generated by the beneficiary.</p>
               {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <button className="btn" style={{ background: '#333' }} onClick={() => setShowScanner(!showScanner)}>
                        {showScanner ? 'Close Scanner' : '📷 Scan QR Camera'}
                    </button>
                    <button className="btn" style={{ background: '#333' }} onClick={() => fileInputRef.current?.click()}>
                        📁 Upload QR Image
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        accept="image/*"
                        onChange={handleFileUpload}
                    />
                </div>

                <div id="reader-hidden" style={{ display: 'none' }}></div>
                {showScanner && (
                    <div id="reader" style={{ width: '100%', marginBottom: '1rem', border: '1px solid #444', borderRadius: '8px' }}></div>
                )}

                <textarea 
                  value={voucherData}
                  onChange={(e) => setVoucherData(e.target.value)}
                  placeholder='Paste Voucher JSON data here...'
                  rows={4}
                  style={{ width: '100%', padding: '1rem', background: '#222', color: '#0f0', borderRadius: '8px', fontFamily: 'monospace', border: '1px solid #444' }}
                />
                
                <button className="btn" onClick={handleProcessVoucher} style={{ width: '100%', marginTop: '1rem', background: '#00ff88', color: '#000' }}>
                  Process Payment
                </button>
          </div>
        ) : (
          <div>
              <p style={{ color: '#bbb' }}>Ask the beneficiary to enter their <strong>Secure 4-Digit PIN</strong> to authorize this transaction.</p>
              
              <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Beneficiary Address / ID</label>
                  <input 
                      placeholder="0x..." 
                      value={bioAddress}
                      onChange={(e) => setBioAddress(e.target.value)}
                      style={{ marginBottom: '1rem', fontFamily: 'monospace' }}
                  />
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Amount to Charge (rUSD)</label>
                  <input 
                      placeholder="e.g. 50" 
                      type="number"
                      value={bioAmount}
                      onChange={(e) => setBioAmount(e.target.value)}
                  />
              </div>

              <button className="btn" style={{ width: '100%', background: '#ff007a', color: '#fff', border: 'none' }} onClick={() => setShowAuthModal(true)}>
                  💳 Initiate Charge
              </button>
          </div>
        )}

        {/* Biometric/PIN POS Modal */}
        {showAuthModal && (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
                <div style={{ background: '#111', padding: '2rem', borderRadius: '16px', border: '1px solid #00d0ff', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                    <h2 style={{ color: '#fff', marginBottom: '1rem' }}>🔐 Beneficiary Authorization</h2>
                    <p style={{ color: '#aaa', marginBottom: '2rem' }}>Ask the Beneficiary to enter their <strong>Secure 4-Digit PIN</strong> to authorize this transaction.</p>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                        <input 
                            type="password" 
                            placeholder="• • • •" 
                            maxLength={4}
                            value={pinInput}
                            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', width: '150px', padding: '0.5rem', borderRadius: '8px', border: '1px solid #444', background: '#333', color: '#fff' }} 
                            onChange={(e) => {
                                setPinInput(e.target.value);
                                if(e.target.value.length === 4) handlePinCharge(e.target.value);
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                         <button className="btn" style={{ background: 'transparent', border: '1px solid #666' }} onClick={() => setShowAuthModal(false)}>
                            Cancel Transaction
                        </button>
                    </div>
                </div>
            </div>
        )}

        {status && <div style={{ marginTop: '1rem', padding: '1rem', background: status.includes('Success') ? 'rgba(0,255,136,0.2)' : 'rgba(255,100,100,0.2)', borderRadius: '8px', fontWeight: 'bold', wordBreak: 'break-all' }}>{status}</div>}
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
