// src/sales/ProductionAuditEngine.mjs
// Audit engine untuk memonitor System Health secara real-time

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SalesEventLedger } from './SalesEventLedger.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHECKPOINT_FILE = path.join(__dirname, '../../data/ledger/latest_checkpoint.json');
const JOURNAL_FILE = path.join(__dirname, '../../data/recovery/recovery-journal.jsonl');

export class ProductionAuditEngine {
    
    static bootTime = Date.now();

    /**
     * Mengambil rangkuman kesehatan (Health Status) dari Production OS
     */
    static checkHealth() {
        const health = {
            status: 'HEALTHY',
            uptimeHours: ((Date.now() - this.bootTime) / (1000 * 60 * 60)).toFixed(2),
            lastEventSeq: SalesEventLedger._lastEventSeq,
            lastCheckpointAgeMinutes: 0,
            hangingTransactions: 0,
            duplicatePrevented: 0 // (Bisa diisi jika di-hook ke LeadDeduplicationEngine)
        };

        // 1. Cek Checkpoint Age
        if (fs.existsSync(CHECKPOINT_FILE)) {
            try {
                const cp = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
                if (cp.ts) {
                    health.lastCheckpointAgeMinutes = ((Date.now() - new Date(cp.ts)) / (1000 * 60)).toFixed(2);
                    if (health.lastCheckpointAgeMinutes > 60) {
                        health.status = 'WARNING'; // Checkpoint terlalu lama
                    }
                }
            } catch (e) {}
        }

        // 2. Cek Hanging Transactions
        if (fs.existsSync(JOURNAL_FILE)) {
            try {
                const lines = fs.readFileSync(JOURNAL_FILE, 'utf-8').split('\n').filter(Boolean);
                let pending = 0;
                let committed = 0;
                for (const line of lines) {
                    const data = JSON.parse(line);
                    if (data.status === 'PENDING') pending++;
                    else pending--;
                }
                health.hangingTransactions = Math.max(0, pending);
                if (health.hangingTransactions > 5) {
                    health.status = 'CRITICAL'; // Terlalu banyak transaksi menggantung
                }
            } catch (e) {}
        }

        return health;
    }

    /**
     * Log status health saat ini ke terminal atau file
     */
    static printHealthReport() {
        const h = this.checkHealth();
        console.log(`\n🏥 [SYSTEM HEALTH] Status: ${h.status}`);
        console.log(`⏱️  Uptime: ${h.uptimeHours} hrs | Terakhir Checkpoint: ${h.lastCheckpointAgeMinutes} menit lalu`);
        console.log(`📦 Event Sequence: EVT-${h.lastEventSeq} | ⚠️ Hanging TX: ${h.hangingTransactions}`);
        return h;
    }
}
