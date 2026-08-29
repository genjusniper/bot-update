// src/sales/SalesTimeline.mjs
// SalesTimeline — Timeline cerita penjualan per lead
// AI membaca ini untuk memahami "cerita", bukan sekadar CRM status.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TIMELINE_DIR = path.join(__dirname, '../../data/timelines');

export const TimelineEvent = {
    DISCOVERED:    'DISCOVERED',
    VERIFIED:      'VERIFIED',
    QUALIFIED:     'QUALIFIED',
    CONTACTED:     'CONTACTED',
    REPLIED:       'REPLIED',
    CURIOUS:       'CURIOUS',
    INTERESTED:    'INTERESTED',
    ASKED_PRICE:   'ASKED_PRICE',
    OBJECTION:     'OBJECTION',
    NEGOTIATION:   'NEGOTIATION',
    OFFER_SENT:    'OFFER_SENT',
    THINKING:      'THINKING',
    FOLLOW_UP:     'FOLLOW_UP',
    ORDER:         'ORDER',
    HANDOFF:       'HANDOFF',
    LOST:          'LOST',
    REPEAT:        'REPEAT',
    NOTE:          'NOTE',
};

export class SalesTimeline {
    static _filePath(phone) {
        if (!fs.existsSync(TIMELINE_DIR)) fs.mkdirSync(TIMELINE_DIR, { recursive: true });
        const sanitized = phone.replace(/[^0-9a-z@._-]/gi, '_');
        return path.join(TIMELINE_DIR, `${sanitized}.json`);
    }

    static _load(phone) {
        const f = this._filePath(phone);
        if (!fs.existsSync(f)) return [];
        try { return JSON.parse(fs.readFileSync(f, 'utf-8')); } catch { return []; }
    }

    static _save(phone, timeline) {
        fs.writeFileSync(this._filePath(phone), JSON.stringify(timeline, null, 2), 'utf-8');
    }

    /**
     * Tambah event ke timeline
     * @param {string} phone
     * @param {string} event - TimelineEvent.*
     * @param {string} notes - detail singkat
     * @param {Object} metadata - data tambahan (phase, score, offer, dll)
     */
    static append(phone, event, notes = '', metadata = {}) {
        const timeline = this._load(phone);
        const entry = {
            ts: new Date().toISOString(),
            date: new Date().toLocaleDateString('id-ID'),
            event,
            notes,
            ...metadata,
        };
        timeline.push(entry);
        this._save(phone, timeline);
        return entry;
    }

    /**
     * Ambil semua event
     */
    static getAll(phone) {
        return this._load(phone);
    }

    /**
     * Ambil event terakhir
     */
    static getLast(phone, n = 1) {
        const tl = this._load(phone);
        return n === 1 ? tl[tl.length - 1] : tl.slice(-n);
    }

    /**
     * Hitung berapa kali event tertentu terjadi
     */
    static countEvent(phone, event) {
        return this._load(phone).filter(e => e.event === event).length;
    }

    /**
     * Format timeline sebagai teks untuk AI prompt
     * Hanya kirim N event terakhir untuk hemat token
     */
    static formatForAI(phone, maxEvents = 8) {
        const tl = this._load(phone);
        if (tl.length === 0) return '';

        const recent = tl.slice(-maxEvents);
        const lines = ['=== SALES TIMELINE ==='];
        for (const e of recent) {
            lines.push(`${e.date} → [${e.event}] ${e.notes || ''}`);
        }
        lines.push('======================');
        return lines.join('\n');
    }

    /**
     * Buat ringkasan cerita lead dalam 1–2 kalimat untuk AI
     */
    static summarize(phone) {
        const tl = this._load(phone);
        if (tl.length === 0) return 'Lead baru, belum ada riwayat.';

        const first = tl[0];
        const last  = tl[tl.length - 1];
        const days  = Math.round((new Date(last.ts) - new Date(first.ts)) / 86400000);
        const objCount = this.countEvent(phone, TimelineEvent.OBJECTION);
        const fuCount  = this.countEvent(phone, TimelineEvent.FOLLOW_UP);

        return [
            `Lead ditemukan ${first.date}, sekarang status: ${last.event}.`,
            days > 0 ? `Sudah ${days} hari dalam pipeline.` : '',
            objCount > 0 ? `Ada ${objCount} keberatan.` : '',
            fuCount > 0  ? `${fuCount}x follow-up sudah dilakukan.` : '',
        ].filter(Boolean).join(' ');
    }

    /**
     * Deteksi sinyal bahaya dari timeline (stagnasi, berulang, dll)
     */
    static detectWarnings(phone) {
        const tl = this._load(phone);
        const warnings = [];

        const objCount = this.countEvent(phone, TimelineEvent.OBJECTION);
        if (objCount >= 3) warnings.push('REPEATED_OBJECTION');

        const fuCount = this.countEvent(phone, TimelineEvent.FOLLOW_UP);
        if (fuCount >= 3) warnings.push('TOO_MANY_FOLLOWUPS');

        if (tl.length >= 2) {
            const last = tl[tl.length - 1];
            const daysSinceLast = (Date.now() - new Date(last.ts).getTime()) / 86400000;
            if (daysSinceLast > 14) warnings.push('STALE_LEAD');
        }

        const lastEvents = tl.slice(-4).map(e => e.event);
        if (new Set(lastEvents).size <= 1) warnings.push('STAGNANT_PIPELINE');

        return warnings;
    }
}
