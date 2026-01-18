"use client";
import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useChainId } from 'wagmi';
import { getContracts, RELIEF_TOKEN_ABI, RELIEF_FUND_ABI, RELIEF_PASS_ABI } from '../../config/contracts';
import { formatEther, parseEther } from 'viem';
import QRCode from 'react-qr-code';
import Navbar from '../components/Navbar';

export default function BeneficiaryDashboard() {
  const { address } = useAccount();
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [status, setStatus] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  


  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();
  const contracts = getContracts(chainId);

  // 1. Fetch Balance (Polled)
  const { data: balanceData } = useReadContract({
    address: contracts.RELIEF_TOKEN_ADDRESS as `0x${string}`,
    abi: RELIEF_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: {
        enabled: !!address,
        refetchInterval: 2000, 
    }
  });

  // 2. Fetch Assigned Category
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

  // 4. Check if User has Relief Pass (SBT)
  const { data: hasPass } = useReadContract({
      address: contracts.RELIEF_PASS_ADDRESS as `0x${string}`,
      abi: RELIEF_PASS_ABI,
      functionName: 'hasPass',
      args: [address as `0x${string}`],
      query: { 
          enabled: !!address,
          refetchInterval: 2000 
      }
  });

  const formattedBalance = balanceData ? formatEther(balanceData as bigint) : '0';
  const categoryName = categoryData ? (categoryData as any)[0] : 'Unassigned';



  // Online Direct Transfer
  const handleDirectTransfer = async () => {
      if (!transferRecipient || !transferAmount) return setStatus("Invalid Input");
      try {
        setStatus("Processing Direct Payment via Relief Fund (Tracking)...");
        
        // Use ReliefFund.payVendor() instead of Token.transfer() to ensure stats update
        const tx = await writeContractAsync({
            address: contracts.RELIEF_FUND_ADDRESS as `0x${string}`,
            abi: RELIEF_FUND_ABI,
            functionName: 'payVendor',
            args: [
                transferRecipient as `0x${string}`,
                parseEther(transferAmount)
            ]
        });

        setStatus(`Transfer Successful! Transaction Hash: ${tx}`);
        setTransferAmount('');
        setTransferRecipient('');
    } catch (error: any) {
        console.error("Transfer failed", error);
        setStatus("Transfer Failed: " + (error.shortMessage || error.message));
    }
  };

  // PIN Setup Logic
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  
  const handleSetSecurity = async (secretOverride?: string) => {
       const secretToSet = secretOverride || newPin;
       
       if(!secretToSet || secretToSet.length < 4) return alert("Enter valid PIN");
       
       try {
           setStatus("🔐 Registering PIN on Blockchain...");
           
           const tx = await writeContractAsync({
              address: contracts.RELIEF_PASS_ADDRESS as `0x${string}`,
              abi: RELIEF_PASS_ABI,
              functionName: 'setSecurityPin',
              args: [secretToSet] 
           });
           
           setStatus("✅ Security Active! You are now protected.");
           setShowPinModal(false);
           setNewPin('');
       } catch (e: any) {
           console.error(e);
           setStatus("Failed to Set Security: " + e.message);
       }
  };

  return (
    <>
      <Navbar />
      <main className="container" style={{ marginTop: '2rem', paddingBottom: '4rem' }}>
        
        {!hasPass ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#222', borderRadius: '16px', border: '1px solid #444' }}>
                <h2 style={{ color: '#aaa', marginBottom: '1rem' }}>🆔 Identity Verification Pending</h2>
                <p style={{ color: '#666', maxWidth: '500px', margin: '0 auto' }}>
                    Your wallet is connected, but you have not been issued a <strong>Relief Pass (SBT)</strong> yet.
                </p>
                <div style={{ margin: '2rem 0', fontSize: '3rem', opacity: 0.3 }}>⌛</div>
                <p style={{ color: '#888' }}>Please contact an Administrator to verify your aid eligibility.</p>
            </div>
        ) : (
        <>
        {/* 3D Flip Card Container */}
        <div 
          className="card-container" 
          style={{ perspective: '1000px', marginBottom: '3rem', cursor: 'pointer', height: '240px' }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="relief-card-inner" style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transition: 'transform 0.8s',
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}>
             
             {/* FRONT SIDE */}
             <div className="relief-card-front" style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                background: 'linear-gradient(135deg, #00d0ff 0%, #007aff 100%)',
                borderRadius: '24px',
                padding: '2rem',
                color: 'white',
                boxShadow: '0 10px 30px rgba(0,122,255,0.3)',
                overflow: 'hidden'
             }}>
                 <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                 
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>ABHA RELIEF CARD</h3>
                        <span style={{ fontSize: '0.8rem', opacity: 0.8, letterSpacing: '2px' }}>OFFICIAL AID DOCUMENT</span>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.7rem', border: '1px solid rgba(255,255,255,0.3)' }}>
                        POLYGON SECURITY
                    </div>
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                         <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', opacity: 0.8 }}>AVAILABLE BALANCE</p>
                         <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 700 }}>
                            {formattedBalance} <span style={{ fontSize: '1rem', fontWeight: 400 }}>rUSD</span>
                         </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                         <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.8rem', opacity: 0.8 }}>CATEGORY</p>
                         <p style={{ margin: 0, fontWeight: 600 }}>{categoryName}</p>
                    </div>
                 </div>

                 <div style={{ marginTop: '1rem', textAlign: 'right', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <small style={{ opacity: 0.7 }}>Click to Flip & Scan QR 🔄</small>
                    <button 
                      onClick={(e) => {
                          e.stopPropagation(); // Prevent flip when clicking button
                          setShowPinModal(true);
                      }}
                      style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid #aaa', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                      🔒 Set Security PIN
                    </button>
                 </div>
             </div>

             {/* BACK SIDE */}
             <div className="relief-card-back" style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                background: '#fff', // White background for QR readability
                borderRadius: '24px',
                padding: '1rem',
                color: '#111',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                transform: 'rotateY(180deg)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
             }}>
                 <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#333' }}>Scan to Pay Vendor</h3>
                 <div style={{ background: 'white', padding: '5px' }}>
                    <QRCode value={address || ""} size={120} />
                 </div>
                 <p style={{ fontSize: '0.7rem', color: '#555', marginTop: '1rem', fontFamily: 'monospace' }}>
                    {address?.substring(0, 20)}...
                 </p>
             </div>
             
          </div>
        </div>
        
        {/* Pass Actions UI (Transfer/Generate Voucher) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
             {/* ... existing action cards ... */}
        </div>
        </>
        )}

      {/* PIN Setup Modal */}
        {showPinModal && (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
                <div style={{ background: '#111', padding: '2rem', borderRadius: '16px', border: '1px solid #00d0ff', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                    <h2 style={{ color: '#fff', marginBottom: '1rem' }}>🔐 Set Security PIN</h2>
                    <p style={{ color: '#aaa', marginBottom: '2rem' }}>Set a <strong>4-Digit PIN</strong> for your Relief Card. You will need this to authorize payments at Vendors.</p>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                         <input 
                            type="password" 
                            placeholder="Set 4-Digit PIN" 
                            maxLength={4}
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', width: '200px', padding: '0.5rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff' }} 
                        />
                         <button className="btn" style={{ width: '100%', background: '#00d0ff', color:'#000' }} onClick={() => handleSetSecurity()}>
                            Set PIN
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                         <button className="btn" style={{ background: 'transparent', border: '1px solid #666' }} onClick={() => setShowPinModal(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
        
        {/* Online Transfer */}
        <div className="card">
            <h2>Direct Transfer (Online)</h2>
            <p>Send funds directly to a Vendor's Wallet Address.</p>
            <label>Vendor Address</label>
            <input 
                placeholder="0x..." 
                value={transferRecipient}
                onChange={(e) => setTransferRecipient(e.target.value)}
            />
            <label>Amount (rUSD)</label>
            <input 
                type="number"
                placeholder="10" 
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
            />
            <button className="btn" style={{ background: '#00d0ff', color: 'black' }} onClick={handleDirectTransfer}>
                Send Payment
            </button>
            {status && <p style={{ marginTop: '1rem', color: status.includes('Success') ? '#00ff88' : 'orange' }}>{status}</p>}
        </div>
      </div>
      </main>
    </>
  );
}
