// src/sales/SalesAdvisorEngine.mjs
// SalesAdvisorEngine — Estimasi kebutuhan santan & rekomendasi paket
// Bot bisa menjadi sales advisor, bukan hanya sales pitch

// Rata-rata kebutuhan santan per porsi per tipe menu (dalam liter)
const USAGE_BENCHMARK = {
    padang:    { litersPerPortion: 0.12, confidence: 'HIGH', desc: 'masakan Padang (gulai, rendang, dll)' },
    jawa:      { litersPerPortion: 0.08, confidence: 'HIGH', desc: 'masakan Jawa (opor, soto, dll)' },
    bakery:    { litersPerPortion: 0.05, confidence: 'MEDIUM', desc: 'kue/bakery tradisional' },
    nusantara: { litersPerPortion: 0.10, confidence: 'MEDIUM', desc: 'masakan nusantara umum' },
    snack:     { litersPerPortion: 0.04, confidence: 'LOW', desc: 'jajanan/snack ringan' },
    default:   { litersPerPortion: 0.08, confidence: 'LOW', desc: 'rata-rata umum' },
};

// Threshold paket berdasarkan liter/minggu
const PACKAGE_THRESHOLDS = [
    { min: 0,   max: 10,   package: 'ECO_PACK',      label: 'Paket Ekonomis',    frequency: 'per kebutuhan' },
    { min: 10,  max: 30,   package: 'TRIAL',          label: 'Paket Percobaan',   frequency: 'mingguan' },
    { min: 30,  max: 80,   package: 'WEEKLY_GROSS',   label: 'Paket Grosir Mingguan', frequency: 'mingguan' },
    { min: 80,  max: 9999, package: 'B2B_NEGOTIATE',  label: 'Paket B2B',         frequency: 'kontrak' },
];

export class SalesAdvisorEngine {
    /**
     * Estimasi kebutuhan santan dari profil bisnis
     * @param {Object} params - { portions, menuType, daysPerWeek, businessType }
     * @returns {Object} { dailyLiters, weeklyLiters, monthlyLiters, confidence, recommendedPackage, explanation }
     */
    static estimate({ portions = 0, menuType = 'default', daysPerWeek = 6, businessType = null } = {}) {
        const key = menuType?.toLowerCase() || 'default';
        const benchmark = USAGE_BENCHMARK[key] || USAGE_BENCHMARK.default;

        const dailyLiters   = +(portions * benchmark.litersPerPortion).toFixed(1);
        const weeklyLiters  = +(dailyLiters * daysPerWeek).toFixed(1);
        const monthlyLiters = +(weeklyLiters * 4.3).toFixed(0);

        const pkg = PACKAGE_THRESHOLDS.find(p => weeklyLiters >= p.min && weeklyLiters < p.max)
                 || PACKAGE_THRESHOLDS[PACKAGE_THRESHOLDS.length - 1];

        const explanation = [
            `Estimasi: ${portions} porsi × ${benchmark.litersPerPortion}L/porsi (${benchmark.desc})`,
            `= ~${dailyLiters}L/hari, ~${weeklyLiters}L/minggu, ~${monthlyLiters}L/bulan`,
            `Rekomendasi: ${pkg.label} (${pkg.frequency})`,
        ].join('\n');

        return {
            dailyLiters,
            weeklyLiters,
            monthlyLiters,
            confidence: benchmark.confidence,
            recommendedPackage: pkg.package,
            packageLabel: pkg.label,
            explanation,
        };
    }

    /**
     * Generate respons singkat untuk WhatsApp
     * (dari pertanyaan seperti "katering 100 porsi butuh berapa liter?")
     */
    static generateAdvisorReply(params) {
        const est = this.estimate(params);
        const lines = [
            `kira-kira ${est.weeklyLiters}L per minggu (${est.dailyLiters}L/hari untuk ${params.portions} porsi)`,
            ``,
            `kalau begitu yang cocok: *${est.packageLabel}*`,
        ];
        if (est.confidence !== 'HIGH') {
            lines.push(`(ini estimasi ya kak, actual-nya tergantung menu spesifiknya)`);
        }
        return lines.join('\n');
    }

    /**
     * Deteksi apakah pesan adalah pertanyaan estimasi kebutuhan
     */
    static isEstimationQuery(text) {
        const lower = (text || '').toLowerCase();
        return (
            (lower.includes('porsi') || lower.includes('orang') || lower.includes('pax')) &&
            (lower.includes('butuh') || lower.includes('perlu') || lower.includes('berapa') || lower.includes('santan'))
        );
    }

    /**
     * Parse estimasi dari teks natural
     * "saya katering 150 porsi menu padang"
     */
    static parseFromText(text) {
        const lower = text.toLowerCase();
        const params = { menuType: 'default', daysPerWeek: 6 };

        const portionMatch = lower.match(/(\d+)\s*(porsi|orang|pax)/);
        if (portionMatch) params.portions = parseInt(portionMatch[1]);

        if (lower.includes('padang')) params.menuType = 'padang';
        else if (lower.includes('jawa') || lower.includes('opor') || lower.includes('soto')) params.menuType = 'jawa';
        else if (lower.includes('kue') || lower.includes('bakery')) params.menuType = 'bakery';
        else if (lower.includes('snack') || lower.includes('jajanan')) params.menuType = 'snack';

        const daysMatch = lower.match(/(\d+)\s*(hari|day)/);
        if (daysMatch) params.daysPerWeek = parseInt(daysMatch[1]);

        return params;
    }

    /**
     * Directive untuk AI saat ada pertanyaan estimasi
     */
    static getDirective(text) {
        if (!this.isEstimationQuery(text)) return '';
        const params = this.parseFromText(text);
        if (!params.portions) return '';

        const est = this.estimate(params);
        return `=== SALES ADVISOR ===\nUser bertanya soal estimasi kebutuhan santan.\nEstimasi kamu: ~${est.weeklyLiters}L/minggu, rekomendasi: ${est.packageLabel}\nJawab natural dan ringkas. Sebutkan estimasinya lalu sarankan paket yang cocok.\n=====================`;
    }
}
