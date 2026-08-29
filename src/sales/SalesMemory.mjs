// src/sales/SalesMemory.mjs
// SalesMemory — Konteks & fakta bisnis per lead, melampaui sekadar status CRM
// Disimpan ke data/sales_memory/{phone}.json

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMORY_DIR = path.join(__dirname, '../../data/sales_memory');

const DEFAULT_MEMORY = () => ({
    // Konteks Bisnis
    businessType: null,
    estimatedPortions: null,      // porsi per hari
    estimatedUsageLiters: null,   // liter santan per minggu
    menuType: null,               // 'padang', 'jawa', 'umum', dll
    
    // Supplier Info
    currentSupplier: null,        // true/false/nama supplier
    supplierPainPoint: null,      // 'harga', 'kualitas', 'keterlambatan'
    
    // Preferensi Komunikasi
    ownerTitle: null,             // 'Pak', 'Bu', 'Kak', dll
    preferredContactTime: null,   // 'pagi', 'siang', 'malam'
    communicationStyle: null,     // 'formal', 'casual', 'singkat'
    
    // Riwayat Penawaran
    lastOfferType: null,
    lastOfferPrice: null,
    lastOfferDate: null,
    offerResponse: null,          // 'interested', 'rejected', 'thinking'
    
    // Status Sales
    productInterest: null,        // 'santan 1L', 'santan 500ml', dll
    priceRange: null,             // 'budget', 'mid', 'premium'
    nextAction: null,             // 'follow_up_harga', 'send_sample', dll
    
    // Catatan Personal
    notes: [],                    // array string catatan bebas
    
    // Metadata
    createdAt: null,
    updatedAt: null,
});

export class SalesMemory {
    static _filePath(phone) {
        const sanitized = phone.replace(/[^0-9a-z@._-]/gi, '_');
        return path.join(MEMORY_DIR, `${sanitized}.json`);
    }

    static _ensureDir() {
        if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
    }

    /**
     * Load memory untuk lead, buat baru kalau belum ada
     */
    static load(phone) {
        this._ensureDir();
        const file = this._filePath(phone);
        if (!fs.existsSync(file)) return null;
        try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch { return null; }
    }

    /**
     * Inisialisasi memory baru untuk lead
     */
    static init(phone, initialData = {}) {
        this._ensureDir();
        const existing = this.load(phone);
        if (existing) return existing;

        const mem = { ...DEFAULT_MEMORY(), ...initialData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        fs.writeFileSync(this._filePath(phone), JSON.stringify(mem, null, 2), 'utf-8');
        return mem;
    }

    /**
     * Update field-field memory
     */
    static update(phone, updates = {}) {
        this._ensureDir();
        const mem = this.load(phone) || DEFAULT_MEMORY();
        const updated = { ...mem, ...updates, updatedAt: new Date().toISOString() };
        if (!updated.createdAt) updated.createdAt = updated.updatedAt;
        fs.writeFileSync(this._filePath(phone), JSON.stringify(updated, null, 2), 'utf-8');
        return updated;
    }

    /**
     * Tambah catatan personal ke array notes
     */
    static addNote(phone, note) {
        const mem = this.load(phone) || DEFAULT_MEMORY();
        const notes = [...(mem.notes || []), { note, at: new Date().toISOString() }];
        return this.update(phone, { notes });
    }

    /**
     * Ekstrak & simpan fakta dari pesan masuk secara otomatis
     * (simple pattern matching — bisa diperluas dengan NLU)
     */
    static extractAndSave(phone, text) {
        const lower = text.toLowerCase();
        const updates = {};

        // Estimasi porsi
        const portions = lower.match(/(\d+)\s*(porsi|pax|orang)/);
        if (portions) updates.estimatedPortions = parseInt(portions[1]);

        // Estimasi liter santan
        const liters = lower.match(/(\d+)\s*(liter|l\b)/);
        if (liters) updates.estimatedUsageLiters = parseInt(liters[1]);

        // Ada supplier saat ini
        if (lower.includes('udah ada') || lower.includes('sudah ada supplier') || lower.includes('udah langganan')) {
            updates.currentSupplier = true;
        }

        // Pain point
        if (lower.includes('mahal') || lower.includes('kemahalan')) updates.supplierPainPoint = 'harga';
        if (lower.includes('telat') || lower.includes('terlambat') || lower.includes('delay')) updates.supplierPainPoint = 'keterlambatan';
        if (lower.includes('nggak segar') || lower.includes('basi') || lower.includes('kualitas')) updates.supplierPainPoint = 'kualitas';

        // Tipe menu
        if (lower.includes('padang')) updates.menuType = 'padang';
        else if (lower.includes('jawa') || lower.includes('soto') || lower.includes('opor')) updates.menuType = 'jawa';
        else if (lower.includes('kue') || lower.includes('bakery')) updates.menuType = 'bakery';

        if (Object.keys(updates).length > 0) {
            this.update(phone, updates);
        }
        return updates;
    }

    /**
     * Format memory sebagai konteks untuk AI prompt
     */
    static formatContext(phone) {
        const mem = this.load(phone);
        if (!mem) return '';

        const lines = ['=== SALES MEMORY ==='];
        if (mem.businessType) lines.push(`- Tipe bisnis: ${mem.businessType}`);
        if (mem.ownerTitle) lines.push(`- Panggil: ${mem.ownerTitle}`);
        if (mem.estimatedPortions) lines.push(`- Perkiraan porsi: ${mem.estimatedPortions} porsi/hari`);
        if (mem.estimatedUsageLiters) lines.push(`- Perkiraan santan: ${mem.estimatedUsageLiters}L/minggu`);
        if (mem.currentSupplier === true) lines.push(`- Sudah punya supplier santan saat ini`);
        if (mem.supplierPainPoint) lines.push(`- Pain point supplier sekarang: ${mem.supplierPainPoint}`);
        if (mem.lastOfferType) lines.push(`- Penawaran terakhir: ${mem.lastOfferType} (${mem.lastOfferDate || '-'})`);
        if (mem.nextAction) lines.push(`- Next action yang direncanakan: ${mem.nextAction}`);
        if (mem.notes?.length > 0) {
            const lastNote = mem.notes[mem.notes.length - 1];
            lines.push(`- Catatan terakhir: "${lastNote.note}"`);
        }
        lines.push('====================');
        return lines.join('\n');
    }
}
