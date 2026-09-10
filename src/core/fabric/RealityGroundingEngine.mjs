// src/core/fabric/RealityGroundingEngine.mjs
// Epistemic classification of statements into Fact, Observation, Claim, Inference, Prediction, and Unknown

export class RealityGroundingEngine {
    static EPISTEMIC_TYPES = Object.freeze({
        FACT: 'FACT',                       // Independently verified ground truth
        OBSERVATION: 'OBSERVATION',         // Sensory / system observation
        USER_CLAIM: 'USER_CLAIM',           // User stated claim (unverified)
        EXTERNAL_SOURCE: 'EXTERNAL_SOURCE', // High-credibility news wire or API
        INFERENCE: 'INFERENCE',             // Logical deduction
        HYPOTHESIS: 'HYPOTHESIS',           // Candidate explanation
        PREDICTION: 'PREDICTION',           // Future projection
        UNKNOWN: 'UNKNOWN'                  // Not yet determined
    });

    /**
     * Evaluates statement epistemic certainty and assigns grounding status
     * @param {Object} params
     * @param {string} params.text
     * @param {string} [params.source='USER']
     * @param {boolean} [params.isConfirmed=false]
     * @returns {{ epistemicClass: string, certaintyScore: number, requiresHedging: boolean, hedgePhrase: string }}
     */
    static evaluate({ text = '', source = 'USER', isConfirmed = false }) {
        if (!text) return { epistemicClass: this.EPISTEMIC_TYPES.UNKNOWN, certaintyScore: 0.1, requiresHedging: true, hedgePhrase: 'belum ada data' };

        const lower = text.toLowerCase();

        // 1. Confirmed ground truth
        if (isConfirmed || source === 'ADMIN' || source === 'SYSTEM_CORE') {
            return {
                epistemicClass: this.EPISTEMIC_TYPES.FACT,
                certaintyScore: 0.98,
                requiresHedging: false,
                hedgePhrase: ''
            };
        }

        // 2. Future predictions / forecasts ("besok bakal", "nanti pasti", "kemungkinan")
        if (/\b(bakal|nanti pasti|akan|prediksi|kemungkinan|ramalan|kira-kira besok)\b/i.test(lower)) {
            return {
                epistemicClass: this.EPISTEMIC_TYPES.PREDICTION,
                certaintyScore: 0.60,
                requiresHedging: true,
                hedgePhrase: 'kemungkinan'
            };
        }

        // 3. User claims ("katanya", "aku denger", "dia bilang", "kayaknya")
        if (/\b(katanya|denger-denger|kayaknya|sepertinya|gosipnya|kata orang)\b/i.test(lower)) {
            return {
                epistemicClass: this.EPISTEMIC_TYPES.HYPOTHESIS,
                certaintyScore: 0.45,
                requiresHedging: true,
                hedgePhrase: 'menurut kabar yang beredar'
            };
        }

        // 4. Default user statement without proof
        if (source === 'USER') {
            return {
                epistemicClass: this.EPISTEMIC_TYPES.USER_CLAIM,
                certaintyScore: 0.70,
                requiresHedging: false,
                hedgePhrase: ''
            };
        }

        return {
            epistemicClass: this.EPISTEMIC_TYPES.OBSERVATION,
            certaintyScore: 0.85,
            requiresHedging: false,
            hedgePhrase: ''
        };
    }
}
