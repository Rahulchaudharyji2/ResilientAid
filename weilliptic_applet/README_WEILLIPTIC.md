
# 🦀 Weilliptic Deployment Guide (MANDATORY)

This folder contains the **Rust Applet** required for the Weilliptic Hackathon deployment.

## 📂 Files Included
1.  `src/lib.rs` - The Logic (Audit Logging Counter).
2.  `Cargo.toml` - The Build Configuration.
3.  `audit.widl` - The Interface Definition.

## 🚀 How to Deploy (Step-by-Step)

Since Weilliptic uses **Rust/WASM**, you must deploy this from a machine with `cargo` and `weilliptic-cli` installed.

### Option 1: Via CLI (Preferred)
1.  **Install Rust:** `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
2.  **Install Weilliptic CLI:** (Follow their docs: https://docs.weilliptic.ai)
3.  **Build:**
    ```bash
    cd weilliptic_applet
    cargo build --target wasm32-unknown-unknown --release
    ```
4.  **Deploy:**
    ```bash
    weilliptic-cli deploy --wasm target/wasm32-unknown-unknown/release/audit_log.wasm --widl audit.widl
    ```
5.  **Copy Address:** The CLI will output a `Contract Address` (e.g., `7b2...xyz`).

### Option 3: Via SDK (Mentor Recommended) 🎓
If mentors asked for "SDK" or "Scripted Deployment", run this:

1.  **Install SDK:** (Already done) `npm install -g @weilliptic/weil-sdk`
2.  **Build WASM:** `cargo build --target wasm32-unknown-unknown --release`
3.  **Run Deploy Script:**
    ```bash
    node deploy_with_sdk.js
    ```
4.  It will output a **Contract Address**. Copy that!

## ✅ Final Integration
1.  Copy the **Contract Address** you got above.

2.  Go to **Resilient-Aid Admin Panel** (localhost:3000/admin).
3.  Scroll to **"6. Protocol Audit (Hybrid Deployment)"**.
4.  Paste the address and click **"Log Audit Record"**.

**Congratulations! You have satisfied the deployment requirement.** 🏆
