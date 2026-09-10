// src/core/identity/ContactConfidenceEngine.mjs
// Tracks confidence score (0.0 to 1.0) of contact attribution, decay, and verification thresholds

export class ContactConfidenceEngine {
    static VERIFICATION_THRESHOLD = 0.85;
    static HIGH_CONFIDENCE = 0.70;
    static LOW_CONFIDENCE = 0.40;

    /**
     * Evaluates confidence of contact identification
     * @param {Object} params
     * @param {boolean} params.isVerified - explicitly whitelisted or verified by owner
     * @param {string} params.matchType - EXACT, JID, PHONE, HONORIFIC_STRIPPED, PARTIAL_ALIAS, NONE
     * @param {number} [params.baseScore=0.8]
     * @param {number} [params.lastInteractionTimestamp=Date.now()]
     * @returns {{ confidenceScore: number, isReliable: boolean, verificationState: string }}
     */
    static evaluate({ isVerified = false, matchType = 'NONE', baseScore = 0.8, lastInteractionTimestamp = Date.now() }) {
        if (isVerified) {
            return {
                confidenceScore: 1.0,
                isReliable: true,
                verificationState: 'VERIFIED_TRUTH'
            };
        }

        let score = baseScore;

        // Modifier by match type
        switch (matchType) {
            case 'EXACT':
            case 'JID':
            case 'PHONE':
                score = Math.min(1.0, score * 1.0);
                break;
            case 'HONORIFIC_STRIPPED':
                score = score * 0.95;
                break;
            case 'PARTIAL_ALIAS':
                score = score * 0.80;
                break;
            case 'NONE':
            default:
                score = 0.1;
                break;
        }

        // Time decay: if no interaction in 90 days, decay slightly
        const daysSince = (Date.now() - lastInteractionTimestamp) / (1000 * 60 * 60 * 24);
        if (daysSince > 90) {
            score = Math.max(0.2, score * 0.90);
        }

        const isReliable = score >= this.HIGH_CONFIDENCE;
        const verificationState = score >= this.VERIFICATION_THRESHOLD 
            ? 'HIGHLY_CONFIDENT' 
            : (score >= this.HIGH_CONFIDENCE ? 'PROBABLE' : 'UNCONFIRMED');

        return {
            confidenceScore: Number(score.toFixed(3)),
            isReliable,
            verificationState
        };
    }
}
