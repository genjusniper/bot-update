// src/core/reasoning/UncertaintyEngine.mjs
// Epistemic uncertainty evaluation, confidence scoring, freshness rating, and tone calibration
// Prevents ARKA from hallucinating or sounding falsely omniscient

export class UncertaintyEngine {
    static EPISTEMIC_STATES = {
        KNOWN_FACT: 'KNOWN_FACT',
        SUPPORTED_HYPOTHESIS: 'SUPPORTED_HYPOTHESIS',
        SPECULATION: 'SPECULATION',
        CONFIRMED_UNKNOWN: 'CONFIRMED_UNKNOWN'
    };

    static TONES = {
        DEFINITIVE: 'DEFINITIVE',                 // Confident, concise, assertive ("Bisa. Errornya di baris 42.")
        CAUTIOUS: 'CAUTIOUS',                     // Measured, transparent ("Kemungkinan besar masalahnya di X, tapi perlu verifikasi.")
        EXPLORATORY_PROBING: 'EXPLORATORY_PROBING'// Humble, asking for minimal diagnostic signal ("Belum cukup data. Coba cek log X dulu.")
    };

    /**
     * Evaluates epistemic uncertainty and calibrates response tone
     * @param {Object} params
     * @param {string} params.query
     * @param {Array<Object>} [params.facts=[]]
     * @param {Array<Object>} [params.evidence=[]]
     * @param {number} [params.infoAgeMs=0]
     * @param {boolean} [params.contradictions=false]
     * @returns {Object} Uncertainty Evaluation Report
     */
    static evaluate({ query = '', facts = [], evidence = [], infoAgeMs = 0, contradictions = false }) {
        let confidenceScore = 0.5;
        let evidenceStrength = 'ABSENT';
        let freshnessScore = 1.0;

        // 1. Assess Evidence Strength
        const totalEvidence = (facts?.length || 0) + (evidence?.length || 0);
        if (totalEvidence >= 3) {
            evidenceStrength = 'STRONG';
            confidenceScore += 0.35;
        } else if (totalEvidence >= 1) {
            evidenceStrength = 'MODERATE';
            confidenceScore += 0.20;
        } else {
            evidenceStrength = 'ABSENT';
            confidenceScore -= 0.25;
        }

        // 2. Assess Freshness (Degrade if older than 24h, severe if older than 7d)
        const ONE_DAY_MS = 86400000;
        const ONE_WEEK_MS = ONE_DAY_MS * 7;
        if (infoAgeMs > ONE_WEEK_MS) {
            freshnessScore = 0.3;
            confidenceScore -= 0.20;
        } else if (infoAgeMs > ONE_DAY_MS) {
            freshnessScore = 0.7;
            confidenceScore -= 0.05;
        } else {
            freshnessScore = 1.0;
        }

        // 3. Penalty for contradictions
        if (contradictions) {
            confidenceScore -= 0.40;
        }

        // Clamp confidence between 0.05 and 0.99
        confidenceScore = Math.max(0.05, Math.min(0.99, Number(confidenceScore.toFixed(2))));

        // 4. Derive Epistemic State
        let epistemicState = this.EPISTEMIC_STATES.SPECULATION;
        if (confidenceScore >= 0.80 && evidenceStrength === 'STRONG' && !contradictions) {
            epistemicState = this.EPISTEMIC_STATES.KNOWN_FACT;
        } else if (confidenceScore >= 0.50 && evidenceStrength !== 'ABSENT') {
            epistemicState = this.EPISTEMIC_STATES.SUPPORTED_HYPOTHESIS;
        } else if (confidenceScore < 0.25 && evidenceStrength === 'ABSENT') {
            epistemicState = this.EPISTEMIC_STATES.CONFIRMED_UNKNOWN;
        }

        // 5. Recommend Communicative Tone
        let recommendedTone = this.TONES.EXPLORATORY_PROBING;
        if (confidenceScore >= 0.82 && !contradictions) {
            recommendedTone = this.TONES.DEFINITIVE;
        } else if (confidenceScore >= 0.45 && !contradictions) {
            recommendedTone = this.TONES.CAUTIOUS;
        } else {
            recommendedTone = this.TONES.EXPLORATORY_PROBING;
        }

        return {
            query,
            confidenceScore,
            evidenceStrength,
            freshnessScore,
            contradictions,
            epistemicState,
            recommendedTone,
            requiresProbing: recommendedTone === this.TONES.EXPLORATORY_PROBING
        };
    }
}
