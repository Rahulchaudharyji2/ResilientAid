"use client";
import { useState } from 'react';
import { useAccount, useReadContract, useSignMessage, useWriteContract, useChainId } from 'wagmi';
import { getContracts, RELIEF_TOKEN_ABI, RELIEF_FUND_ABI } from '../../config/contracts';
import { formatEther, parseEther } from 'viem';
import QRCode from 'react-qr-code';
import Navbar from '../components/Navbar';

export default function BeneficiaryDashboard() {
  const { address } = useAccount();
  const [voucherAmount, setVoucherAmount] = useState('');
  const [generatedVoucher, setGeneratedVoucher] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [status, setStatus] = useState('');
  
  const { signMessageAsync } = useSignMessage();

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

  const formattedBalance = balanceData ? formatEther(balanceData as bigint) : '0';
  const categoryName = categoryData ? (categoryData as any)[0] : 'Unassigned';

  // Offline Voucher Generation
  const handleGenerateVoucher = async () => {
    if (!address) return alert("Connect Wallet first!");
    if (!voucherAmount || parseFloat(voucherAmount) <= 0) return alert("Enter valid amount");
    if (parseFloat(voucherAmount) > parseFloat(formattedBalance)) {
        return alert(`Insufficient Balance! You only have ${formattedBalance} rUSD.`);
    }

    try {
        // Convert to BigInt Wei for signing consistency with Contract
        const amountWei = parseEther(voucherAmount);
        const nonce = Date.now();
        
        // Exact message format as in ReliefFund.sol
        const message = `Authorize transfer of ${amountWei.toString()} rUSD to vendor. Nonce: ${nonce}`;
        
        // FIX: The contract verifies the signature against the HASH of the message.
        // Solidity: keccak256(bytes(message)).toEthSignedMessageHash()
        // Frontend: Sign(keccak256(message)) -> This prepends the \x19Ethereum Signed Message:\n32
        
        const { keccak256, toBytes } = await import('viem');
        const msgHash = keccak256(toBytes(message));
        
        const signature = await signMessageAsync({ message: { raw: msgHash } });
        
        const voucher = JSON.stringify({
          beneficiary: address,
          amount: amountWei.toString(), // Send Wei to vendor
          nonce: nonce,
          signature: signature,
          categoryId: categoryId ? Number(categoryId) : 0 
        });
        setGeneratedVoucher(voucher);
    } catch (error) {
        console.error("Signing failed", error);
        alert("Failed to generate voucher");
    }
  };

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

  return (
    <div className="container" style={{ paddingTop: '100px' }}>
      <Navbar />
      <header>
        <h1>My Relief Card (Abha ID)</h1>
        
        {/* Digital Identity Card */}
        <div style={{ 
            background: 'linear-gradient(135deg, #004e92, #000428)', 
            borderRadius: '16px', 
            padding: '2rem', 
            maxWidth: '400px',
            color: 'white',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            marginBottom: '2rem',
            border: '1px solid rgba(255,255,255,0.1)',
            position: 'relative'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '1px' }}>ABHA RELIEF</span>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.8rem' }}>GOVT AID</span>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <small style={{ color: '#aaa', fontSize: '0.7rem', textTransform: 'uppercase' }}>Beneficiary Name / Address</small>
                <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#fff' }}>
                    {address ? `${address.substring(0, 16)}...` : 'Connecting...'}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <div>
                    <small style={{ color: '#aaa', fontSize: '0.7rem', textTransform: 'uppercase' }}>Category</small>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#00d0ff' }}>{categoryName}</div>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                    <small style={{ color: '#aaa', fontSize: '0.7rem', textTransform: 'uppercase' }}>Available Credits</small>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00ff88' }}>{formattedBalance} <span style={{ fontSize: '0.8rem' }}>rUSD</span></div>
                 </div>
            </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
        {/* Offline Payment renamed to Benefit utilization */}
        <div className="card">
            <h2>Utilize Benefits</h2>
            <p style={{ color: '#bbb' }}>To claim items from <strong>ANY verified vendor</strong>, generating a one-time authorized QR code below.</p>
            
            <div style={{ background: '#222', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                 <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#888' }}>Value to Redeem (rUSD)</label>
                 <input 
                  type="number" 
                  value={voucherAmount}
                  onChange={(e) => setVoucherAmount(e.target.value)}
                  placeholder="e.g. 50"
                  style={{ fontSize: '1.2rem', fontWeight: 'bold' }}
                />
            </div>

            <button className="btn" style={{ width: '100%', background: '#ff007a', border: 'none' }} onClick={handleGenerateVoucher}>
                🎟️ Generate Benefit QR
            </button>
            
            {generatedVoucher && (
              <div style={{ marginTop: '1rem', background: 'white', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div id="qr-code-wrapper">
                      <QRCode value={generatedVoucher} size={200} viewBox={`0 0 256 256`} style={{ maxWidth: "100%", height: "auto" }} />
                  </div>
                  <button 
                    className="btn" 
                    style={{ marginTop: '1rem', background: '#333', fontSize: '0.9rem' }}
                    onClick={() => {
                        const svg = document.getElementById("qr-code-wrapper")?.querySelector("svg");
                        if (svg) {
                            const svgData = new XMLSerializer().serializeToString(svg);
                            const canvas = document.createElement("canvas");
                            const ctx = canvas.getContext("2d");
                            const img = new Image();
                            img.onload = () => {
                                canvas.width = img.width;
                                canvas.height = img.height;
                                ctx?.drawImage(img, 0, 0);
                                const pngFile = canvas.toDataURL("image/png");
                                const downloadLink = document.createElement("a");
                                downloadLink.download = "Relief-Voucher.png";
                                downloadLink.href = pngFile;
                                downloadLink.click();
                            };
                            img.src = "data:image/svg+xml;base64," + btoa(svgData);
                        }
                    }}
                  >
                      ⬇️ Download QR Image
                  </button>
              </div>
            )}
        </div>

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
    </div>
  );
}
