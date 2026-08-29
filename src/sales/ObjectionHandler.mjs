// src/sales/ObjectionHandler.mjs
// ObjectionHandler — Menangani keberatan calon pembeli santan secara natural

export const ObjectionType = {
    PRICE_HIGH:        'PRICE_HIGH',        // "kemahalan", "mahal"
    HAS_SUPPLIER:      'HAS_SUPPLIER',      // "sudah punya supplier"
    NOT_READY:         'NOT_READY',         // "nanti dulu", "belum butuh"
    QUALITY_DOUBT:     'QUALITY_DOUBT',     // "yakin kualitasnya?", "bagus nggak?"
    VOLUME_SMALL:      'VOLUME_SMALL',      // "kebutuhan aku sedikit aja"
    NO_TRUST:          'NO_TRUST',          // "beneran nggak ini?", "legit nggak?"
    DELIVERY_CONCERN:  'DELIVERY_CONCERN',  // "kirimnya gimana?", "bisa sampai sini?"
    UNKNOWN:           'UNKNOWN',
};

const OBJECTION_SIGNALS = [
    { type: 'PRICE_HIGH',       patterns: ['mahal', 'kemahalan', 'kemhal', 'harganya', 'beda sama', 'lebih murah di', 'kemahalan', 'kelewat mahal', 'nggak worth'] },
    { type: 'HAS_SUPPLIER',     patterns: ['sudah punya', 'udah ada', 'sudah ada supplier', 'udah langganan', 'supplier lain', 'sudah langganan'] },
    { type: 'NOT_READY',        patterns: ['nanti dulu', 'kapan-kapan', 'belum butuh', 'belum perlu', 'ditunda', 'lihat-lihat dulu', 'belum siap', 'masih ada stok'] },
    { type: 'QUALITY_DOUBT',    patterns: ['yakin kualitasnya', 'bagus nggak', 'terjamin nggak', 'enak nggak', 'fresh nggak', 'tahan lama nggak', 'beneran fresh'] },
    { type: 'VOLUME_SMALL',     patterns: ['kebutuhan kecil', 'nggak banyak', 'sedikit aja', 'cuma sedikit', 'nggak rutin', 'kadang-kadang aja'] },
    { type: 'NO_TRUST',         patterns: ['beneran nggak', 'legit nggak', 'penipuan', 'penipu', 'percaya nggak', 'risky', 'aman nggak', 'terpercaya nggak'] },
    { type: 'DELIVERY_CONCERN', patterns: ['bisa kirim', 'dikirim', 'kirimnya gimana', 'ongkir', 'jauh nggak', 'bisa sampai', 'daerah aku', 'coverage', 'antar', 'pengiriman', 'sampai sini'] },
];

const OBJECTION_RESPONSES = {
    PRICE_HIGH: [
        `iya emang kalau dibanding santan sachet keliatannya beda tipis — tapi yang rutin beli biasanya ngitung dari sisi hemat waktu sama konsistensi. kalau mau coba dulu partai kecil bisa kok`,
        `harga kita emang diposisi mid ya — tapi kita jamin fresh setiap pengiriman. banyak warung yang bilang balik modal dari efisiensi produksinya. mau lihat simulasinya?`,
        `boleh dibanding-bandingin dulu. yang kita jual emang bukan yang paling murah tapi yang kita kasih konsistensi kualitas sama bisa supply rutin. itu yang biasanya susah kalau pakai santan kiloan biasa`,
    ],
    HAS_SUPPLIER: [
        `oh oke oke, ga apa-apa. boleh tau biasanya dapat dari mana? nanya-nanya aja sih hehe`,
        `paham, supplier lama kan memang lebih enak ya udah kenal. cuma kalau misalnya ada kebutuhan mendadak atau stok kosong, boleh kontak kita — kita bisa backup`,
        `siap, nggak maksa kok. kalau suatu hari pengen coba alternatif atau ada kendala sama supplier lama, kita masih buka ya`,
    ],
    NOT_READY: [
        `oke santai, nggak usah buru-buru. kalau nanti udah siap atau pengen info lebih, tinggal chat lagi ya`,
        `siap, nggak ada masalah. kita follow up nanti ya — kira-kira kapan kira-kira waktu yang pas buat diingatkan?`,
        `paham banget, timing itu penting. nanti kalau udah siap tinggal bilang ya, kita siap anytime`,
    ],
    QUALITY_DOUBT: [
        `ini yang sering ditanyain hehe. kita pakai kelapa segar, diperas hari itu juga — nggak pakai bahan pengawet. beberapa warung yang pakai bilang beda banget dari yang kiloan`,
        `valid banget pertanyaannya. kalau mau, kita bisa kirim sampel dulu — cobain sendiri, nggak perlu langsung komitmen banyak`,
        `boleh dicoba dulu satu kali — kalau nggak cocok, ya udah nggak maksa. tapi biasanya sekali coba langsung ketahuan bedanya`,
    ],
    VOLUME_SMALL: [
        `nggak ada minimum order yang aneh-aneh kok. beli sedikit pun bisa, kita tetap kirim — justru buat yang kebutuhannya nggak besar kita ada paket mingguan yang pas`,
        `oke justru itu yang kita sasar — usaha kecil yang butuh santan fresh tapi nggak mau beli banyak-banyak sekaligus. fleksibel`,
        `bisa banget, malah bagus. nanti kita sesuaikan frekuensi pengiriman sama kebutuhan kamu — jadi nggak ada yang mubazir`,
    ],
    NO_TRUST: [
        `wajar kalau ragu, baru kenalan hehe. kalau mau kita bisa tunjukin testimoni atau bahkan ketemu langsung kalau memang deket area pengiriman`,
        `iya masuk akal. kita udah supply ke beberapa warung di area sini, kalau mau bisa kita kasih kontak mereka buat konfirmasi`,
        `santai aja, nggak perlu langsung percaya. coba dulu sampelnya, lihat sendiri — nggak ada tekanan`,
    ],
    DELIVERY_CONCERN: [
        `kita cover beberapa area ya — boleh kasih tau lokasinya? kita cek dulu bisa sampai nggak`,
        `pengiriman kita biasanya pagi hari biar santannya masih fresh pas kamu pakai — ongkir tergantung jarak, tapi biasanya bisa diitung bareng`,
        `bisa kirim langsung, bisa juga titip ke pickup point kalau ada yang lebih dekat. mau kita sesuaikan`,
    ],
    UNKNOWN: [
        `iya paham, valid pertanyaannya. mau cerita lebih lanjut atau ada yang bikin ragu?`,
    ],
};

export class ObjectionHandler {
    /**
     * Deteksi jenis keberatan dari pesan
     * @param {string} text
     * @returns {Object} { type, response, directive }
     */
    static evaluate(text) {
        if (!text) return { type: 'UNKNOWN', response: null, directive: '' };

        const lower = text.toLowerCase();
        let matched = null;

        for (const rule of OBJECTION_SIGNALS) {
            if (rule.patterns.some(p => lower.includes(p))) {
                matched = rule;
                break;
            }
        }

        const type = matched?.type || 'UNKNOWN';
        const responses = OBJECTION_RESPONSES[type] || OBJECTION_RESPONSES.UNKNOWN;
        const response = responses[Math.floor(Math.random() * responses.length)];

        const directive = type !== 'UNKNOWN'
            ? `=== OBJECTION HANDLER ===\nKeberatan terdeteksi: ${type}\nGunakan pendekatan ini: ${response}\nJangan langsung banting harga atau terlalu defensif. Natural, empati.\n=========================`
            : '';

        return { type, response, directive };
    }

    /**
     * Apakah pesan ini adalah keberatan yang perlu ditangani?
     */
    static isObjection(text) {
        if (!text) return false;
        const lower = text.toLowerCase();
        return OBJECTION_SIGNALS.some(rule => rule.patterns.some(p => lower.includes(p)));
    }
}
