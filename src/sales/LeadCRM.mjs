// src/sales/LeadCRM.mjs
// LeadCRM — Penyimpan state & history setiap calon pembeli (lead) santan
// Data disimpan ke: data/leads/{phone}.json

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEADS_DIR = path.join(__dirname, '../../data/leads');

// Status funnel sales
export const LeadStatus = {
    NEW:          'NEW',          // baru ditemukan, belum dikontak
    CONTACTED:    'CONTACTED',    // sudah dikirim pesan pertama
    REPLIED:      'REPLIED',      // sudah balas
    CURIOUS:      'CURIOUS',      // menunjukkan rasa ingin tahu
    INTERESTED:   'INTERESTED',   // jelas tertarik
    ASKED_PRICE:  'ASKED_PRICE',  // sudah tanya harga
    THINKING:     'THINKING',     // sedang pertimbangkan
    ORDER:        'ORDER',        // siap beli / sudah pesan
    FOLLOW_UP:    'FOLLOW_UP',    // jadwal follow-up aktif
    LOST:         'LOST',         // tidak tertarik / tidak balas
    REPEAT:       'REPEAT',       // pelanggan berulang
};

export class LeadCRM {
    static _ensureDir() {
        if (!fs.existsSync(LEADS_DIR)) {
            fs.mkdirSync(LEADS_DIR, { recursive: true });
        }
    }

    static _filePath(phone) {
        const sanitized = phone.replace(/[^0-9a-z@._-]/gi, '_');
        return path.join(LEADS_DIR, `${sanitized}.json`);
    }

    /**
     * Membuat lead baru dari QualifiedLead
     * @param {Object} qualifiedLead - output dari LeadQualificationEngine
     * @returns {Object} lead yang baru dibuat
     */
    static create(qualifiedLead) {
        this._ensureDir();
        const filePath = this._filePath(qualifiedLead.phone);

        // Jangan timpa jika sudah ada
        if (fs.existsSync(filePath)) {
            return this.load(qualifiedLead.phone);
        }

        const lead = {
            phone: qualifiedLead.phone,
            name: qualifiedLead.name || 'Unknown',
            businessName: qualifiedLead.businessName || '',
            businessType: qualifiedLead.businessType || 'UNKNOWN',
            location: qualifiedLead.location || '',
            score: qualifiedLead.score || 'MEDIUM',
            potentialVolume: qualifiedLead.potentialVolume || 'UNKNOWN',
            status: LeadStatus.NEW,
            contactHistory: [],
            followUpCount: 0,
            lastContact: null,
            nextFollowUp: null,
            notes: qualifiedLead.notes || '',
            offerType: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        fs.writeFileSync(filePath, JSON.stringify(lead, null, 2), 'utf-8');
        return lead;
    }

    /**
     * Muat data lead berdasarkan nomor WA
     */
    static load(phone) {
        this._ensureDir();
        const filePath = this._filePath(phone);
        if (!fs.existsSync(filePath)) return null;
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch {
            return null;
        }
    }

    /**
     * Update field lead
     */
    static update(phone, updates = {}) {
        const lead = this.load(phone);
        if (!lead) return null;
        const updated = { ...lead, ...updates, updatedAt: new Date().toISOString() };
        fs.writeFileSync(this._filePath(phone), JSON.stringify(updated, null, 2), 'utf-8');
        return updated;
    }

    /**
     * Update status funnel lead
     */
    static updateStatus(phone, newStatus, notes = '') {
        const lead = this.load(phone);
        if (!lead) return null;
        const entry = {
            from: lead.status,
            to: newStatus,
            at: new Date().toISOString(),
            notes,
        };
        const updated = {
            ...lead,
            status: newStatus,
            lastContact: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            contactHistory: [...(lead.contactHistory || []), entry],
        };
        fs.writeFileSync(this._filePath(phone), JSON.stringify(updated, null, 2), 'utf-8');
        return updated;
    }

    /**
     * Catat pesan yang dikirim / diterima
     */
    static addContactEntry(phone, { direction = 'OUT', message = '', channel = 'WHATSAPP' } = {}) {
        const lead = this.load(phone);
        if (!lead) return null;
        const entry = {
            direction,     // OUT = bot kirim, IN = lead balas
            message: message.slice(0, 300),
            channel,
            at: new Date().toISOString(),
        };
        const updated = {
            ...lead,
            lastContact: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            contactHistory: [...(lead.contactHistory || []), entry],
        };
        fs.writeFileSync(this._filePath(phone), JSON.stringify(updated, null, 2), 'utf-8');
        return updated;
    }

    /**
     * Cek apakah chatId ini adalah sales lead (bukan percakapan biasa)
     */
    static isSalesLead(phone) {
        const lead = this.load(phone);
        return lead !== null && lead.status !== LeadStatus.LOST;
    }

    /**
     * Ambil semua lead berdasarkan status
     */
    static getByStatus(status) {
        this._ensureDir();
        const files = fs.readdirSync(LEADS_DIR).filter(f => f.endsWith('.json'));
        const results = [];
        for (const file of files) {
            try {
                const lead = JSON.parse(fs.readFileSync(path.join(LEADS_DIR, file), 'utf-8'));
                if (!status || lead.status === status) results.push(lead);
            } catch { /* skip invalid */ }
        }
        return results;
    }

    /**
     * Ambil semua lead yang butuh follow-up sekarang
     */
    static getDueFollowUps() {
        const now = new Date();
        return this.getByStatus(LeadStatus.FOLLOW_UP).filter(lead => {
            if (!lead.nextFollowUp) return false;
            return new Date(lead.nextFollowUp) <= now;
        });
    }

    /**
     * Set jadwal follow-up N hari dari sekarang
     */
    static scheduleFollowUp(phone, daysFromNow = 2) {
        const next = new Date();
        next.setDate(next.getDate() + daysFromNow);
        return this.update(phone, {
            status: LeadStatus.FOLLOW_UP,
            nextFollowUp: next.toISOString(),
            followUpCount: (this.load(phone)?.followUpCount || 0) + 1,
        });
    }

    /**
     * Ringkasan semua lead untuk analytics
     */
    static getSummary() {
        const all = this.getByStatus(null);
        const summary = {};
        for (const s of Object.values(LeadStatus)) summary[s] = 0;
        for (const lead of all) {
            if (summary[lead.status] !== undefined) summary[lead.status]++;
            else summary['UNKNOWN'] = (summary['UNKNOWN'] || 0) + 1;
        }
        return { total: all.length, byStatus: summary };
    }
}
