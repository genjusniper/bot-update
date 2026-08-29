// src/sales/ObjectionIntelligence.mjs
// ObjectionIntelligence — klasifikasi keberatan + strategi respons cerdas

import { SalesTimeline, TimelineEvent } from './SalesTimeline.mjs';
import { ProductKnowledgeBase } from './ProductKnowledgeBase.mjs';

export const ObjectionType = {
    PRICE:    'PRICE',      // harga terlalu mahal
    SUPPLIER: 'SUPPLIER',   // sudah punya supplier
    QUALITY:  'QUALITY',    // meragukan kualitas
    DELIVERY: 'DELIVERY',   // ragu soal pengiriman
    MOQ:      'MOQ',        // minimum order terlalu besar
    TIMING:   'TIMING',     // belum butuh sekarang
    TRUST:    'TRUST',      // belum kenal/percaya
    NO_NEED:  'NO_NEED',    // memang tidak butuh santan
    UNKNOWN:  'UNKNOWN',
};

const OBJECTION_PATTERNS = [
    { type: ObjectionType.PRICE,    signals: ['mahal', 'kemahalan', 'kelewat mahal', 'terlalu mahal', 'harga tinggi', 'lebih murah di tempat lain', 'kurangi harga', 'diskon', 'nego'] },
    { type: ObjectionType.SUPPLIER, signals: ['udah ada supplier', 'sudah ada', 'langganan', 'sudah pesan di', 'punya langganan', 'dari tempat lain', 'nggak ganti'] },
    { type: ObjectionType.QUALITY,  signals: ['yakin kualitasnya', 'bagus nggak', 'terjamin', 'fresh nggak', 'enak nggak', 'beneran segar', 'buktiin dulu'] },
    { type: ObjectionType.DELIVERY, signals: ['bisa kirim', 'dikirim', 'antar', 'ongkir', 'jauh', 'sampai sini', 'pengiriman', 'coverage', 'bisa ke'] },
    { type: ObjectionType.MOQ,      signals: ['kebutuhan sedikit', 'cuma sedikit', 'nggak banyak', 'kecil', 'tidak rutin', 'sesekali'] },
    { type: ObjectionType.TIMING,   signals: ['nanti', 'belum butuh', 'belum siap', 'masih mikir', 'nanti dulu', 'bulan depan', 'tunggu dulu', 'besok'] },
    { type: ObjectionType.TRUST,    signals: ['belum kenal', 'baru tau', 'percaya nggak', 'aman nggak', 'legit nggak', 'penipuan', 'terpercaya nggak'] },
    { type: ObjectionType.NO_NEED,  signals: ['nggak butuh', 'tidak perlu', 'bukan kebutuhan kami', 'tidak pakai santan', 'menu kami tidak'] },
];

// Strategi respons per tipe (fungsi, bukan string statis)
const STRATEGIES = {
    [ObjectionType.PRICE]: (lead, priceObjCount) => {
        if (priceObjCount === 1) {
            return {
                approach: 'VALUE_PITCH',
                directive: 'Jangan turunkan harga. Jelaskan value: kesegaran tanpa pengawet, supply konsisten, hemat tenaga peras sendiri. Tawaran trial bisa jadi jembatan.',
            };
        }
        return {
            approach: 'HANDOFF',
            directive: 'Keberatan harga ke-2+. Informasikan bahwa ada harga khusus untuk volume tertentu yang perlu dikomunikasikan langsung. Trigger HUMAN_HANDOFF.',
        };
    },
    [ObjectionType.SUPPLIER]: () => ({
        approach: 'COMPETITOR_BRIDGE',
        directive: 'Jangan jelekkan supplier lain. Tanyakan: apa yang paling penting bagi mereka — harga, konsistensi, atau kualitas? Tawarkan trial bandingan paralel.',
    }),
    [ObjectionType.QUALITY]: () => ({
        approach: 'PROOF_OFFER',
        directive: 'Tawarkan sample dulu (3–5L). Biarkan mereka buktikan sendiri. Jangan over-claim; biarkan produk yang bicara.',
    }),
    [ObjectionType.DELIVERY]: (lead) => {
        const covered = ProductKnowledgeBase.coversArea(lead?.location || '');
        return {
            approach: covered ? 'COVERAGE_CONFIRM' : 'HONEST_LIMITATION',
            directive: covered
                ? 'Konfirmasi bahwa area mereka masuk coverage. Sebutkan jam pengiriman (jam 05–11). Tanyakan lokasi spesifik.'
                : 'Jujur bahwa saat ini coverage belum mencakup area mereka. Tanyakan apakah mereka mau masuk waiting list kalau area diperluas.',
        };
    },
    [ObjectionType.MOQ]: () => ({
        approach: 'TRIAL_BRIDGE',
        directive: 'Tawarkan paket trial tanpa MOQ dulu. Minimal order bisa disesuaikan untuk pelanggan baru. Fokusin ke "coba dulu, baru putuskan".',
    }),
    [ObjectionType.TIMING]: () => ({
        approach: 'SOFT_WAIT',
        directive: 'Jangan push. Tanya kapan kira-kira mereka butuh. Tandai untuk follow-up di waktu yang mereka sebutkan. Tinggalkan kesan baik.',
    }),
    [ObjectionType.TRUST]: () => ({
        approach: 'SOCIAL_PROOF',
        directive: 'Sebutkan sudah supply ke beberapa usaha di area mereka (tanpa nama kalau tidak izin). Tawarkan trial kecil untuk bangun kepercayaan.',
    }),
    [ObjectionType.NO_NEED]: () => ({
        approach: 'DISENGAGE_GRACEFUL',
        directive: 'Terima dengan baik. Tidak perlu memaksa. Tinggalkan kesan positif dan kontak boleh disimpan untuk referral. Jangan follow-up lagi.',
    }),
};

export class ObjectionIntelligence {
    /**
     * Identifikasi tipe keberatan dari teks
     */
    static classify(text) {
        const lower = (text || '').toLowerCase();
        for (const p of OBJECTION_PATTERNS) {
            if (p.signals.some(s => lower.includes(s))) return p.type;
        }
        return ObjectionType.UNKNOWN;
    }

    /**
     * Evaluasi keberatan + pilih strategi terbaik
     * @param {string} text
     * @param {Object} lead
     * @returns {Object} { type, approach, directive, shouldHandoff }
     */
    static evaluate(text, lead) {
        const type = this.classify(text);
        if (type === ObjectionType.UNKNOWN) {
            return { type, approach: 'LISTEN', directive: '', shouldHandoff: false };
        }

        // Hitung berapa kali objeksi PRICE sudah muncul di timeline
        const priceObjCount = type === ObjectionType.PRICE
            ? SalesTimeline.countEvent(lead?.phone || '', TimelineEvent.OBJECTION)
            : 0;

        const strategyFn = STRATEGIES[type];
        const strategy   = strategyFn ? strategyFn(lead, priceObjCount) : { approach: 'LISTEN', directive: '' };

        // Record di timeline
        if (lead?.phone) {
            SalesTimeline.append(lead.phone, TimelineEvent.OBJECTION, `${type}: "${text.slice(0, 60)}"`);
        }

        const shouldHandoff = strategy.approach === 'HANDOFF' || type === ObjectionType.NO_NEED;

        return {
            type,
            approach: strategy.approach,
            directive: `=== OBJECTION INTELLIGENCE ===\nTipe: ${type}\nStrategi: ${strategy.approach}\n${strategy.directive}\n==============================`,
            shouldHandoff,
        };
    }

    /**
     * Cek apakah teks mengandung keberatan
     */
    static isObjection(text) {
        return this.classify(text) !== ObjectionType.UNKNOWN;
    }
}
