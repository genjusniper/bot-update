/**
 * TrustScoreEngine.mjs
 * 
 * Computes deterministic multi-factor trust score for decisions.
 * The AI model does NOT decide whether it is trusted; the policy threshold dictates authority.
 * 
 * Vectors:
 * - Source Trust (0-100)
 * - Fact Confidence (0-100)
 * - Tool Reliability (0-100)
 * - Memory Confidence (0-100)
 * - User Intent Clarity (0-100)
 * 
 * Action Policy:
 * >= 85 -> AUTONOMOUS
 * 65-84 -> VERIFY
 * 40-64 -> ASK
 * < 40  -> HUMAN_REVIEW
 */

export class TrustScoreEngine {
    static computeTrust({
        sourceTrust = 85,
        factConfidence = 80,
        toolReliability = 95,
        memoryConfidence = 80,
        intentClarity = 85
    } = {}) {
        // Weighted average
        const overallTrust = Math.round(
            (sourceTrust * 0.25) +
            (factConfidence * 0.25) +
            (toolReliability * 0.20) +
            (memoryConfidence * 0.15) +
            (intentClarity * 0.15)
        );

        let actionDirective = 'HUMAN_REVIEW';
        if (overallTrust >= 85) {
            actionDirective = 'AUTONOMOUS';
        } else if (overallTrust >= 65) {
            actionDirective = 'VERIFY';
        } else if (overallTrust >= 40) {
            actionDirective = 'ASK';
        }

        return {
            overallTrust,
            breakdown: {
                sourceTrust,
                factConfidence,
                toolReliability,
                memoryConfidence,
                intentClarity
            },
            actionDirective,
            reason: `Trust score is ${overallTrust}/100 -> Routing to directive ${actionDirective}.`
        };
    }
}
