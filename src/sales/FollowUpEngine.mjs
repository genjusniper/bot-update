// src/sales/FollowUpEngine.mjs
// FollowUpEngine — Scheduler & logika follow-up berbasis state CRM

import { LeadCRM, LeadStatus } from './LeadCRM.mjs';

// Konfigurasi follow-up per status
const FOLLOW_UP_CONFIG = {
    CONTACTED:   { waitDays: 2, maxFollowUps: 2 },
    REPLIED:     { waitDays: 1, maxFollowUps: 3 },
    CURIOUS:     { waitDays: 1, maxFollowUps: 3 },
    INTERESTED:  { waitDays: 1, maxFollowUps: 4 },
    ASKED_PRICE: { waitDays: 1, maxFollowUps: 4 },
    THINKING:    { waitDays: 3, maxFollowUps: 2 },
    FOLLOW_UP:   { waitDays: 3, maxFollowUps: 2 },
};

const FOLLOW_UP_MESSAGES = {
    CONTACTED: [
        `halo kak, kemarin aku sempat kirim info soal santan segar — sempat baca nggak? kalau ada yang mau ditanyain boleh banget`,
        `halo lagi kak, cuma mau mastiin pesanku kemarin nyampe — soal supply santan. nggak perlu buru-buru kok`,
    ],
    THINKING: [
        `halo kak, lagi masih pikirin soal santan kemarin? nggak perlu buru-buru, cuma mau tanya aja kalau ada yang kurang jelas`,
        `halo kak, minggu lalu sempat ngobrol soal santan — kalau misalnya udah ada keputusan atau mau coba dulu, tinggal bilang ya`,
    ],
    INTERESTED: [
        `halo kak, gimana pertimbangannya? kalau mau langsung coba paket kecil dulu bisa banget — nggak ada risiko`,
        `halo kak, masih penasaran soal santan kita nggak? boleh tanya-tanya dulu santai kok`,
    ],
    ASKED_PRICE: [
        `halo kak, kemarin sempat nanya harga — ada yang mau diklarifikasi lagi? bisa juga langsung coba sample dulu`,
        `halo kak, gimana? kalau mau coba dulu paket kecil sebelum komitmen besar, itu bisa banget`,
    ],
    DEFAULT: [
        `halo kak, cuma mau tanya kabar — gimana bisnis masakannya? kalau ada kebutuhan santan tinggal chat ya`,
    ],
};

export class FollowUpEngine {
    /**
     * Tentukan apakah lead perlu dijadwal follow-up
     * @param {Object} lead
     * @returns {Object} { shouldSchedule, waitDays, reason }
     */
    static evaluate(lead) {
        if (!lead) return { shouldSchedule: false, reason: 'No lead data' };

        const config = FOLLOW_UP_CONFIG[lead.status];
        if (!config) return { shouldSchedule: false, reason: `Status ${lead.status} tidak butuh follow-up` };

        // Cek apakah sudah melebihi batas maksimum follow-up
        if ((lead.followUpCount || 0) >= config.maxFollowUps) {
            return {
                shouldSchedule: false,
                shouldMarkLost: true,
                reason: `Follow-up sudah ${lead.followUpCount}x (max: ${config.maxFollowUps}), tandai LOST`,
            };
        }

        return {
            shouldSchedule: true,
            waitDays: config.waitDays,
            reason: `Lead status ${lead.status} — follow-up ke-${(lead.followUpCount || 0) + 1} dalam ${config.waitDays} hari`,
        };
    }

    /**
     * Jadwalkan follow-up untuk lead (update CRM)
     * @param {string} phone
     * @returns {Object} updated lead
     */
    static schedule(phone) {
        const lead = LeadCRM.load(phone);
        if (!lead) return null;

        const result = this.evaluate(lead);
        if (!result.shouldSchedule) {
            if (result.shouldMarkLost) {
                console.log(`[FollowUpEngine] 🔴 ${lead.businessName} ditandai LOST (follow-up habis)`);
                return LeadCRM.updateStatus(phone, LeadStatus.LOST, 'Tidak ada respons setelah max follow-up');
            }
            return lead;
        }

        console.log(`[FollowUpEngine] 📅 Jadwal follow-up ${lead.businessName}: ${result.waitDays} hari lagi`);
        return LeadCRM.scheduleFollowUp(phone, result.waitDays);
    }

    /**
     * Generate teks pesan follow-up sesuai status lead
     * @param {Object} lead
     * @returns {string}
     */
    static generateMessage(lead) {
        const messages = FOLLOW_UP_MESSAGES[lead.status] || FOLLOW_UP_MESSAGES.DEFAULT;
        return messages[Math.floor(Math.random() * messages.length)];
    }

    /**
     * Jalankan semua follow-up yang sudah jatuh tempo
     * @param {Function} sendMessageFn - async (phone, text) => void
     * @returns {Array} daftar phone yang di-follow-up
     */
    static async runDueFollowUps(sendMessageFn) {
        const dueLeads = LeadCRM.getDueFollowUps();
        if (dueLeads.length === 0) {
            console.log(`[FollowUpEngine] ✅ Tidak ada follow-up yang jatuh tempo`);
            return [];
        }

        console.log(`[FollowUpEngine] 📤 ${dueLeads.length} follow-up jatuh tempo, mengirim...`);
        const sent = [];

        for (const lead of dueLeads) {
            const message = this.generateMessage(lead);
            try {
                await sendMessageFn(lead.phone, message);
                LeadCRM.addContactEntry(lead.phone, { direction: 'OUT', message });

                // Setelah dikirim, jadwal follow-up berikutnya atau tandai LOST
                this.schedule(lead.phone);
                sent.push(lead.phone);

                console.log(`[FollowUpEngine]   ✅ Follow-up terkirim ke: ${lead.businessName}`);
            } catch (err) {
                console.warn(`[FollowUpEngine]   ⚠️  Gagal kirim ke ${lead.phone}: ${err.message}`);
            }

            await new Promise(r => setTimeout(r, 3000)); // jeda 3 detik antar pesan
        }

        return sent;
    }
}
