"use client";
import { useState, useEffect } from 'react';
import { useWriteContract, useAccount, useReadContract } from 'wagmi';
import { RELIEF_FUND_ADDRESS, RELIEF_FUND_ABI, RELIEF_TOKEN_ADDRESS, RELIEF_TOKEN_ABI } from '../../config/contracts';
import { parseEther } from 'viem';

export default function AdminDashboard() {
  const { address } = useAccount();
  const [beneficiary, setBeneficiary] = useState('');
  const [vendor, setVendor] = useState('');
  const [status, setStatus] = useState('');
  const [faucetAmount, setFaucetAmount] = useState('1000');
  
  // Category Management
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('1'); // Default to ID 1

  const { writeContractAsync } = useWriteContract();

  const handleAddCategory = async () => {
      try {
          setStatus(`Creating Category: ${newCategoryName}...`);
          await writeContractAsync({
              address: RELIEF_FUND_ADDRESS as `0x${string}`,
              abi: RELIEF_FUND_ABI,
              functionName: 'addCategory',
              args: [newCategoryName],
          });
          setStatus(`Category '${newCategoryName}' created!`);
          setNewCategoryName('');
      } catch (error: any) {
          console.error(error);
          setStatus(`Error: ${error.shortMessage || error.message}`);
      }
  };

  const handleWhitelistBeneficiary = async () => {
    try {
      setStatus(`Whitelisting Beneficiary ${beneficiary} to Category ${selectedCategory}...`);
      await writeContractAsync({
        address: RELIEF_FUND_ADDRESS as `0x${string}`,
        abi: RELIEF_FUND_ABI,
        functionName: 'whitelistBeneficiary',
        args: [beneficiary, BigInt(selectedCategory)],
      });
      setStatus('Beneficiary Whitelisted successfully!');
    } catch (error: any) {
      console.error(error);
      setStatus(`Error: ${error.message || 'Transaction failed'}`);
    }
  };

  const handleWhitelistVendor = async () => {
    try {
      setStatus(`Whitelisting Vendor ${vendor} to Category ${selectedCategory}...`);
      await writeContractAsync({
        address: RELIEF_FUND_ADDRESS as `0x${string}`,
        abi: RELIEF_FUND_ABI,
        functionName: 'whitelistVendor',
        args: [vendor, BigInt(selectedCategory)],
      });
      setStatus('Vendor Whitelisted successfully!');
    } catch (error: any) {
        console.error("Vendor Whitelist Error:", error);
        setStatus(`Error: ${error.shortMessage || error.message || 'Transaction failed'}`);
    }
  };

  const handleFundWallet = async () => {
    if (!address) return setStatus("Please connect wallet first");
    try {
      setStatus(`Simulating Bybit Inflow... Minting ${faucetAmount} rUSD...`);
      // Note: In new contract, distributeAid takes specific beneficiaries.
      // For Faucet, we will just mint to Admin for demo purposes, 
      // but distributeAid Logic requires verified beneficiaries.
      // So we will whitelist Admin as a beneficiary of Category 1 first just in case?
      // Actually, let's just use the distributeAid to ourselves if we are whitelisted.
      // Or better, for the faucet, we might need a raw mint function or just assume Admin is a beneficiary.
      
      
      // Step 1: Check if Admin is already a beneficiary (required to receive Mint)
      // Since we don't have a direct 'isBeneficiary' hook setup here, we'll try to whitelist first
      // or we can just blindly attempt to whitelist (it might revert if already whitelisted depending on contract Logic, 
      // but our contract just sets bool = true, so it's idempotent).
      // Let's just do it sequentially for the 'Demo Experience'.
      
      setStatus(`STEP 1: Ensuring Admin is whitelisted for Category 1...`);
      try {
          await writeContractAsync({
            address: RELIEF_FUND_ADDRESS as `0x${string}`,
            abi: RELIEF_FUND_ABI,
            functionName: 'whitelistBeneficiary',
            args: [address, BigInt(1)], // Default to Category 1
          });
      } catch (e) {
          // Ignore error if already whitelisted or category doesn't exist (user will see next error)
          console.log("Whitelist attempt skipped or failed (might already be whitelisted)", e);
      }

      // Step 2: Mint/Distribute
      setStatus(`STEP 2: Minting ${faucetAmount} rUSD to Admin...`);
      await writeContractAsync({
        address: RELIEF_FUND_ADDRESS as `0x${string}`,
        abi: RELIEF_FUND_ABI,
        functionName: 'distributeAid',
        args: [[address], parseEther(faucetAmount)],
      });
      setStatus(`Success! Minted ${faucetAmount} rUSD to Admin (Category 1).`);
    } catch (error: any) {
        console.error(error);
        setStatus(`Funding Failed: ${error.message}`);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Admin Console</h1>
        <p>Manage Categories & Participants</p>
      </header>

      {/* Category Creation */}
      <div className="card" style={{ border: '1px solid #00d0ff', marginBottom: '2rem' }}>
          <h3>1. Create Relief Campaign (Category)</h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
              <input 
                  placeholder="e.g. Earthquake Fund" 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <button className="btn" onClick={handleAddCategory}>Add Category</button>
          </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="card">
          <h3>2. Whitelist Beneficiary</h3>
          <label>Assign to Category ID</label>
          <input 
            type="number" 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)} 
            style={{ marginBottom: '1rem' }}
          />
          <input 
            placeholder="Address (0x...)" 
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
          />
          <button className="btn" onClick={handleWhitelistBeneficiary}>Add Beneficiary</button>
        </div>

        <div className="card">
          <h3>3. Whitelist Vendor</h3>
          <label>Assign to Category ID</label>
          <input 
            type="number" 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)} 
            style={{ marginBottom: '1rem' }}
          />
          <input 
            placeholder="Address (0x...)" 
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
          />
          <button className="btn" onClick={handleWhitelistVendor}>Verify Vendor</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem', border: '1px solid #ffd700' }}>
        <h3>4. Distribute Aid (Fund Beneficiary)</h3>
        <p>Send rUSD tokens to a verified Beneficiary.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', marginTop: '1rem' }}>
            <input 
                placeholder="Beneficiary Address (0x...)" 
                value={beneficiary} // Re-using state for demo simplicity, or create new state 'fundRecipient'
                onChange={(e) => setBeneficiary(e.target.value)}
            />
            <input 
                placeholder="Amount (rUSD)" 
                value={faucetAmount}
                onChange={(e) => setFaucetAmount(e.target.value)}
            />
            <button className="btn" style={{ background: '#ffd700', color: '#000' }} onClick={() => {
                // Inline handler to reuse distributeAid logic but for a specific target
                if (!beneficiary) return setStatus("Enter Beneficiary Address");
                setStatus(`Distributing ${faucetAmount} rUSD to ${beneficiary}...`);
                writeContractAsync({
                    address: RELIEF_FUND_ADDRESS as `0x${string}`,
                    abi: RELIEF_FUND_ABI,
                    functionName: 'distributeAid',
                    args: [[beneficiary], parseEther(faucetAmount)],
                }).then(() => setStatus("Aid Distributed Successfully!"))
                  .catch((e: any) => setStatus(`Error: ${e.message}`));
            }}>
                Send Funds
            </button>
        </div>

        <hr style={{ margin: '2rem 0', borderColor: '#444' }} />

        <h3>Testnet Faucet (Admin Only)</h3>
        <p>Mint rUSD to yourself (Admin) for testing.</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn" style={{ background: '#333', color: '#ffd700', border: '1px solid #ffd700' }} onClick={handleFundWallet}>
                Mint 1000 rUSD to Self
            </button>
        </div>
      </div>

      {status && <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', wordBreak: 'break-all' }}>{status}</div>}
    </div>
  );
}
