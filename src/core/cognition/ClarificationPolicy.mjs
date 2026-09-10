// src/core/cognition/ClarificationPolicy.mjs
// Rules governing when to ask clarifying questions vs. making reasonable assumptions

export class ClarificationPolicy {
    /**
     * Evaluates ambiguity and decides if clarification is warranted
     * @param {Object} params
     * @param {number} [params.ambiguityScore=0.0] - 0.0 (crystal clear) to 1.0 (completely ambiguous)
     * @param {boolean} [params.isDestructive=false] - If action involves delete/restart/kill
     * @param {string} [params.detectedIntent='QUERY']
     * @returns {Object} Clarification directive
     */
    static evaluate({ ambiguityScore = 0.0, isDestructive = false, detectedIntent = 'QUERY' }) {
        // High risk / destructive actions ALWAYS require clarification
        if (isDestructive) {
            return {
                mustClarify: true,
                maxQuestions: 1,
                reason: 'DESTRUCTIVE_ACTION_SAFETY_GATE',
                instruction: 'Minta konfirmasi 1 kalimat pendek sebelum mengeksekusi tindakan berisiko.'
            };
        }

        // Ambiguity threshold: < 0.40 -> Assume most probable intent, do NOT interrupt user
        if (ambiguityScore < 0.40) {
            return {
                mustClarify: false,
                maxQuestions: 0,
                reason: 'HIGH_CERTAINTY_BIAS_FOR_ACTION',
                instruction: 'Konteks jelas. Langsung eksekusi atau jawab, jangan tanyakan hal sepele.'
            };
        }

        // Moderate ambiguity (0.40 - 0.70) -> Proceed with assumption unless critical
        if (ambiguityScore <= 0.70) {
            return {
                mustClarify: false,
                maxQuestions: 0,
                reason: 'PRAGMATIC_ASSUMPTION',
                instruction: 'Asumsikan maksud paling logis, jawab santai tanpa interogasi.'
            };
        }

        // Severe ambiguity (> 0.70) -> Exactly 1 single short clarification question
        return {
            mustClarify: true,
            maxQuestions: 1,
            reason: 'FATAL_AMBIGUITY',
            instruction: 'Tanyakan MAKSIMAL SATU (1) pertanyaan klarifikasi pendek (maks 8 kata).'
        };
    }
}
