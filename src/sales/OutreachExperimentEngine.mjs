// src/sales/OutreachExperimentEngine.mjs
// Melakukan A/B/C testing pada kalimat sapaan awal dan mencatat penggunaannya

import { SalesEventLedger } from './SalesEventLedger.mjs';

// Varian yang tersedia (bisa di-override oleh SalesLearningEngine nanti)
export const OPENING_VARIANTS = {
    A_DIRECT: 'Sapaan langsung ke poin jualan. "Halo kak, kami supplier santan murni..."',
    B_SOFT: 'Sapaan ramah tanya kabar usaha. "Halo kak, semoga usahanya lancar. Kami dari..."',
    C_VALUE: 'Sapaan fokus ke masalah mereka (basi/harga mahal). "Halo kak, sering kesulitan cari santan yang tahan lama?"'
};

export class OutreachExperimentEngine {

    /**
     * Memilih varian A/B/C berdasarkan probabilitas atau bobot
     * Untuk sekarang, kita gunakan round-robin acak (uniform distribution)
     */
    static selectVariant(lead) {
        // Jika status bukan NEW, berarti bukan percobaan sapaan awal.
        if (lead.status !== 'NEW') return null;

        const keys = Object.keys(OPENING_VARIANTS);
        const selectedKey = keys[Math.floor(Math.random() * keys.length)];
        const instruction = OPENING_VARIANTS[selectedKey];

        // Catat di ledger bahwa kita pakai varian ini untuk lead ini
        SalesEventLedger.record('OutreachExperimentEngine', lead.phone, 'EXPERIMENT_SELECTED', {
            variant: selectedKey,
            businessType: lead.businessType
        });

        return { key: selectedKey, instruction };
    }

    /**
     * Membangun directive spesifik eksperimen untuk AI
     */
    static getDirective(lead) {
        const variant = this.selectVariant(lead);
        if (!variant) return '';

        return `[OUTREACH EXPERIMENT: VARIANT ${variant.key}]\nWAJIB ikuti style sapaan ini: ${variant.instruction}`;
    }
}
