// src/sales/MessageRiskGuard.mjs
// MessageRiskGuard — Safety check pesan sebelum dikirim ke lead

export const RiskLevel = {
    SAFE:  'SAFE',   // < 40 — kirim langsung
    WARN:  'WARN',   // 40-69 — revisi disarankan
    BLOCK: 'BLOCK',  // >= 70 — jangan kirim
};

// Kata-kata yang terasa terlalu sales/spam
const SPAM_PHRASES = [
    'kami menawarkan', 'kami menjual', 'produk kami', 'segera hubungi',
    'promo terbatas', 'stok terbatas', 'jangan lewatkan', 'hanya hari ini',
    'klik di sini', 'hubungi sekarang', 'daftar sekarang', 'order sekarang',
    'tidak boleh dilewatkan', 'kesempatan emas', 'penawaran spesial',
];

// Kata-kata yang terlalu memaksa
const PRESSURE_PHRASES = [
    'harus', 'wajib', 'segera', 'langsung', 'jangan sampai', 'sekarang juga',
    'ayo', 'buruan', 'cepat', 'tidak perlu menunggu',
];

// Emoji berlebihan (> 3 dalam satu pesan)
const emojiCount = (text) => {
    const matches = text.match(/[\u{1F000}-\u{1FFFF}]|\p{Emoji}/gu);
    return matches ? matches.length : 0;
};

export class MessageRiskGuard {
    /**
     * Evaluasi pesan yang akan dikirim
     * @param {string} message - pesan yang akan dikirim
     * @param {Object} lead - lead target
     * @param {string[]} recentMessages - pesan-pesan sebelumnya ke lead ini
     * @returns {Object} { riskLevel, riskScore, flags, suggestions }
     */
    static evaluate(message, lead = {}, recentMessages = []) {
        if (!message) return { riskLevel: RiskLevel.SAFE, riskScore: 0, flags: [], suggestions: [] };

        const lower = message.toLowerCase();
        let riskScore = 0;
        const flags = [];
        const suggestions = [];

        // ── 1. Spam phrases ───────────────────────────────────────
        const spamHits = SPAM_PHRASES.filter(p => lower.includes(p));
        if (spamHits.length > 0) {
            riskScore += spamHits.length * 12;
            flags.push(`SPAM_PHRASE: ${spamHits.slice(0, 2).join(', ')}`);
            suggestions.push('Hindari frasa promosi yang terasa bot. Tulis seperti percakapan natural.');
        }

        // ── 2. Pressure phrases ────────────────────────────────────
        const pressureHits = PRESSURE_PHRASES.filter(p => lower.includes(p));
        if (pressureHits.length >= 2) {
            riskScore += pressureHits.length * 8;
            flags.push(`HIGH_PRESSURE: ${pressureHits.slice(0, 2).join(', ')}`);
            suggestions.push('Pesan terlalu memaksa. Kurangi kata-kata urgensi buatan.');
        }

        // ── 3. Terlalu panjang ────────────────────────────────────
        const wordCount = message.split(/\s+/).length;
        if (wordCount > 80) {
            riskScore += 20;
            flags.push(`TOO_LONG: ${wordCount} kata`);
            suggestions.push('Perpendek pesan. Ideal untuk WA: < 50 kata per pesan.');
        } else if (wordCount > 50) {
            riskScore += 8;
            flags.push(`SOMEWHAT_LONG: ${wordCount} kata`);
        }

        // ── 4. Emoji berlebihan ────────────────────────────────────
        const emojis = emojiCount(message);
        if (emojis > 5) {
            riskScore += 15;
            flags.push(`TOO_MANY_EMOJI: ${emojis}`);
            suggestions.push('Terlalu banyak emoji terasa tidak profesional. Max 2–3 per pesan.');
        }

        // ── 5. Repetisi pesan ─────────────────────────────────────
        if (recentMessages.length > 0) {
            const similarity = recentMessages.some(prev => {
                if (!prev) return false;
                const prevWords = new Set(prev.toLowerCase().split(/\s+/));
                const currWords = message.toLowerCase().split(/\s+/);
                const matches = currWords.filter(w => prevWords.has(w) && w.length > 4);
                return matches.length / currWords.length > 0.6; // >60% kata sama
            });
            if (similarity) {
                riskScore += 25;
                flags.push('REPETITIVE_MESSAGE');
                suggestions.push('Pesan terlalu mirip dengan yang sebelumnya. Variasikan wording.');
            }
        }

        // ── 6. All caps ────────────────────────────────────────────
        const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
        if (capsRatio > 0.4 && message.length > 20) {
            riskScore += 10;
            flags.push('EXCESSIVE_CAPS');
            suggestions.push('Hindari huruf kapital berlebihan — terasa seperti teriak.');
        }

        // ── 7. Tentukan risk level ─────────────────────────────────
        const riskLevel = riskScore >= 70 ? RiskLevel.BLOCK
                        : riskScore >= 40 ? RiskLevel.WARN
                        : RiskLevel.SAFE;

        return { riskLevel, riskScore, flags, suggestions };
    }

    /**
     * Quick check — apakah pesan aman dikirim?
     */
    static isSafe(message, lead, recentMessages) {
        return this.evaluate(message, lead, recentMessages).riskLevel === RiskLevel.SAFE;
    }

    /**
     * Directive untuk AI — instruksi saat pesan bermasalah
     */
    static getDirective(message, lead, recentMessages) {
        const { riskLevel, flags, suggestions } = this.evaluate(message, lead, recentMessages);
        if (riskLevel === RiskLevel.SAFE) return '';

        const severity = riskLevel === RiskLevel.BLOCK ? '🚫 BLOCK' : '⚠️  WARN';
        return [
            `=== MESSAGE RISK GUARD — ${severity} ===`,
            `Masalah: ${flags.join(', ')}`,
            suggestions.length > 0 ? `Saran: ${suggestions[0]}` : '',
            riskLevel === RiskLevel.BLOCK
                ? 'JANGAN kirim pesan ini. Tulis ulang sebelum dikirim.'
                : 'Pertimbangkan revisi sebelum dikirim.',
            `====================================`,
        ].filter(Boolean).join('\n');
    }
}
