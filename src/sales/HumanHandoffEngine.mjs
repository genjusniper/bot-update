// src/sales/HumanHandoffEngine.mjs
// HumanHandoffEngine — Notifikasi ke operator manusia ketika lead siap order

import { LeadCRM } from './LeadCRM.mjs';

// Nomor WA operator yang menerima notif handoff
// Ganti dengan nomor WA Mas Agus (format internasional)
const OPERATOR_PHONE = process.env.OPERATOR_PHONE || '628xxxxxxxxxx@s.whatsapp.net';
const OPERATOR_NAME  = process.env.OPERATOR_NAME  || 'Mas Agus';

export class HumanHandoffEngine {
    /**
     * Cek apakah lead butuh di-handoff ke manusia
     * @param {Object} lead
     * @param {string} detectedPhase - dari SalesConversationEngine
     * @returns {boolean}
     */
    static needsHandoff(lead, detectedPhase) {
        return detectedPhase === 'ORDER' || lead?.status === 'ORDER';
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
