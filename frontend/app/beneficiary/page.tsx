"use client";
import { useState } from 'react';
import { useAccount, useReadContract, useSignMessage, useWriteContract } from 'wagmi';
import { RELIEF_TOKEN_ADDRESS, RELIEF_TOKEN_ABI, RELIEF_FUND_ADDRESS, RELIEF_FUND_ABI } from '../../config/contracts';
import { formatEther, parseEther } from 'viem';
import QRCode from 'react-qr-code';

export default function BeneficiaryDashboard() {
  const { address } = useAccount();
  const [voucherAmount, setVoucherAmount] = useState('');
  const [generatedVoucher, setGeneratedVoucher] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [status, setStatus] = useState('');
  
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();

  // 1. Fetch Balance (Polled)
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: RELIEF_TOKEN_ADDRESS as `0x${string}`,
    abi: RELIEF_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: {
        enabled: !!address,
        refetchInterval: 2000, 
    }
  });

  // 2. Fetch Assigned Category
  const { data: categoryId } = useReadContract({
    address: RELIEF_FUND_ADDRESS as `0x${string}`,
    abi: RELIEF_FUND_ABI,
    functionName: 'entityCategory',
    args: [address],
  });

  // 3. Get Category Name (Optional, needs fetch)
  const { data: categoryData } = useReadContract({
      address: RELIEF_FUND_ADDRESS as `0x${string}`,
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
        const amount = voucherAmount;
        const nonce = Date.now();
        const message = `Authorize transfer of ${amount} rUSD to vendor. Nonce: ${nonce}`;
        const signature = await signMessageAsync({ message });
        
        const voucher = JSON.stringify({
          beneficiary: address,
          amount: amount,
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
            address: RELIEF_FUND_ADDRESS as `0x${string}`,
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
    <div className="container">
      <header>
        <h1>Beneficiary Wallet</h1>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div className="card" style={{ padding: '1rem', border: '1px solid #00ff88' }}>
                <small>Balance</small>
                <h3>{formattedBalance} rUSD</h3>
            </div>
            <div className="card" style={{ padding: '1rem', border: '1px solid #00d0ff' }}>
                 <small>Your Relief Category</small>
                 <h3>{categoryName} (ID: {categoryId?.toString() || '0'})</h3>
            </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
        {/* Offline Payment */}
        <div className="card">
            <h2>Offline Payment (QR)</h2>
            <p>Generate a QR code to pay a Vendor in your category without internet.</p>
            <input 
              type="number" 
              value={voucherAmount}
              onChange={(e) => setVoucherAmount(e.target.value)}
              placeholder="Amount (rUSD)"
            />
            <button className="btn" onClick={handleGenerateVoucher}>Generate QR Voucher</button>
            
            {generatedVoucher && (
              <div style={{ marginTop: '1rem', background: 'white', padding: '1rem', borderRadius: '8px' }}>
                  <QRCode value={generatedVoucher} size={200} viewBox={`0 0 256 256`} style={{ maxWidth: "100%", height: "auto" }} />
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
