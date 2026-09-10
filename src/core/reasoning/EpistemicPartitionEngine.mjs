// src/core/reasoning/EpistemicPartitionEngine.mjs
// Epistemic Partitioning & Anti-Hallucination Engine
// Explicitly partitions cognitive items into: FACT, INFERENCE, ASSUMPTION, HYPOTHESIS, PREDICTION.
// Declares 'UNKNOWN / NEED VERIFICATION' when factual ground truth is insufficient.

export const EpistemicClass = Object.freeze({
    FACT: 'FACT',
    INFERENCE: 'INFERENCE',
    ASSUMPTION: 'ASSUMPTION',
    HYPOTHESIS: 'HYPOTHESIS',
    PREDICTION: 'PREDICTION'
});

export const CertaintyLevel = Object.freeze({
    DEFINITIVE: 'pasti',
    HIGH_PROBABILITY: 'kemungkinan besar',
    ROUGH_ESTIMATE: 'tebakan kasar',
    UNKNOWN: 'tidak tahu'
});

export class EpistemicPartitionEngine {
    /**
     * Partitions a cognitive payload into distinct epistemic buckets
     * @param {Object} payload
     * @param {Array<string|Object>} [payload.facts=[]]
     * @param {Array<string|Object>} [payload.inferences=[]]
     * @param {Array<string|Object>} [payload.assumptions=[]]
     * @param {Array<string|Object>} [payload.hypotheses=[]]
     * @param {Array<string|Object>} [payload.predictions=[]]
     * @returns {Object} Structured partitioned record
     */
    static partition({ facts = [], inferences = [], assumptions = [], hypotheses = [], predictions = [] } = {}) {
        const normalize = (items, defaultClass, defaultCertainty) => {
            return (items || []).map((item, idx) => {
                if (typeof item === 'string') {
                    return {
                        id: `${defaultClass.toLowerCase()}_${idx + 1}`,
                        text: item,
                        class: defaultClass,
                        certainty: defaultCertainty,
                        verified: defaultClass === EpistemicClass.FACT,
                        source: defaultClass === EpistemicClass.FACT ? 'GROUND_TRUTH' : 'COGNITION'
                    };
                }
                return {
                    id: item.id || `${defaultClass.toLowerCase()}_${idx + 1}`,
                    text: item.text || '',
                    class: item.class || defaultClass,
                    certainty: item.certainty || defaultCertainty,
                    verified: item.verified ?? (defaultClass === EpistemicClass.FACT),
                    source: item.source || (defaultClass === EpistemicClass.FACT ? 'GROUND_TRUTH' : 'COGNITION')
                };
            });
        };

        const partitionRecord = {
            facts: normalize(facts, EpistemicClass.FACT, CertaintyLevel.DEFINITIVE),
            inferences: normalize(inferences, EpistemicClass.INFERENCE, CertaintyLevel.HIGH_PROBABILITY),
            assumptions: normalize(assumptions, EpistemicClass.ASSUMPTION, CertaintyLevel.ROUGH_ESTIMATE),
            hypotheses: normalize(hypotheses, EpistemicClass.HYPOTHESIS, CertaintyLevel.ROUGH_ESTIMATE),
            predictions: normalize(predictions, EpistemicClass.PREDICTION, CertaintyLevel.ROUGH_ESTIMATE),
            timestamp: Date.now()
        };

        partitionRecord.summary = {
            factCount: partitionRecord.facts.length,
            inferenceCount: partitionRecord.inferences.length,
            assumptionCount: partitionRecord.assumptions.length,
            hypothesisCount: partitionRecord.hypotheses.length,
            predictionCount: partitionRecord.predictions.length,
            isGrounded: partitionRecord.facts.length > 0
        };

        return partitionRecord;
    }

    /**
     * Checks if current factual knowledge is sufficient to answer a query
     * @param {Array} facts
     * @param {string} query
     * @returns {{ sufficient: boolean, verdict: string, message: string }}
     */
    static checkSufficiency(facts = [], query = '') {
        const factList = Array.isArray(facts) ? facts : [];
        if (factList.length === 0) {
            return {
                sufficient: false,
                verdict: CertaintyLevel.UNKNOWN,
                message: 'Fakta belum cukup. ARKA menyatakan belum tahu dan perlu dicek / diverifikasi.'
            };
        }

        return {
            sufficient: true,
            verdict: CertaintyLevel.HIGH_PROBABILITY,
            message: 'Fakta memadai untuk perumusan inferensi terverifikasi.'
        };
    }

    /**
     * Classifies a free-form statement into its appropriate epistemic class
     * @param {string} text
     * @param {Object} [options={}]
     * @returns {{ class: string, certainty: string, confidence: number }}
     */
    static classifyStatement(text = '', options = {}) {
        const lower = String(text).toLowerCase();
        
        // Prediction markers
        if (/(akan|bakal|diprediksi|kemungkinan nanti|prediksi|estimasi esok)/i.test(lower)) {
            return {
                class: EpistemicClass.PREDICTION,
                certainty: CertaintyLevel.ROUGH_ESTIMATE,
                confidence: 0.85
            };
        }

        // Hypothesis markers
        if (/(bisa jadi|mungkinkah|hipotesis|mungkin karena|dugaan sementara)/i.test(lower)) {
            return {
                class: EpistemicClass.HYPOTHESIS,
                certainty: CertaintyLevel.ROUGH_ESTIMATE,
                confidence: 0.80
            };
        }

        // Assumption markers
        if (/(asumsi|anggap saja|asumsikan|kalau kita anggap)/i.test(lower)) {
            return {
                class: EpistemicClass.ASSUMPTION,
                certainty: CertaintyLevel.ROUGH_ESTIMATE,
                confidence: 0.85
            };
        }

        // Inference markers
        if (/(oleh karena itu|maka dari itu|kesimpulannya|artinya|sehingga)/i.test(lower)) {
            return {
                class: EpistemicClass.INFERENCE,
                certainty: CertaintyLevel.HIGH_PROBABILITY,
                confidence: 0.90
            };
        }

        // Verified Facts (Default if provided with ground-truth flag)
        if (options.verified === true || options.isFact === true) {
            return {
                class: EpistemicClass.FACT,
                certainty: CertaintyLevel.DEFINITIVE,
                confidence: 1.0
            };
        }

        return {
            class: EpistemicClass.INFERENCE,
            certainty: CertaintyLevel.HIGH_PROBABILITY,
            confidence: 0.70
        };
    }

    /**
     * Formats the partitioned record as a prompt injection block for LLM guidance
     * @param {Object} partitionRecord
     * @returns {string} Formatted system prompt block
     */
    static formatForPrompt(partitionRecord) {
        if (!partitionRecord) return '';

        let prompt = '\n=== ARKA EPISTEMIC PARTITIONING & GROUNDING ===\n';
        prompt += 'ATURAN ANTI-HALUSINASI KETAT:\n';
        prompt += '1. FACT: Sampaikan dengan pasti (100% fakta terverifikasi).\n';
        prompt += '2. INFERENCE: Sampaikan sebagai kesimpulan logis dari fakta.\n';
        prompt += '3. ASSUMPTION / HYPOTHESIS: Wajib beri label transparan (kemungkinan / dugaan).\n';
        prompt += '4. PREDICTION: Sampaikan sebagai estimasi masa depan.\n';
        prompt += '5. JIKA FAKTA KURANG: Katakan jujur "belum tahu / butuh dicek". Jangan mengarang.\n\n';

        if (partitionRecord.facts?.length) {
            prompt += '[VERIFIED FACTS]:\n' + partitionRecord.facts.map(f => `• ${f.text}`).join('\n') + '\n';
        }
        if (partitionRecord.inferences?.length) {
            prompt += '[LOGICAL INFERENCES]:\n' + partitionRecord.inferences.map(i => `• ${i.text}`).join('\n') + '\n';
        }
        if (partitionRecord.assumptions?.length) {
            prompt += '[WORKING ASSUMPTIONS]:\n' + partitionRecord.assumptions.map(a => `• ${a.text}`).join('\n') + '\n';
        }
        if (partitionRecord.hypotheses?.length) {
            prompt += '[TESTABLE HYPOTHESES]:\n' + partitionRecord.hypotheses.map(h => `• ${h.text}`).join('\n') + '\n';
        }
        if (partitionRecord.predictions?.length) {
            prompt += '[FUTURE PREDICTIONS]:\n' + partitionRecord.predictions.map(p => `• ${p.text}`).join('\n') + '\n';
        }

        return prompt.trim();
    }

    /**
     * Enforces anti-hallucination check on a text draft
     * @param {string} draftText
     * @param {Array<string>} knownFacts
     * @returns {{ passed: boolean, flaggedClaims: string[], sanitizedText: string }}
     */
    static enforceAntiHallucination(draftText = '', knownFacts = []) {
        const text = String(draftText || '');
        const flagged = [];

        // Catch falsely omniscient phrases when zero known facts exist
        if ((!knownFacts || knownFacts.length === 0) && /(pasti 100%|sudah pasti benar|dijamin tanpa ragu)/i.test(text)) {
            flagged.push('Overconfident assertion without verified ground truth.');
            const sanitized = text.replace(/(pasti 100%|sudah pasti benar|dijamin tanpa ragu)/gi, 'kemungkinan besar');
            return {
                passed: false,
                flaggedClaims: flagged,
                sanitizedText: sanitized
            };
        }

        return {
            passed: true,
            flaggedClaims: [],
            sanitizedText: text
        };
    }
}
