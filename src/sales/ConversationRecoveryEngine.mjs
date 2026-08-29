// src/sales/ConversationRecoveryEngine.mjs
// Menganalisa percakapan mandek dan memberikan strategi recovery yang cerdas

import { LeadCRM } from './LeadCRM.mjs';

export class ConversationRecoveryEngine {
    
    /**
     * Mengevaluasi apakah lead butuh recovery dan bagaimana pendekatannya
     */
    static evaluate(lead, recentHistory = []) {
        if (!lead || ['LOST', 'ORDER', 'DO_NOT_CONTACT'].includes(lead.status)) {
            return { action: 'STOP', reason: 'Status tidak layak recovery' };
        }

        const lastContactStr = lead.lastContact || lead.updatedAt;
        if (!lastContactStr) return { action: 'WAIT', reason: 'Belum pernah dihubungi' };

        const lastContactDate = new Date(lastContactStr);
        const hoursSince = (new Date() - lastContactDate) / (1000 * 60 * 60);

        // Kalau belum 24 jam, jangan ganggu
        if (hoursSince < 24) return { action: 'WAIT', reason: 'Kurang dari 24 jam' };

        // 1. Kasus Ghosting Awal (Sudah dikontak tapi nggak pernah balas)
        if (lead.status === 'CONTACTED') {
            if (hoursSince > 48) { // Kasih waktu 2 hari
                if ((lead.followUpCount || 0) >= 2) {
                    return { action: 'MARK_LOST', reason: 'Ghosting 2x follow-up' };
                }
                return { 
                    action: 'RECOVER_SOFT', 
                    strategy: 'Gunakan pertanyaan singkat tanpa beban. Jangan jualan. Misal: "Halo kak, sekadar memastikan pesan kemarin masuk ya?"'
                };
            }
            return { action: 'WAIT', reason: 'Belum waktunya follow-up pertama' };
        }

        // 2. Kasus Mandek saat Nego (Harga / Kualitas)
        if (lead.status === 'NEGOTIATION' || lead.status === 'ASKED_PRICE') {
            if (hoursSince > 24) {
                return {
                    action: 'RECOVER_VALUE',
                    strategy: 'Mereka diam setelah tahu harga/penawaran. Coba kasih nilai tambah atau diskon kecil. Misal: "Halo kak, khusus minggu ini ada free sample untuk katering baru, mau coba dikirim besok?"'
                };
            }
        }

        // 3. Kasus Menunda (Minta Waktu)
        if (lead.status === 'THINKING') {
            if (hoursSince > 72) { // 3 hari
                return {
                    action: 'RECOVER_CHECKIN',
                    strategy: 'Mereka minta waktu mikir. Tanya dengan sopan tanpa memaksa. Misal: "Halo kak, sekadar check in, apakah ada pertanyaan seputar produk kami yang bisa dibantu?"'
                };
            }
        }

        // 4. Default Timeout (> 7 Hari untuk semua status aktif lainnya)
        if (hoursSince > 168) { 
            return {
                action: 'MARK_LOST',
                reason: 'Lebih dari 7 hari tanpa progres'
            };
        }

        return { action: 'WAIT', reason: 'Sedang dalam masa cooldown' };
    }
}
