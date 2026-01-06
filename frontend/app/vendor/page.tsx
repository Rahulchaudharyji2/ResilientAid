"use client";
import { useState } from 'react';
import { useWriteContract, useAccount, useReadContract } from 'wagmi';
import { RELIEF_FUND_ADDRESS, RELIEF_FUND_ABI, RELIEF_TOKEN_ADDRESS, RELIEF_TOKEN_ABI } from '../../config/contracts';
import { parseEther, formatEther } from 'viem';

export default function VendorDashboard() {
  const { address } = useAccount();
  const [voucherData, setVoucherData] = useState('');
  const [status, setStatus] = useState('');
  
  const { writeContractAsync } = useWriteContract();

  // 1. Fetch Vendor Balance
  const { data: balanceData } = useReadContract({
    address: RELIEF_TOKEN_ADDRESS as `0x${string}`,
    abi: RELIEF_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!address, refetchInterval: 3000 }
  });

  // 2. Fetch Category
  const { data: categoryId } = useReadContract({
    address: RELIEF_FUND_ADDRESS as `0x${string}`,
    abi: RELIEF_FUND_ABI,
    functionName: 'entityCategory',
    args: [address],
  });

  // 3. Get Category Name
  const { data: categoryData } = useReadContract({
      address: RELIEF_FUND_ADDRESS as `0x${string}`,
      abi: RELIEF_FUND_ABI,
      functionName: 'categories',
      args: [categoryId ? BigInt(categoryId as bigint) : BigInt(0)],
      query: { enabled: !!categoryId }
  });

  const formattedBalance = balanceData ? formatEther(balanceData as bigint) : '0';
  const categoryName = categoryData ? (categoryData as any)[0] : 'Unverified';

  // Transaction History State (Local for Demo)
  // In production, fetch this from 'AidUsed' events using Graph or specific query
  const [txHistory, setTxHistory] = useState<any[]>([]);

  const handleProcessVoucher = async () => {
    try {
        setStatus("Verifying and Processing Transaction...");
        const voucher = JSON.parse(voucherData);
        // Clean JSON text if user copy-pasted with extra whitespace
        
        console.log("Processing Voucher:", voucher);
        
        const tx = await writeContractAsync({
            address: RELIEF_FUND_ADDRESS as `0x${string}`,
            abi: RELIEF_FUND_ABI,
            functionName: 'processOfflineTransaction',
            args: [
                voucher.beneficiary,
                parseEther(voucher.amount.toString()),
                BigInt(voucher.nonce),
                voucher.signature
            ]
        });
        
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
    <div className="container">
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

      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <h2>Scan/Input Voucher (Offline Mode)</h2>
        <p>Accept payments from Beneficiaries in your category.</p>
        <textarea 
          value={voucherData}
          onChange={(e) => setVoucherData(e.target.value)}
          placeholder='Paste Voucher JSON data here...'
          rows={6}
          style={{ width: '100%', padding: '1rem', background: '#222', color: '#0f0', borderRadius: '8px', fontFamily: 'monospace', border: '1px solid #444' }}
        />
        
        <button className="btn" onClick={handleProcessVoucher} style={{ width: '100%', marginTop: '1rem', background: '#00ff88', color: '#000' }}>
          Process Payment
        </button>

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
