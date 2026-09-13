// src/os/growth/ProductKnowledgeEngine.mjs
// ============================================================================
// SALIM OS - PRODUCT KNOWLEDGE-TO-CONVERSATION ENGINE
// Translates technical architecture into tangible business value
// ============================================================================

export class ProductKnowledgeEngine {
    static KNOWLEDGE_MAP = {
        'QUEUE': {
            name: 'Job Queue & Anti-Crash Architecture',
            plainExplanation: 'Kalau ada 200 pelanggan masuk bersamaan saat jam sibuk, bot gak bakal jebol atau kirim pesan ganda. Semua request mengantre rapi dan diproses secara stabil.',
            businessBenefit: 'Pelanggan tetap terlayani cepat tanpa ada chat yang tenggelam atau bot mati mendadak saat promo berlangsung.'
        },
        'APPROVAL': {
            name: 'Human-in-the-Loop & Approval Center',
            plainExplanation: 'AI tidak diberikan hak untuk transfer uang, kasih diskon besar, atau batalkan order tanpa izin. AI cuma mengajukan permohonan ke WhatsApp pemilik toko.',
            businessBenefit: 'Pemilik bisnis tetap memegang kendali keuangan 100%, bebas dari risiko AI salah hitung atau dipermainkan pelanggan.'
        },
        'AUDIT': {
            name: 'Decision Audit Trail ("Why Did AI Send This?")',
            plainExplanation: 'Setiap jawaban AI tercatat bukti jejaknya: pertanyaan apa yang dibaca, aturan SOP mana yang dipakai, dan kenapa jawaban itu yang dipilih.',
            businessBenefit: 'Bila ada komplain pelanggan di kemudian hari, pemilik bisnis punya bukti audit tertulis yang transparan dan bisa dipertanggungjawabkan.'
        },
        'MULTI_TENANT': {
            name: 'OWASP Tenant Data Isolation',
            plainExplanation: 'Setiap toko memiliki brankas data dan memori terisolasi. Data kontak, omzet, dan chat Toko A mustahil bisa terbaca oleh Toko B.',
            businessBenefit: 'Kerahasiaan data bisnis terjamin aman sesuai standar industri enterprise.'
        }
    };

    /**
     * Explains a feature in simple, convincing terms
     */
    static explainFeature(featureKey = 'QUEUE') {
        const item = this.KNOWLEDGE_MAP[featureKey] || this.KNOWLEDGE_MAP['QUEUE'];
        return `💡 *${item.name}*\n\n${item.plainExplanation}\n\n🎯 *Manfaat Nyata:* ${item.businessBenefit}`;
    }
}
