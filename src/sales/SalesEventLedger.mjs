// src/sales/SalesEventLedger.mjs
// SalesEventLedger — Blackbox recorder of the Sales OS

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEDGER_DIR = path.join(__dirname, '../../data/ledger');

export class SalesEventLedger {
    static _filePath(monthKey) {
        if (!fs.existsSync(LEDGER_DIR)) fs.mkdirSync(LEDGER_DIR, { recursive: true });
        return path.join(LEDGER_DIR, `ledger_${monthKey}.jsonl`);
    }

    static _getMonthKey() {
        const d = new Date();
        return `${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    /**
     * Catat aktivitas ke buku besar
     * @param {string} sourceModule - Nama modul yang mencatat (misal: 'ResearchAgent', 'Governor')
     * @param {string} phone - Nomor target
     * @param {string} event - Nama event (misal: 'DISCOVERED', 'SCORED')
     * @param {Object} details - Data tambahan terkait event
     */
    static record(sourceModule, phone, event, details = {}) {
        const entry = {
            ts: new Date().toISOString(),
            module: sourceModule,
            phone,
            event,
            ...details
        };

        const file = this._filePath(this._getMonthKey());
        fs.appendFileSync(file, JSON.stringify(entry) + '\n', 'utf-8');
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
