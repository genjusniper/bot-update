// src/os/growth/ObjectionHandler.mjs
// ============================================================================
// SALIM OS - ETHICAL OBJECTION HANDLER
// Deconstructs skepticism, pricing doubts, and security fears naturally
// ============================================================================

export class ObjectionHandler {
    static RESPONSES = {
        'PRICE': {
            trigger: ['mahal', 'biaya', 'budget'],
            response: 'Bisa terasa mahal kalau kebutuhanmu cuma chatbot sederhana buat jawab jam buka toko. Kalau cuma itu, pakai auto-reply gratis WhatsApp Business pun cukup.\n\nTapi kalau tokomu kewalahan jawab ratusan chat stok, input pesanan manual, atau sering kecolongan pesanan telat di-follow up, sistem ini justru menghemat biaya gaji admin dan menyelamatkan omzet yang hilang.\n\nKalau boleh tahu, bagian operasional mana yang saat ini paling banyak menyita waktu tokomu?'
        },
        'HALLUCINATION': {
            trigger: ['salah jawab', 'ngarang', 'halusinasi', 'ngawur'],
            response: 'Kekhawatiran itu sangat masuk akal. Banyak bisnis trauma pasang AI karena botnya bikin janji palsu ke pelanggan.\n\nItu sebabnya di Salim OS ada Fact-Checking Layer: AI hanya boleh menjawab fakta yang tertulis di katalog/SOP tokomu. Kalau data stok atau pertanyaan pelanggan belum ada di SOP, sistem dilarang mengarang dan langsung mengeskalasikan ke manusia.'
        },
        'SECURITY': {
            trigger: ['aman gak', 'bocor', 'privasi', 'data pelanggan'],
            response: 'Keamanan data adalah prioritas utama arsitektur ini. Sistem menggunakan prinsip OWASP Multi-Tenant Isolation: database dan memori tokomu dipartisi terpisah secara absolut. Tidak ada data pelanggan atau omzetmu yang bisa terbaca oleh pihak lain.'
        }
    };

    /**
     * Handles objection naturally based on keywords
     */
    static handle(text = '') {
        const lower = text.toLowerCase();
        for (const [key, obj] of Object.entries(this.RESPONSES)) {
            if (obj.trigger.some(t => lower.includes(t))) {
                return { handled: true, category: key, response: obj.response };
            }
        }
        return { handled: false, response: null };
    }
}
