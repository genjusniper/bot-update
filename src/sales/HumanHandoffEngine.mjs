// src/sales/HumanHandoffEngine.mjs
// HumanHandoffEngine — Notifikasi ke operator manusia (extended triggers)

import { LeadCRM } from './LeadCRM.mjs';

const OPERATOR_PHONE = process.env.OPERATOR_PHONE || '628xxxxxxxxxx@s.whatsapp.net';
const OPERATOR_NAME  = process.env.OPERATOR_NAME  || 'Mas Agus';
const HIGH_VALUE_LITERS = parseInt(process.env.HIGH_VALUE_LITERS || '50');

export const HandoffTrigger = {
    ORDER:             'ORDER',             // Siap beli
    HOT_LEAD:          'HOT_LEAD',          // Sangat tertarik tapi belum konfirmasi
    PRICE_NEGOTIATION: 'PRICE_NEGOTIATION', // Minta diskon berulang
    COMPLAINT:         'COMPLAINT',         // Keluhan kualitas/pengiriman
    CUSTOM_REQUEST:    'CUSTOM_REQUEST',    // Request di luar katalog
    HIGH_VALUE_ORDER:  'HIGH_VALUE_ORDER',  // Pesanan besar (> threshold liter)
    CONFUSED_INTENT:   'CONFUSED_INTENT',   // Bot tidak bisa determine intent 3x
    ANGRY_CUSTOMER:    'ANGRY_CUSTOMER',    // Nada emosional tinggi/marah
};

// Signal per trigger
const TRIGGER_SIGNALS = {
    COMPLAINT:      ['komplain', 'kecewa', 'tidak sesuai', 'kurang baik', 'jelek', 'basi', 'telat lagi', 'kecewa banget', 'minta ganti', 'refund'],
    CUSTOM_REQUEST: ['ukuran lain', 'varian lain', 'bisa custom', 'minta khusus', 'packaging berbeda', 'kemasan lain', 'bisa curah'],
    ANGRY_CUSTOMER: ['brengsek', 'bodoh', 'goblok', 'sialan', 'anjing', 'bangsat', 'ngamuk', 'lapor', 'sebar', 'viral'],
};

export class HumanHandoffEngine {
    /**
     * Evaluasi apakah lead butuh handoff — extended multi-trigger
     * @param {Object} lead
     * @param {string} detectedPhase
     * @param {string} text - pesan terbaru dari lead
     * @param {Object} extras - { priceObjectionCount, confusedCount }
     * @returns {Object} { needsHandoff, trigger, urgency }
     */
    static evaluate(lead, detectedPhase, text = '', extras = {}) {
        const lower = text.toLowerCase();

        // ORDER — sudah siap beli
        if (detectedPhase === 'ORDER' || lead?.status === 'ORDER') {
            return { needsHandoff: true, trigger: HandoffTrigger.ORDER, urgency: 'HIGH' };
        }

        // HIGH_VALUE — deteksi volume besar
        const litersMatch = text.match(/(\d+)\s*(liter|L)\b/i);
        if (litersMatch && parseInt(litersMatch[1]) >= HIGH_VALUE_LITERS) {
            return { needsHandoff: true, trigger: HandoffTrigger.HIGH_VALUE_ORDER, urgency: 'HIGH' };
        }

        // PRICE_NEGOTIATION — sudah 2x keberatan harga
        if ((extras.priceObjectionCount || 0) >= 2) {
            return { needsHandoff: true, trigger: HandoffTrigger.PRICE_NEGOTIATION, urgency: 'MEDIUM' };
        }

        // COMPLAINT
        if (TRIGGER_SIGNALS.COMPLAINT.some(s => lower.includes(s))) {
            return { needsHandoff: true, trigger: HandoffTrigger.COMPLAINT, urgency: 'HIGH' };
        }

        // CUSTOM_REQUEST
        if (TRIGGER_SIGNALS.CUSTOM_REQUEST.some(s => lower.includes(s))) {
            return { needsHandoff: true, trigger: HandoffTrigger.CUSTOM_REQUEST, urgency: 'MEDIUM' };
        }

        // ANGRY_CUSTOMER
        if (TRIGGER_SIGNALS.ANGRY_CUSTOMER.some(s => lower.includes(s))) {
            return { needsHandoff: true, trigger: HandoffTrigger.ANGRY_CUSTOMER, urgency: 'HIGH' };
        }

        // CONFUSED_INTENT — bot sudah bingung 3x
        if ((extras.confusedCount || 0) >= 3) {
            return { needsHandoff: true, trigger: HandoffTrigger.CONFUSED_INTENT, urgency: 'LOW' };
        }

        return { needsHandoff: false, trigger: null, urgency: null };
    }

    // Backward compat
    static needsHandoff(lead, detectedPhase) {
        return this.evaluate(lead, detectedPhase).needsHandoff;
    }


    /**
     * Jalankan handoff: kirim notif ke operator + update CRM + kirim konfirmasi ke lead
     * @param {Object} lead
     * @param {string} latestMessage - pesan terakhir dari lead
     * @param {Function} sendMessageFn - async (phone, text) => void
     * @returns {boolean} sukses atau tidak
     */
    static async execute(lead, latestMessage, sendMessageFn) {
        try {
            // 1. Bangun ringkasan untuk operator
            const summary = this._buildSummary(lead, latestMessage);

            // 2. Kirim notif ke operator (Mas Agus)
            await sendMessageFn(OPERATOR_PHONE, summary);
            console.log(`[HumanHandoff] 🔔 Notifikasi terkirim ke ${OPERATOR_NAME} untuk lead: ${lead.businessName}`);

            // 3. Kirim konfirmasi singkat ke lead
            const confirmation = `siap kak, saya teruskan ke bagian order ya — nanti ada yang follow up langsung 🙏`;
            await sendMessageFn(lead.phone, confirmation);
            LeadCRM.addContactEntry(lead.phone, { direction: 'OUT', message: confirmation });

            // 4. Update CRM
            LeadCRM.update(lead.phone, {
                status: 'ORDER',
                notes: `[HANDOFF] Diteruskan ke operator pada ${new Date().toISOString()}`,
            });

            return true;
        } catch (err) {
            console.error(`[HumanHandoff] ❌ Gagal eksekusi handoff: ${err.message}`);
            return false;
        }
    }

    /**
     * Bangun teks ringkasan untuk operator
     */
    static _buildSummary(lead, latestMessage) {
        const history = (lead.contactHistory || [])
            .filter(h => h.direction === 'IN')
            .slice(-5) // 5 pesan terakhir dari lead
            .map(h => `  → ${h.message?.slice(0, 100) || ''}`)
            .join('\n');

        const revEstimate = lead.potentialVolume
            ? `~${lead.potentialVolume}`
            : 'belum diketahui';

        return [
            `🔔 *LEAD SIAP ORDER — BUTUH TINDAKAN*`,
            ``,
            `*Bisnis:* ${lead.businessName || lead.name}`,
            `*Tipe:* ${lead.businessType || 'Unknown'} (Skor: ${lead.score})`,
            `*Lokasi:* ${lead.location || '-'}`,
            `*Nomor:* wa.me/${lead.phone?.replace('@s.whatsapp.net', '')}`,
            `*Volume estimasi:* ${revEstimate}`,
            ``,
            `*Pesan terakhir dari lead:*`,
            `"${latestMessage?.slice(0, 200) || '-'}"`,
            ``,
            `*5 Pesan sebelumnya:*`,
            history || '  (belum ada riwayat)',
            ``,
            `*Follow up:* hubungi langsung untuk konfirmasi pesanan`,
        ].join('\n');
    }

    /**
     * Directive untuk AI saat lead masuk fase ORDER
     */
    static getDirective() {
        return `=== HUMAN HANDOFF ===\nLead ini siap ORDER. JANGAN lanjut negosiasi atau jelaskan lebih dalam.\nCukup jawab: "siap kak, saya teruskan ke bagian order ya"\nSistem akan otomatis menghubungi operator.\n=====================`;
    }
}
