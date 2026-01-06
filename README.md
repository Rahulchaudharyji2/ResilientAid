# Resilient-Aid: ZK-Powered Offline Stablecoin Relief System

> **Revolutionizing disaster relief with transparent, offline-resilient, and rapid aid distribution.**

![Project Status](https://img.shields.io/badge/Status-MVP_Complete-success)
![Blockchain](https://img.shields.io/badge/Blockchain-Polygon%20%2F%20Localhost-blue)
![Frontend](https://img.shields.io/badge/Frontend-Next.js%2014-black)

## 1. Problem Statement
Traditional aid systems are **slow, corrupt, and break down** when infrastructure (internet/power) fails during disasters.
- **Delays**: Funds take days or weeks to reach victims.
- **Leakage**: Intermediaries syphon off funds.
- **Dependency**: Digital payments fail without internet.
- **Privacy**: Beneficiaries are often exposed.

## 2. Our Solution
**Resilient-Aid** is a decentralized Civic Tech solution that ensures aid reaches verified beneficiaries instantly, transparently, and **even without internet connectivity**.

By leveraging **Polygon** for low-cost transactions and an **Offline Voucher System** (simulating ZK-Rollups/Account Abstraction), we bridge the gap between donors and those in need.

## 3. Key Features (MVP)
*   **🔌 Wallet Connection**: Seamless integration with **MetaMask** and **RainbowKit**.
*   **⚡ Instant Distribution**: Admin distributes stablecoins (`rUSD`) to whitelisted beneficiaries in seconds.
*   **🔒 Spending Controls**: Smart Contracts restrict beneficiaries to spending funds **ONLY** at verified vendors.
*   **📵 Offline "Voucher" Payments**: The "Killer Feature". Beneficiaries generate a cryptographically signed QR Code offline. Vendors scan and settle it when they regain connectivity.
*   **💰 Bybit Funding Simulator**: Simulates real-time funding injections from major donors/exchanges into the Relief Fund.
*   **🛡️ Public Audit Trail**: All transactions are immutable and verifiable on the blockchain.

## 4. Technical Architecture
| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Blockchain** | Polygon / Hardhat | Ledger for transparency and finality. |
| **Contracts** | Solidity (v0.8.20) | `ReliefToken` (ERC20 + Controls), `ReliefFund` (Logic). |
| **Frontend** | Next.js 14 + Wagmi | Professional, Glassmorphism-based User Interface. |
| **Offline** | EIP-712 Signatures | Secure offline authorization (Voucher system). |
| **Simulation** | Mock Faucet | Simulates Exchange API funding flow. |

## 5. Deployment Guide (Localhost Demo)

This MVP is configured to run on a local blockchain for a flawless demo experience.

### Prerequisites
- Node.js (v18+)
- MetaMask Wallet

### Step 1: Start Local Blockchain
```bash
cd contracts
npm install
npx hardhat node
```
*Keep this terminal running.*

### Step 2: Deploy Contracts
In a new terminal:
```bash
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```
*Note the deployed addresses; the frontend validates them automatically.*

### Step 3: Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)**

## 5. Resilient-Aid: Smooth & Speedy Working Flow

### 1. The Donor Journey (The Funding Path)
**Goal**: Simple, reliable, and transparent donation.
*   **Donate**: Donor visits the website, selects amount, and clicks "Donate Now".
*   **Verify**: Payment is processed via Gateway/CEX API (Bybit) and converted to stablecoins instantly.
*   **Track**: Donor receives a Transaction ID and views the live wallet balance on the dashboard.
*   **Speed**: < 2 minutes. Faster than bank transfers.

### 2. The Admin/NGO Journey (The Management Path)
**Goal**: managing beneficiaries and distributing funds efficiently.
*   **Onboard**: Admin inputs beneficiary data (Wallet Address) and whitelists them on-chain.
*   **Distribute**: One-click Mass Distribution to all whitelisted addresses via Smart Contract.
*   **Control**: Admin sets spend categories (e.g., Medicine, Ration) to prevent misuse.
*   **Speed**: Bulk distribution in minutes. No paperwork.

### 3. The Beneficiary Journey (The Recipient Path)
**Goal**: Accessing essential aid with dignity.
*   **Receive**: Instant notification in the app: "You received 50 rUSD".
*   **Shop**: Visits a local vendor and selects essential items.
*   **Pay (Offline)**: Generates a **Secure QR Code** (Voucher) on their phone even without internet.
*   **Speed**: Instant availability. No bank visits. No carrying cash.

### 4. The Vendor Journey (The Settlement Path)
**Goal**: Secure sales and rapid settlement.
*   **Scan & Sell**: Vendor scans the Beneficiary's QR Code, enters amount, and confirms.
*   **Sync (Offline Mode)**: If offline, the transaction is cryptographically stored and auto-synced when online.
*   **Receive Funds**: Vendor receives stablecoins immediately, which can be used for restocking.
*   **Speed**: Instant settlement. improved cash flow.

---

### **Why this Flow is Superior:**
*   **Speed**: Every step is optimized for seconds/minutes.
*   **UX**: Simple interface requiring zero crypto knowledge.
*   **Trust**: End-to-end on-chain tracking for auditability.

## 6. Smart Contracts
- **ReliefToken (rUSD)**: `contracts/ReliefToken.sol`
  - Enforces: `transfer(beneficiary -> unverified) = REVERT`.
- **ReliefFund**: `contracts/ReliefFund.sol`
  - Handles: `processOfflineTransaction(signature)` ensuring trustless settlement.

---
*Built by Team Antigravity for the National Level Web3 Hackathon.*
