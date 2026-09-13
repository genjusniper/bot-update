/**
 * UncertaintyEngine.mjs
 * 
 * Epistemic uncertainty management.
 * Enables Salim to recognize the boundaries of knowledge rather than hallucinating:
 * - CERTAIN: Answer directly with high confidence
 * - HIGH: Answer with grounded clarity
 * - MEDIUM: Answer + qualification note
 * - LOW: Trigger research or ask clarifying question
 * - CONFLICTED: Present the two competing data points without picking arbitrarily
 * - UNKNOWN: Acknowledge lack of data and offer investigation
 * - STALE: Flag that information may be expired
 */

export class UncertaintyEngine {
    static LEVELS = {
        CERTAIN: 'CERTAIN',
        HIGH: 'HIGH',
        MEDIUM: 'MEDIUM',
        LOW: 'LOW',
        CONFLICTED: 'CONFLICTED',
        UNKNOWN: 'UNKNOWN',
        STALE: 'STALE'
    };

    /**
     * Evaluate uncertainty level for a given claim or query
     */
    static evaluate({ evidenceCount = 0, isConflicted = false, isStale = false, confidence = 0.5 }) {
        if (isConflicted) {
            return {
                level: this.LEVELS.CONFLICTED,
                directive: 'REPORT_CONFLICT',
                guidance: 'Ditemukan dua sumber data yang saling bertolak belakang. Jangan memilih sendiri—laporkan perbedaan ini secara jujur kepada pengguna.'
            };
        }

        if (isStale) {
            return {
                level: this.LEVELS.STALE,
                directive: 'WARN_FRESHNESS',
                guidance: 'Data ini sudah lewat masa berlakunya. Informasikan bahwa perlu pengecekan ulang data terbaru.'
            };
        }

        if (evidenceCount === 0 || confidence < 0.3) {
            return {
                level: this.LEVELS.UNKNOWN,
                directive: 'TRIGGER_RESEARCH',
                guidance: 'Informasi belum tersedia di sistem. Jangan mengarang—nyatakan belum punya data dan tawarkan untuk mencarinya.'
            };
        }

        if (confidence >= 0.85) {
            return {
                level: this.LEVELS.CERTAIN,
                directive: 'DIRECT_ANSWER',
                guidance: 'Data diverifikasi penuh. Jawab dengan tegas dan lugas.'
            };
        }

        if (confidence >= 0.65) {
            return {
                level: this.LEVELS.HIGH,
                directive: 'DIRECT_ANSWER',
                guidance: 'Data terbukti secara logis. Jawab secara informatif.'
            };
        }

        if (confidence >= 0.45) {
            return {
                level: this.LEVELS.MEDIUM,
                directive: 'QUALIFIED_ANSWER',
                guidance: 'Sertakan catatan kualifikasi atau asumsi yang mendasari jawaban.'
            };
        }

        return {
            level: this.LEVELS.LOW,
            directive: 'ASK_OR_RESEARCH',
            guidance: 'Tingkat kepastian rendah. Tanyakan detail tambahan sebelum bertindak.'
        };
    }
}
