// src/sales/RecoveryJournal.mjs
// Melacak status eksekusi agar bisa resume pasca-crash

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RECOVERY_DIR = path.join(__dirname, '../../data/recovery');
const JOURNAL_FILE = path.join(RECOVERY_DIR, 'recovery-journal.jsonl');

export class RecoveryJournal {

    static _init() {
        if (!fs.existsSync(RECOVERY_DIR)) {
            fs.mkdirSync(RECOVERY_DIR, { recursive: true });
        }
    }

    /**
     * Memulai transaksi baru (sebelum dieksekusi).
     * @returns transactionId
     */
    static begin(moduleName, operation, context = {}) {
        this._init();
        const txId = `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const entry = {
            txId,
            ts: new Date().toISOString(),
            module: moduleName,
            operation,
            status: 'PENDING',
            context
        };
        fs.appendFileSync(JOURNAL_FILE, JSON.stringify(entry) + '\n', 'utf-8');
        return txId;
    }

    /**
     * Menandai transaksi sukses (Selesai).
     */
    static commit(txId) {
        this._init();
        const entry = { txId, ts: new Date().toISOString(), status: 'COMMITTED' };
        fs.appendFileSync(JOURNAL_FILE, JSON.stringify(entry) + '\n', 'utf-8');
    }

    /**
     * Menandai transaksi gagal (Batal).
     */
    static rollback(txId, reason = '') {
        this._init();
        const entry = { txId, ts: new Date().toISOString(), status: 'ROLLBACK', reason };
        fs.appendFileSync(JOURNAL_FILE, JSON.stringify(entry) + '\n', 'utf-8');
    }

    /**
     * Membaca journal untuk mencari transaksi yang 'menggantung' (PENDING tanpa COMMIT/ROLLBACK).
     */
    static getHangingTransactions() {
        if (!fs.existsSync(JOURNAL_FILE)) return [];
        
        const lines = fs.readFileSync(JOURNAL_FILE, 'utf-8').split('\n').filter(Boolean);
        const txMap = new Map();

        for (const line of lines) {
            try {
                const data = JSON.parse(line);
                if (data.status === 'PENDING') {
                    txMap.set(data.txId, data);
                } else if (data.status === 'COMMITTED' || data.status === 'ROLLBACK') {
                    txMap.delete(data.txId);
                }
            } catch (e) {}
        }

        return Array.from(txMap.values());
    }
}
