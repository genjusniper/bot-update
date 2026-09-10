// src/core/fabric/RealityGroundingLayer.mjs
// Three-tier ontological boundary: FACT (direct observation) vs EVIDENCE (stored logs/records) vs INFERENCE (model deduction)
// Strictly prevents AI inferences from masquerading as ground-truth facts

export class RealityGroundingLayer {
    static TIERS = Object.freeze({
        FACT: 'FACT',           // Direct sensory or system observation (e.g. current date, PM2 status, user message text)
        EVIDENCE: 'EVIDENCE',   // Verifiable historical document, chat record, git commit, database row
        INFERENCE: 'INFERENCE'  // Model deduction, hypothesis, extrapolation, generated guess
    });

    /**
     * Categorizes an array of claims/statements into the three ontological tiers
     * @param {Array<{ id: string, text: string, source: 'SYSTEM'|'LOG'|'DATABASE'|'USER'|'LLM'|'HEURISTIC' }>} items
     * @returns {Object} Grounding Evaluation Result
     */
    static evaluateClaims(items = []) {
        const categorized = {
            facts: [],
            evidence: [],
            inferences: []
        };

        for (const item of items) {
            const src = (item.source || '').toUpperCase();
            if (src === 'SYSTEM' || src === 'SENSOR' || src === 'PROCESS') {
                categorized.facts.push({ ...item, tier: this.TIERS.FACT });
            } else if (src === 'DATABASE' || src === 'LOG' || src === 'GIT' || src === 'DOCUMENT') {
                categorized.evidence.push({ ...item, tier: this.TIERS.EVIDENCE });
            } else {
                categorized.inferences.push({ ...item, tier: this.TIERS.INFERENCE });
            }
        }

        const total = items.length;
        const verifiedCount = categorized.facts.length + categorized.evidence.length;
        const groundingRatio = total > 0 ? Number((verifiedCount / total).toFixed(2)) : 1.0;

        let hallucinationRisk = 'LOW';
        if (groundingRatio < 0.40) {
            hallucinationRisk = 'HIGH';
        } else if (groundingRatio < 0.70) {
            hallucinationRisk = 'MEDIUM';
        }

        return {
            totalClaims: total,
            factsCount: categorized.facts.length,
            evidenceCount: categorized.evidence.length,
            inferencesCount: categorized.inferences.length,
            groundingRatio,
            hallucinationRisk,
            categorized,
            isSufficientlyGrounded: hallucinationRisk !== 'HIGH'
        };
    }

    /**
     * Determines whether an inference is allowed to overwrite an existing fact/evidence
     * Rule: INFERENCE CAN NEVER OVERRIDE FACT OR VERIFIED EVIDENCE
     * @param {string} existingTier
     * @param {string} incomingTier
     * @returns {boolean}
     */
    static canOverride(existingTier, incomingTier) {
        if (existingTier === this.TIERS.FACT) {
            return incomingTier === this.TIERS.FACT;
        }
        if (existingTier === this.TIERS.EVIDENCE) {
            return incomingTier === this.TIERS.FACT || incomingTier === this.TIERS.EVIDENCE;
        }
        return true; // Existing is inference, anything can overwrite
    }
}
