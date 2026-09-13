/**
 * HypothesisEngine.mjs
 *
 * Generates structured hypotheses about lead opportunities.
 * Hypotheses are proposals — NOT facts.
 *
 * INVARIANT:
 *   HYPOTHESIS.classification is always INFERENCE, never FACT.
 *   Hypotheses do NOT bypass evidence validation.
 *   Hypotheses do NOT trigger outbound.
 *   Hypotheses guide the ResearchPlanner, not the ApprovalEngine.
 *
 * HYPOTHESIS structure:
 * {
 *   type: "HYPOTHESIS",
 *   hypothesisId: "HYP-xxx",
 *   product: "telur",
 *   statement: "TELUR is likely a strong opportunity for Warteg Sinar Baru",
 *   basis: "CATEGORY_PRIOR + MENU_EVIDENCE",
 *   supportingEvidence: ["EV-001"],
 *   confidence: 0.82,         // 0..1
 *   classification: "INFERENCE",  // NEVER FACT
 *   uncertainty: ["volume", "frequency"],
 *   generatedAt: "..."
 * }
 */

import { AIOutputValidator } from './AIOutputValidator.mjs';

const CONFIDENCE_THRESHOLDS = {
    DIRECT:             0.88,
    STRONG_INFERENCE:   0.70,
    MODERATE_INFERENCE: 0.50,
    WEAK_INFERENCE:     0.30,
    UNKNOWN:            0.10
};

export class HypothesisEngine {
    constructor() {
        this.validator = new AIOutputValidator();
    }

    /**
     * Generate hypotheses from demand matches + evidence.
     *
     * @param {object} lead
     * @param {object[]} demandMatches - from SupplyDemandMatcher
     * @param {object[]} evidenceList - All evidence for this lead
     * @param {string[]} unknowns - Known unknowns
     * @returns {object[]} Validated hypotheses (INFERENCE only)
     */
    generate(lead, demandMatches, evidenceList, unknowns = []) {
        const hypotheses = [];
        const knownEvidenceIds = evidenceList.map(e => e.evidenceId);

        for (const match of demandMatches) {
            if (!match.activeRecommendation) continue; // Don't hypothesize OOS

            // Find supporting evidence for this product
            const supportingEvidenceIds = evidenceList
                .filter(e => e.domain === 'menu' || e.domain === 'demand')
                .filter(e => {
                    const val = (e.normalizedValue || '').toLowerCase();
                    return val.includes(match.product) || val.includes(match.product.replace('_', ' '));
                })
                .map(e => e.evidenceId);

            const confidence = CONFIDENCE_THRESHOLDS[match.demandSignal] ?? 0.3;
            const adjustedConfidence = confidence * match.matchScore;

            const rawHypothesis = {
                type: 'HYPOTHESIS',
                hypothesisId: `HYP-${lead.id || lead.leadId || 'unknown'}-${match.product}-${Date.now()}`,
                product: match.product,
                statement: this._buildStatement(lead, match, adjustedConfidence),
                basis: this._determineBasis(match.demandSignal, supportingEvidenceIds),
                supportingEvidence: supportingEvidenceIds.length > 0 ? supportingEvidenceIds : [],
                confidence: parseFloat(adjustedConfidence.toFixed(4)),
                classification: 'INFERENCE', // ALWAYS INFERENCE — never FACT from AI
                demandSignal: match.demandSignal,
                supplyStatus: match.supplyStatus,
                uncertainty: unknowns,
                generatedAt: new Date().toISOString()
            };

            // Validate through AIOutputValidator
            const validationResult = this.validator.validate(rawHypothesis, 'HYPOTHESIS', knownEvidenceIds);
            if (validationResult.valid) {
                hypotheses.push(validationResult.sanitized);
            }
            // If invalid, skip silently (log in production)
        }

        // Sort by confidence descending
        hypotheses.sort((a, b) => b.confidence - a.confidence);
        return hypotheses;
    }

    /**
     * Evaluate whether a hypothesis is still supported by current evidence.
     * Used by ContradictionHunter.
     */
    evaluate(hypothesis, currentEvidence) {
        const supportingCount = hypothesis.supportingEvidence?.filter(id =>
            currentEvidence.some(e => e.evidenceId === id)
        ).length ?? 0;

        return {
            hypothesisId: hypothesis.hypothesisId,
            stillSupported: supportingCount > 0,
            supportingEvidenceCount: supportingCount,
            evaluatedAt: new Date().toISOString()
        };
    }

    _buildStatement(lead, match, confidence) {
        const confLabel = confidence >= 0.7 ? 'strong' : confidence >= 0.4 ? 'moderate' : 'weak';
        const bizName = lead.businessName || 'this business';
        return `${match.product.toUpperCase()} is a ${confLabel} opportunity for ${bizName} based on ${match.demandSignal.toLowerCase().replace(/_/g, ' ')}`;
    }

    _determineBasis(demandSignal, supportingIds) {
        const evBasis = supportingIds.length > 0 ? `EVIDENCE(${supportingIds.join(',')})` : 'NO_EVIDENCE';
        return `${demandSignal} + ${evBasis}`;
    }
}
