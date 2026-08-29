// src/sales/BlacklistManager.mjs
// BlacklistManager — Kelola nomor yang tidak boleh dihubungi

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLACKLIST_FILE = path.join(__dirname, '../../data/blacklist.json');

export const BlacklistReason = {
    DO_NOT_CONTACT: 'DO_NOT_CONTACT', // user minta berhenti — PERMANEN
    WRONG_NUMBER:   'WRONG_NUMBER',   // nomor tidak relevan
    COMPETITOR:     'COMPETITOR',     // pesaing
    SPAM_RISK:      'SPAM_RISK',      // kemungkinan jebakan spam
};

// Kata yang user ucapkan → otomatis DO_NOT_CONTACT
export const OPT_OUT_SIGNALS = [
    'jangan chat lagi', 'jangan hubungi', 'hapus nomor', 'stop', 'berhenti',
    'blokir', 'block', 'ga usah', 'gak usah', 'nggak usah', 'tidak usah',
    'unsubscribe', 'opt out', 'remove', 'do not contact', 'leave me alone',
    'ganggu', 'spam', 'lapor', 'laporkan',
];

export class BlacklistManager {
    static _load() {
        try {
            const dir = path.dirname(BLACKLIST_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            if (!fs.existsSync(BLACKLIST_FILE)) return {};
            return JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf-8'));
        } catch { return {}; }
    }

    static _save(data) {
        const dir = path.dirname(BLACKLIST_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }

    /**
     * Tambah nomor ke blacklist
     */
    static add(phone, reason = BlacklistReason.DO_NOT_CONTACT, notes = '') {
        const bl = this._load();
        bl[phone] = {
            reason,
            notes,
            addedAt: new Date().toISOString(),
        };
        this._save(bl);
        console.log(`[Blacklist] 🚫 ${phone} ditambahkan: ${reason}`);
        return bl[phone];
    }

    /**
     * Cek apakah nomor ada di blacklist
     */
    static isBlacklisted(phone) {
        const bl = this._load();
        return !!bl[phone];
    }

    /**
     * Ambil entry blacklist
     */
    static get(phone) {
        return this._load()[phone] || null;
    }

    /**
     * Hapus dari blacklist (hanya untuk WRONG_NUMBER, bukan DO_NOT_CONTACT)
     */
    static remove(phone) {
        const bl = this._load();
        const entry = bl[phone];
        if (entry?.reason === BlacklistReason.DO_NOT_CONTACT) {
            console.warn(`[Blacklist] ⚠️  Tidak bisa hapus DO_NOT_CONTACT: ${phone}`);
            return false;
        }
        delete bl[phone];
        this._save(bl);
        return true;
    }

    /**
     * Deteksi opt-out dari teks pesan
     */
    static detectOptOut(text) {
        if (!text) return false;
        const lower = text.toLowerCase();
        return OPT_OUT_SIGNALS.some(sig => lower.includes(sig));
    }

    /**
     * Ambil semua entry blacklist
     */
    static getAll() {
        return this._load();
    }

    /**
     * Jumlah entry per reason
     */
    static getSummary() {
        const bl = this._load();
        const summary = {};
        for (const entry of Object.values(bl)) {
            summary[entry.reason] = (summary[entry.reason] || 0) + 1;
        }
        return { total: Object.keys(bl).length, byReason: summary };
    }
}
