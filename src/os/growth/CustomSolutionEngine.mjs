// src/os/growth/CustomSolutionEngine.mjs
// ============================================================================
// SALIM OS - CUSTOM SOLUTION BLUEPRINT GENERATOR
// Tailors modular solution architectures instead of pushing rigid pricing packages
// ============================================================================

export class CustomSolutionEngine {
    /**
     * Generates a tailored solution blueprint based on stated business pain points
     */
    static generateBlueprint(painPointText = '') {
        const lower = painPointText.toLowerCase();
        const recommendedModules = [];

        if (/(?:stok|harga|katalog|produk|tanya\s+barang)/i.test(lower)) {
            recommendedModules.push({
                name: 'Katalog Cerdas & Pengecekan Stok Otomatis',
                benefit: 'Menjawab ketersediaan barang secara real-time tanpa perlu admin buka spreadsheet manual.'
            });
        }

        if (/(?:follow\s*up|nanya\s+doang|gak\s+jadi\s+beli|ghosting|lead|pelanggan\s+lama)/i.test(lower)) {
            recommendedModules.push({
                name: 'CRM Memory & Smart Follow-Up Engine',
                benefit: 'Mencatat preferensi pelanggan dan menyapa kembali pelanggan yang lama tidak order secara personal dan sopan.'
            });
        }

        if (/(?:pesanan|order|invoice|rekap|draf)/i.test(lower)) {
            recommendedModules.push({
                name: 'Pencatat Draf Pesanan & Rekap Harian',
                benefit: 'Mengonversi obrolan WhatsApp menjadi draf pesanan ber-ID resmi siap kirim ke bagian gudang.'
            });
        }

        if (/(?:komplain|refund|retur|marah|kecewa)/i.test(lower)) {
            recommendedModules.push({
                name: 'Komplain Sentinel & Human Escalation Gate',
                benefit: 'Meredakan emosi pelanggan dengan validasi empatik dan segera mengabari pemilik toko sebelum masalah membesar.'
            });
        }

        // Default foundational modules
        if (recommendedModules.length === 0) {
            recommendedModules.push({
                name: 'Asisten Penjawab FAQ & Layanan 24 Jam',
                benefit: 'Menangani 70-80% pertanyaan rutin pelanggan di luar jam kerja dengan gaya bahasa ramah dan akrab.'
            });
        }

        let moduleList = recommendedModules.map((m, i) => `${i + 1}. *${m.name}*\n   ↳ _${m.benefit}_`).join('\n\n');

        return (
            `📋 *SOLUSI MODULAR SALIM AI UNTUK BISNISMU*\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `Berdasarkan kebutuhan yang kamu ceritakan, kamu tidak perlu memasang sistem yang rumit sekaligus. Cukup aktifkan modul kunci berikut:\n\n` +
            `${moduleList}\n\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `_Pendekatan bertahap ini bikin biaya efisien dan langsung berdampak ke operasional tokomu._`
        );
    }
}
