// src/sales/SalesEventLedger.mjs
// SalesEventLedger — Blackbox recorder of the Sales OS

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEDGER_DIR = path.join(__dirname, '../../data/ledger');

const CHECKPOINT_FILE = path.join(LEDGER_DIR, 'latest_checkpoint.json');

export class SalesEventLedger {
    static _lastEventSeq = 0;
    static _lastCheckpointTs = 0;

    static _initSeq() {
        if (this._lastEventSeq === 0) {
            this._lastCheckpointTs = Date.now();
            if (fs.existsSync(CHECKPOINT_FILE)) {
                try {
                    const cp = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
                    this._lastEventSeq = cp.lastEventSeq || 0;
                } catch (e) {}
            }
        }
    }

    static _filePath(monthKey) {
        if (!fs.existsSync(LEDGER_DIR)) fs.mkdirSync(LEDGER_DIR, { recursive: true });
        return path.join(LEDGER_DIR, `ledger_${monthKey}.jsonl`);
    }

    static _getMonthKey() {
        const d = new Date();
        return `${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    static createCheckpoint() {
        if (!fs.existsSync(LEDGER_DIR)) fs.mkdirSync(LEDGER_DIR, { recursive: true });
        const cp = {
            ts: new Date().toISOString(),
            lastEventSeq: this._lastEventSeq
        };
        fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(cp), 'utf-8');
        this._lastCheckpointTs = Date.now();
    }

    /**
     * Catat aktivitas ke buku besar secara durable
     */
    static record(sourceModule, phone, event, details = {}) {
        this._initSeq();
        this._lastEventSeq++;
        const eventId = `EVT-${this._lastEventSeq}`;

        const entry = {
            eventId,
            ts: new Date().toISOString(),
            module: sourceModule,
            phone,
            event,
            ...details
        };

        const file = this._filePath(this._getMonthKey());
        // Flush langsung ke disk
        fs.appendFileSync(file, JSON.stringify(entry) + '\n', 'utf-8');

        // Checkpoint otomatis tiap 5 menit ATAU jika event kritis
        const isCritical = ['ORDER', 'HANDOFF', 'DISCOVERED', 'DO_NOT_CONTACT'].includes(event);
        if (isCritical || Date.now() - this._lastCheckpointTs > 5 * 60 * 1000) {
            this.createCheckpoint();
        }

        return entry;
    }

    /**
     * Membaca seluruh data ledger bulan ini
     */
    static readRawLedger() {
        const filePath = this._filePath(this._getMonthKey());
        if (!fs.existsSync(filePath)) return [];
        return fs.readFileSync(filePath, 'utf-8')
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
                try { return JSON.parse(line); }
                catch { return null; }
            })
            .filter(Boolean);
    }

    /**
     * Ambil histori event spesifik untuk satu nomor
     */
    static getHistoryForLead(phone) {
        const file = this._filePath(this._getMonthKey());
        if (!fs.existsSync(file)) return [];

        const lines = fs.readFileSync(file, 'utf-8').split('\n').filter(Boolean);
        const history = [];
        for (const line of lines) {
            try {
                const parsed = JSON.parse(line);
                if (parsed.phone === phone) history.push(parsed);
            } catch (e) {
                // Abaikan baris korup
            }
        }
        return history;
    }

    /**
     * Ringkas bottleneck sistem dari data bulan ini
     * Sangat berguna untuk audit pipeline.
     */
    static auditPipelineBottlenecks() {
        const file = this._filePath(this._getMonthKey());
        if (!fs.existsSync(file)) return { error: 'Belum ada data ledger bulan ini.' };

        const lines = fs.readFileSync(file, 'utf-8').split('\n').filter(Boolean);
        const stats = {
            DISCOVERED: 0,
            VERIFIED: 0,
            QUALIFIED: 0,
            CONTACTED: 0,
            REPLIED: 0,
            INTERESTED: 0,
            ORDERED: 0,
            LOST: 0
        };

        for (const line of lines) {
            try {
                const parsed = JSON.parse(line);
                if (stats[parsed.event] !== undefined) {
                    stats[parsed.event]++;
                }
            } catch (e) {}
        }

        return {
            totalDiscovered: stats.DISCOVERED,
            verificationPassRate: stats.DISCOVERED > 0 ? (stats.VERIFIED / stats.DISCOVERED) : 0,
            responseRate: stats.CONTACTED > 0 ? (stats.REPLIED / stats.CONTACTED) : 0,
            conversionRate: stats.CONTACTED > 0 ? (stats.ORDERED / stats.CONTACTED) : 0,
            rawStats: stats
        };
    }
}
