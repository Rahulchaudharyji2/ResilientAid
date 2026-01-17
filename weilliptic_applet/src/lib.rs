
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct AuditLog {
    total_audits: u64,
}

#[wasm_bindgen]
impl AuditLog {
    #[wasm_bindgen(constructor)]
    pub fn new() -> AuditLog {
        AuditLog { total_audits: 0 }
    }

    pub fn log_transaction(&mut self, _tx_hash: String, _amount: String) -> String {
        self.total_audits += 1;
        format!("Audit #{} Recorded: {} - Amount: {}", self.total_audits, _tx_hash, _amount)
    }

    pub fn get_total_audits(&self) -> u64 {
        self.total_audits
    }
}
