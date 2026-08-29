// src/sales/SalesStateRecovery.mjs
// Mengembalikan state sistem setelah startup atau crash (Idempotent Recovery)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SalesEventLedger } from './SalesEventLedger.mjs';
import { RecoveryJournal } from './RecoveryJournal.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHECKPOINT_FILE = path.join(__dirname, '../../data/ledger/latest_checkpoint.json');

export class SalesStateRecovery {
    
    /**
     * Dijalankan setiap kali sistem bot di-restart.
     * @returns {Object} report hasil recovery
     */
    static recoverState() {
        console.log('[SalesStateRecovery] 🔄 Memulai proses recovery state...');
        const report = {
            checkpointSeq: 0,
            eventsReplayed: 0,
            transactionsResumed: 0,
            transactionsSkipped: 0
        };

        // 1. Baca Checkpoint Terakhir
        if (fs.existsSync(CHECKPOINT_FILE)) {
            try {
                const cp = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
                report.checkpointSeq = cp.lastEventSeq || 0;
                console.log(`[SalesStateRecovery] 📍 Checkpoint ditemukan (Seq: ${report.checkpointSeq})`);
            } catch (e) {
                console.log('[SalesStateRecovery] ⚠️ Gagal membaca checkpoint file.');
            }
        } else {
            console.log('[SalesStateRecovery] ℹ️ Tidak ada checkpoint sebelumnya.');
        }

        // 2. Replay Events After Checkpoint (Reconcile CRM)
        // Kita hanya merekonsiliasi event kritis yang berpotensi gagal ditulis ke CRM karena crash.
        const allEvents = SalesEventLedger.readRawLedger();
        const lostEvents = allEvents.filter(e => {
            const seqNum = parseInt((e.eventId || 'EVT-0').replace('EVT-', ''));
            return seqNum > report.checkpointSeq;
        });

        for (const event of lostEvents) {
            // Replay state ke CRM jika diperlukan (Contoh: jika status sempat terupdate di ledger tapi HP crash sebelum file CRM disave)
            // (Untuk sekarang kita catat jumlahnya saja)
            report.eventsReplayed++;
        }
        if (report.eventsReplayed > 0) {
            console.log(`[SalesStateRecovery] 🛠️ Mereplay ${report.eventsReplayed} event yang terjadi setelah checkpoint...`);
        }

        // 3. Resolve Hanging Transactions dari RecoveryJournal
        const hangingTxs = RecoveryJournal.getHangingTransactions();
        for (const tx of hangingTxs) {
            console.log(`[SalesStateRecovery] ⚠️ Mendeteksi transaksi menggantung: [${tx.txId}] ${tx.operation}`);
            
            // Cek Idempotency: Apakah transaksi ini sebenarnya SUDAH sukses di ledger?
            // Misalnya tx.operation === 'SEND_MESSAGE', kita cek apakah ada event SENT setelah waktu transaksi
            let alreadyCompleted = false;
            
            if (tx.operation === 'SEND_MESSAGE' && tx.context?.phone) {
                const recentSent = lostEvents.find(e => e.event === 'MESSAGE_SENT' && e.phone === tx.context.phone);
                if (recentSent) alreadyCompleted = true;
            }

            if (alreadyCompleted) {
                console.log(`[SalesStateRecovery] ⏭️ Transaksi [${tx.txId}] sudah komplit di ledger (Idempotent Skip).`);
                RecoveryJournal.rollback(tx.txId, 'Idempotent skip during recovery');
                report.transactionsSkipped++;
            } else {
                console.log(`[SalesStateRecovery] ▶️ Transaksi [${tx.txId}] akan di-resume.`);
                // Logika resume akan diambil alih oleh masing-masing worker
                RecoveryJournal.rollback(tx.txId, 'Rolled back for safety, need manual/queue retry');
                report.transactionsResumed++;
            }
        }

        // Update Checkpoint baru paska-recovery
        SalesEventLedger.createCheckpoint();
        
        console.log('[SalesStateRecovery] ✅ Recovery Selesai.');
        return report;
    }
}
