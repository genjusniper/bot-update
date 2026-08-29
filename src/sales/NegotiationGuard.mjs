// src/sales/NegotiationGuard.mjs
// NegotiationGuard — Cegah bot negosiasi tanpa batas, jaga floor price

import { SalesMemory } from './SalesMemory.mjs';

// Konfigurasi negosiasi (override via env)
const CONFIG = {
    floorPricePerLiter: parseInt(process.env.SALES_FLOOR_PRICE || '12000'),   // Rp/liter minimum
    maxPriceObjections: parseInt(process.env.MAX_PRICE_OBJECTIONS || '2'),     // max keberatan harga
    highValueThreshold: parseInt(process.env.HIGH_VALUE_LITERS || '50'),       // liter → handoff
};

// Signal negosiasi dari teks user
const NEGOTIATION_SIGNALS = [
    'diskon', 'discount', 'kurangi', 'kurang dikit', 'murah lagi', 'bisa lebih murah',
    'nego', 'negosiasi', 'minta kurang', 'terlalu mahal', 'kurang harganya',
    'ada harga lain', 'harga terbaik', 'bisa lebih', 'kalau beli banyak',
    'kemahalan', 'mahal banget', 'mahal kali', 'harga kok', 'kelewat mahal', 'mahal dong',
];

const HIGH_VALUE_SIGNALS = [
    // Tanda pesanan besar yang butuh handoff
    /(\d+)\s*(liter|L)\b/i,
];

export class NegotiationGuard {
    /**
     * Evaluasi apakah pesan mengandung negosiasi harga
     * @param {string} text
     * @param {Object} lead - data lead dari CRM
     * @returns {Object} { isNegotiation, shouldHandoff, directive, reason }
     */
    static evaluate(text, lead) {
        if (!text) return { isNegotiation: false, shouldHandoff: false, directive: '' };

        const lower = text.toLowerCase();
        const isNegotiation = NEGOTIATION_SIGNALS.some(s => lower.includes(s));

        if (!isNegotiation) return { isNegotiation: false, shouldHandoff: false, directive: '' };

        // Hitung berapa kali sudah ada keberatan harga di riwayat
        const history = lead?.contactHistory || [];
        const priceObjectionCount = history.filter(h =>
            h.message && NEGOTIATION_SIGNALS.some(s => h.message.toLowerCase().includes(s))
        ).length;

        // Cek volume pesanan besar
        let requestedLiters = 0;
        for (const pattern of HIGH_VALUE_SIGNALS) {
            const match = text.match(pattern);
            if (match) { requestedLiters = parseInt(match[1]); break; }
        }
        const isHighValue = requestedLiters >= CONFIG.highValueThreshold;

        // Tentukan apakah harus handoff
        const shouldHandoff = priceObjectionCount >= CONFIG.maxPriceObjections || isHighValue;

        let directive = '';
        if (shouldHandoff) {
            const reason = isHighValue
                ? `Volume besar (${requestedLiters}L >= ${CONFIG.highValueThreshold}L threshold)`
                : `Negosiasi harga ke-${priceObjectionCount + 1} (max: ${CONFIG.maxPriceObjections})`;

            directive = [
                `=== NEGOTIATION GUARD — HANDOFF REQUIRED ===`,
                `Alasan: ${reason}`,
                `JANGAN lanjutkan negosiasi harga.`,
                `Jawab: "oke kak, untuk ini lebih baik saya teruskan ke tim kami langsung ya biar bisa dikasih harga yang lebih pas"`,
                `Kemudian trigger human handoff.`,
                `=============================================`,
            ].join('\n');
        } else {
            directive = [
                `=== NEGOTIATION GUARD ===`,
                `Negosiasi harga ke-${priceObjectionCount + 1} dari max ${CONFIG.maxPriceObjections}.`,
                `JANGAN kurangi harga. Floor price: Rp ${CONFIG.floorPricePerLiter.toLocaleString('id-ID')}/liter.`,
                `Jelaskan VALUE terlebih dahulu: kesegaran, konsistensi supply, efisiensi waktu produksi.`,
                `Kalau tetap minta diskon → jawab dengan paket trial yang lebih kecil sebagai alternatif.`,
                `========================`,
            ].join('\n');
        }

        return { isNegotiation: true, shouldHandoff, requestedLiters, priceObjectionCount, directive };
    }

    /**
     * Cek apakah harga yang akan disebutkan di atas floor price
     */
    static isPriceAboveFloor(pricePerLiter) {
        return pricePerLiter >= CONFIG.floorPricePerLiter;
    }

    /**
     * Ambil konfigurasi aktif
     */
    static getConfig() { return { ...CONFIG }; }
}
