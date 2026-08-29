// src/sales/SalesConversationEngine.mjs
// SalesConversationEngine — Deteksi & navigasi fase percakapan sales santan

import { LeadCRM, LeadStatus } from './LeadCRM.mjs';

// Signal per fase — kata/frasa yang mengindikasikan fase tertentu
const PHASE_SIGNALS = {
    ORDER: [
        'mau pesan', 'mau beli', 'jadi beli', 'oke pesan', 'lanjut', 'transfer ke mana',
        'rekening', 'no rek', 'alamat kirim', 'kirim ke', 'berapa liter', 'minta sekian',
        'bisa cod', 'bisa kirim', 'kapan bisa kirim', 'oke deal', 'sepakat', 'jadi ya',
    ],
    ASKED_PRICE: [
        'harga', 'berapa', 'tarif', 'rate', 'per liter', 'per kg', 'murah nggak',
        'ada promo', 'ada diskon', 'bisa nego', 'harga grosir', 'harga partai',
        'beda sama', 'lebih murah', 'kemahalan',
    ],
    INTERESTED: [
        'tertarik', 'lumayan', 'keren', 'boleh juga', 'menarik', 'bisa coba',
        'pengen coba', 'tapi', 'tapi harganya', 'tapi dulu', 'info lebih',
        'cerita dong', 'gimana caranya', 'beli di mana', 'bisa order', 'coba dulu',
    ],
    CURIOUS: [
        'apaan', 'itu apa', 'jenis apa', 'beda apa', 'gimana', 'bedanya',
        'kayak gimana', 'dari mana', 'produknya apa', 'ini bisnis apa',
        'emang bisa', 'serius', 'beneran', 'legit nggak',
    ],
    THINKING: [
        'nanti', 'kapan-kapan', 'belum tahu', 'mikir dulu', 'pertimbangin dulu',
        'lihat-lihat dulu', 'belum butuh', 'ditunda', 'masih ada stok', 'nanti dulu ya',
    ],
    LOST: [
        'nggak minat', 'tidak perlu', 'sudah ada', 'sudah punya supplier',
        'nggak usah', 'stop', 'jangan hubungi', 'hapus nomor', 'blok',
    ],
};

export class SalesConversationEngine {
    /**
     * Deteksi fase sales dari pesan user
     * @param {string} text - pesan masuk dari lead
     * @param {Object} lead - data lead dari CRM
     * @returns {Object} { detectedPhase, confidence, directive }
     */
    static evaluate(text, lead) {
        if (!text || !lead) return { detectedPhase: lead?.status || 'UNKNOWN', directive: '' };

        const lower = text.toLowerCase();
        let detectedPhase = lead.status;
        let confidence = 0;

        // Cek dari fase tertinggi ke terendah (ORDER dulu)
        for (const [phase, signals] of Object.entries(PHASE_SIGNALS)) {
            const matches = signals.filter(s => lower.includes(s)).length;
            if (matches > 0 && matches > confidence) {
                confidence = matches;
                detectedPhase = phase;
            }
        }

        // Update CRM jika fase berubah dan lebih maju
        const phaseOrder = ['NEW', 'CONTACTED', 'REPLIED', 'CURIOUS', 'INTERESTED', 'ASKED_PRICE', 'THINKING', 'ORDER', 'LOST', 'FOLLOW_UP', 'REPEAT'];
        const currentIdx = phaseOrder.indexOf(lead.status);
        const newIdx = phaseOrder.indexOf(detectedPhase);

        let updatedLead = lead;
        if (newIdx > currentIdx && detectedPhase !== lead.status) {
            updatedLead = LeadCRM.updateStatus(lead.phone, detectedPhase, `Auto-detected dari pesan: "${text.slice(0, 80)}"`);
            LeadCRM.addContactEntry(lead.phone, { direction: 'IN', message: text });
        } else if (lead.status === 'CONTACTED') {
            // Minimal update ke REPLIED kalau lead sudah balas
            updatedLead = LeadCRM.updateStatus(lead.phone, 'REPLIED', 'Lead sudah membalas');
            LeadCRM.addContactEntry(lead.phone, { direction: 'IN', message: text });
        }

        const directive = this._buildDirective(detectedPhase, updatedLead || lead);
        return { detectedPhase, confidence, directive };
    }

    /**
     * Bangun directive untuk AI berdasarkan fase sales
     */
    static _buildDirective(phase, lead) {
        const name = lead.businessName || lead.name || 'kak';

        const directives = {
            NEW: ``,
            CONTACTED: `Kamu baru saja kirim pesan pertama ke ${name}. Kalau mereka balas, jangan langsung jualan. Tanya dulu kebiasaan masak/produksinya.`,
            REPLIED: `Lead ${name} sudah balas. Ini fase awal — fokus ngobrol natural dulu. Tanya kebutuhan mereka, jangan sebut produk kamu dulu.`,
            CURIOUS: `${name} mulai penasaran. Jawab pertanyaan mereka dengan santai, jangan terlalu panjang. Buka sedikit tentang produk santan kalau mereka tanya.`,
            INTERESTED: `${name} mulai tertarik. Saatnya cerita tentang keunggulan produk secara natural — konsistensi kualitas, kemudahan supply rutin. Jangan bahas harga dulu kecuali mereka tanya.`,
            ASKED_PRICE: `${name} sudah tanya harga. Berikan info harga yang relevan (per liter, paket grosir). Kalau mereka bilang kemahalan — jangan langsung turunkan harga. Jelaskan value-nya dulu.`,
            THINKING: `${name} sedang mempertimbangkan. Jangan push. Validasi keputusan mereka, tawarkan untuk follow up nanti. Akhiri obrolan dengan ramah.`,
            ORDER: `⚡ ${name} SIAP ORDER. SEGERA alihkan ke human handoff. Jawab: "siap, saya teruskan ke bagian order ya" lalu trigger notifikasi.`,
            LOST: `${name} tidak tertarik. Akhiri obrolan dengan sopan, jangan paksa. Ucapkan terima kasih sudah mau ngobrol.`,
            FOLLOW_UP: `Ini follow-up ke ${name} (sudah ${lead.followUpCount || 1}x). Jangan mulai dengan jualan. Tanya kabar bisnis mereka dulu, baru singgung santan kalau ada momen yang pas.`,
            REPEAT: `${name} adalah pelanggan berulang. Sambut seperti pelanggan setia. Tanya apakah stok masih cukup atau ingin tambah.`,
        };

        return directives[phase] ? `=== SALES CONVERSATION DIRECTIVE ===\nFASE: ${phase}\n${directives[phase]}\n====================================` : '';
    }

    /**
     * Evaluasi apakah bot perlu trigger human handoff
     */
    static needsHumanHandoff(phase) {
        return phase === LeadStatus.ORDER;
    }
}
