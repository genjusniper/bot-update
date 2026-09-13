/**
 * AIOutputValidator.mjs
 *
 * The architectural firewall between AI output and the deterministic pipeline.
 * AI outputs are PROPOSALS. They become nothing without passing this validator.
 *
 * RULES:
 *   - AI cannot assert FACT without evidence backing
 *   - AI cannot output quantity, price, supplier, frequency as FACT
 *   - AI cannot output outbound commands
 *   - AI cannot mutate evidence
 *   - Malformed JSON is rejected entirely
 *   - Partial hallucination rejects the entire output (not silently trimmed)
 *
 * AUTHORITY MODEL:
 *   AI CAN  → reason, hypothesize, plan research, identify unknowns,
 *              detect contradictions, discover patterns, explain decisions
 *   AI CANNOT → assert unsupported FACT, trigger outbound, bypass QualityFirewall,
 *               approve outreach, modify SalesGuard, invent quantities/prices/suppliers
 */

const FORBIDDEN_OUTPUT_FIELDS = [
    'outbound', 'send', 'sendMessage', 'baileys', 'whatsapp',
    'autoApprove', 'bypassApproval', 'approve', 'dispatch',
    'triggerOutreach', 'outboundMode'
];

const HALLUCINATION_FIELDS = ['quantity', 'qty', 'price', 'buyingPrice', 'sellingPrice',
    'currentSupplier', 'supplierName', 'purchaseFrequency', 'transactionVolume'];

export const VALIDATION_RESULT = {
    VALID: 'VALID',
    REJECTED_MALFORMED: 'REJECTED_MALFORMED',
    REJECTED_FORBIDDEN: 'REJECTED_FORBIDDEN',
    REJECTED_HALLUCINATION: 'REJECTED_HALLUCINATION',
    REJECTED_UNSUPPORTED_FACT: 'REJECTED_UNSUPPORTED_FACT',
    REJECTED_OUTBOUND_ATTEMPT: 'REJECTED_OUTBOUND_ATTEMPT'
};

export class AIOutputValidator {
    /**
     * Validate an AI output object.
     * @param {object} aiOutput - Raw AI output
     * @param {string} expectedType - 'HYPOTHESIS' | 'RESEARCH_PLAN' | 'PATTERN' | 'EXPLANATION' | 'CONTRADICTION'
     * @param {string[]} knownEvidenceIds - Evidence IDs currently in the graph
     * @returns {{ valid: boolean, result: VALIDATION_RESULT, reason?: string, sanitized?: object }}
     */
    validate(aiOutput, expectedType, knownEvidenceIds = []) {
        // 1. Structural validation
        if (!aiOutput || typeof aiOutput !== 'object') {
            return { valid: false, result: VALIDATION_RESULT.REJECTED_MALFORMED, reason: 'Output is not an object' };
        }

        if (aiOutput.type && aiOutput.type !== expectedType) {
            return { valid: false, result: VALIDATION_RESULT.REJECTED_MALFORMED,
                reason: `Type mismatch: expected ${expectedType}, got ${aiOutput.type}` };
        }

        // 2. Forbidden outbound fields
        const outputStr = JSON.stringify(aiOutput).toLowerCase();
        for (const field of FORBIDDEN_OUTPUT_FIELDS) {
            if (outputStr.includes(`"${field}"`)) {
                return { valid: false, result: VALIDATION_RESULT.REJECTED_OUTBOUND_ATTEMPT,
                    reason: `Forbidden field detected: "${field}". AI cannot trigger outbound.` };
            }
        }

        // 3. Hallucination guard — check if any hallucination fields are present with numeric values
        for (const field of HALLUCINATION_FIELDS) {
            if (Object.prototype.hasOwnProperty.call(aiOutput, field) && typeof aiOutput[field] === 'number') {
                return { valid: false, result: VALIDATION_RESULT.REJECTED_HALLUCINATION,
                    reason: `AI output contains numeric operational data ("${field}") without DIRECT evidence.` };
            }
        }

        // 4. FACT classification guard
        if (this._hasUnsupportedFact(aiOutput, knownEvidenceIds)) {
            return { valid: false, result: VALIDATION_RESULT.REJECTED_UNSUPPORTED_FACT,
                reason: 'AI classified something as FACT without referencing valid evidenceIds.' };
        }

        // 5. Type-specific validation
        const typeResult = this._validateByType(aiOutput, expectedType, knownEvidenceIds);
        if (!typeResult.valid) return typeResult;

        // 6. Sanitize — strip any fields that shouldn't propagate
        const sanitized = this._sanitize(aiOutput);

        return { valid: true, result: VALIDATION_RESULT.VALID, sanitized };
    }

    /**
     * Validate a raw JSON string from AI.
     * Handles malformed JSON gracefully.
     */
    validateRaw(rawString, expectedType, knownEvidenceIds = []) {
        if (typeof rawString !== 'string' || rawString.trim().length === 0) {
            return { valid: false, result: VALIDATION_RESULT.REJECTED_MALFORMED, reason: 'Empty or non-string output' };
        }

        let parsed;
        try {
            parsed = JSON.parse(rawString);
        } catch (e) {
            return { valid: false, result: VALIDATION_RESULT.REJECTED_MALFORMED, reason: `Malformed JSON: ${e.message}` };
        }

        return this.validate(parsed, expectedType, knownEvidenceIds);
    }

    _validateByType(output, type, knownEvidenceIds) {
        switch (type) {
            case 'HYPOTHESIS':
                if (!output.product && !output.field) {
                    return { valid: false, result: VALIDATION_RESULT.REJECTED_MALFORMED, reason: 'Hypothesis must have product or field' };
                }
                if (typeof output.confidence !== 'number' || output.confidence < 0 || output.confidence > 1) {
                    return { valid: false, result: VALIDATION_RESULT.REJECTED_MALFORMED, reason: 'Hypothesis confidence must be 0..1' };
                }
                if (!output.statement || typeof output.statement !== 'string') {
                    return { valid: false, result: VALIDATION_RESULT.REJECTED_MALFORMED, reason: 'Hypothesis must have a statement' };
                }
                break;

            case 'RESEARCH_PLAN':
                if (!Array.isArray(output.targets)) {
                    return { valid: false, result: VALIDATION_RESULT.REJECTED_MALFORMED, reason: 'Research plan must have targets array' };
                }
                if (output.targets.length > 3) {
                    return { valid: false, result: VALIDATION_RESULT.REJECTED_MALFORMED,
                        reason: `Research plan exceeds MAX_FIELDS_PER_RESEARCH (got ${output.targets.length})` };
                }
                break;

            case 'CONTRADICTION':
                if (!Array.isArray(output.supportingEvidence) || !Array.isArray(output.contradictingEvidence)) {
                    return { valid: false, result: VALIDATION_RESULT.REJECTED_MALFORMED,
                        reason: 'Contradiction must have supportingEvidence and contradictingEvidence arrays' };
                }
                break;

            case 'PATTERN':
                if (!output.pattern || typeof output.pattern !== 'string') {
                    return { valid: false, result: VALIDATION_RESULT.REJECTED_MALFORMED, reason: 'Pattern must have pattern string' };
                }
                if (output.classification === 'FACT') {
                    return { valid: false, result: VALIDATION_RESULT.REJECTED_UNSUPPORTED_FACT,
                        reason: 'Patterns cannot be classified as FACT — they are INFERENCE at best.' };
                }
                break;

            case 'EXPLANATION':
                if (!output.decision || !output.reasoning) {
                    return { valid: false, result: VALIDATION_RESULT.REJECTED_MALFORMED, reason: 'Explanation must have decision and reasoning' };
                }
                break;
        }
        return { valid: true };
    }

    _hasUnsupportedFact(output, knownEvidenceIds) {
        const str = JSON.stringify(output);
        // Look for classification: FACT without supportingEvidence referencing known IDs
        if (!str.includes('"FACT"')) return false;

        // If it claims FACT but has no supportingEvidence array, reject
        if (output.classification === 'FACT' && (!output.supportingEvidence || output.supportingEvidence.length === 0)) {
            return true;
        }

        // If supportingEvidence references IDs not in the graph, reject
        if (output.supportingEvidence && knownEvidenceIds.length > 0) {
            const orphaned = output.supportingEvidence.filter(id => !knownEvidenceIds.includes(id));
            if (orphaned.length > 0) return true;
        }

        return false;
    }

    _sanitize(output) {
        const sanitized = { ...output };
        // Remove any fields that could be misused
        for (const field of [...FORBIDDEN_OUTPUT_FIELDS, ...HALLUCINATION_FIELDS]) {
            delete sanitized[field];
        }
        return sanitized;
    }
}
