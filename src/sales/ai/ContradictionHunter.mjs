/**
 * ContradictionHunter.mjs
 *
 * AI reasoning module that actively hunts for evidence
 * contradicting current hypotheses.
 *
 * PRINCIPLE:
 *   Confirmation bias is the enemy of intelligence.
 *   The system must ACTIVELY look for contradictions,
 *   not just passively detect them.
 *
 * RULES:
 *   - Never use "last write wins"
 *   - Never silently resolve conflicts
 *   - CRITICAL/HIGH conflicts → HUMAN_REVIEW
 *   - Contradictions are reported, not resolved automatically
 *
 * OUTPUT:
 * {
 *   type: "CONTRADICTION",
 *   contradictionId: "...",
 *   product: "telur",
 *   hypothesis: "TELUR demand is HIGH",
 *   supportingEvidence: ["E001"],
 *   contradictingEvidence: ["E010"],
 *   status: "CONFLICT",
 *   severity: "HIGH",
 *   resolution: "HUMAN_REVIEW"
 * }
 */

import { AIOutputValidator } from './AIOutputValidator.mjs';
import { CONFLICT_SEVERITY } from '../research/ConflictResolver.mjs';

export class ContradictionHunter {
    constructor() {
        this.validator = new AIOutputValidator();
    }

    /**
     * Hunt for contradictions between hypotheses and evidence.
     *
     * @param {object[]} hypotheses - Current hypotheses
     * @param {object[]} evidenceList - All evidence for this lead
     * @param {object[]} existingConflicts - Conflicts from ConflictResolver
     * @returns {object[]} Validated contradiction reports
     */
    hunt(hypotheses, evidenceList, existingConflicts = []) {
        const contradictions = [];
        const knownEvidenceIds = evidenceList.map(e => e.evidenceId);

        // 1. Hunt: do any recent evidence items contradict hypotheses?
        for (const hyp of hypotheses) {
            const contradicting = this._findContradictingEvidence(hyp, evidenceList);

            if (contradicting.length === 0) continue;

            const severity = this._assessSeverity(hyp, contradicting);

            const raw = {
                type: 'CONTRADICTION',
                contradictionId: `CONT-${hyp.product}-${Date.now()}`,
                product: hyp.product,
                hypothesis: hyp.statement,
                supportingEvidence: hyp.supportingEvidence || [],
                contradictingEvidence: contradicting.map(e => e.evidenceId),
                status: 'CONFLICT',
                severity,
                resolution: severity === CONFLICT_SEVERITY.CRITICAL || severity === CONFLICT_SEVERITY.HIGH
                    ? 'HUMAN_REVIEW'
                    : 'RESEARCH_MORE',
                detectedAt: new Date().toISOString()
            };

            const vr = this.validator.validate(raw, 'CONTRADICTION', knownEvidenceIds);
            if (vr.valid) contradictions.push(vr.sanitized);
        }

        // 2. Lift structural conflicts from ConflictResolver into contradiction reports
        for (const conflict of existingConflicts) {
            if (conflict.severity === CONFLICT_SEVERITY.CRITICAL || conflict.severity === CONFLICT_SEVERITY.HIGH) {
                const raw = {
                    type: 'CONTRADICTION',
                    contradictionId: `CONT-STRUCT-${conflict.domain}-${Date.now()}`,
                    product: conflict.domain,
                    hypothesis: `${conflict.domain.toUpperCase()} has consistent evidence`,
                    supportingEvidence: conflict.claims?.[0]?.supportedBy || [],
                    contradictingEvidence: conflict.claims?.[1]?.supportedBy || [],
                    status: 'CONFLICT',
                    severity: conflict.severity,
                    resolution: 'HUMAN_REVIEW',
                    detectedAt: new Date().toISOString()
                };
                const vr = this.validator.validate(raw, 'CONTRADICTION', knownEvidenceIds);
                if (vr.valid) contradictions.push(vr.sanitized);
            }
        }

        return contradictions;
    }

    /**
     * Determine if any contradiction should block the decision.
     */
    shouldBlockDecision(contradictions) {
        return contradictions.some(c =>
            c.severity === CONFLICT_SEVERITY.CRITICAL || c.severity === CONFLICT_SEVERITY.HIGH
        );
    }

    _findContradictingEvidence(hypothesis, evidenceList) {
        // Look for evidence that explicitly contradicts the hypothesis
        // e.g. hypothesis: "menu contains telur" → contradicting: "menu does not contain telur"

        const product = hypothesis.product;
        const negationMarkers = ['tidak', 'bukan', 'tidak jual', 'habis', 'sudah tidak', 'tidak ada', 'no longer', 'removed', 'sold out'];

        return evidenceList.filter(ev => {
            const val = (ev.normalizedValue || ev.value || '').toLowerCase();

            // Direct contradiction: same product mentioned with negation
            const mentionsProduct = val.includes(product) || val.includes(product.replace('_', ' '));
            const hasNegation = negationMarkers.some(marker => val.includes(marker));

            if (mentionsProduct && hasNegation) return true;

            // Category mismatch: hypothesis says food business, evidence says electronics
            if (product !== 'category' && ev.domain === 'category') {
                const nonFoodCategories = ['elektronik', 'jasa', 'pakaian', 'otomotif', 'electronic'];
                if (nonFoodCategories.some(c => val.includes(c))) return true;
            }

            return false;
        });
    }

    _assessSeverity(hypothesis, contradictingEvidence) {
        // High confidence hypothesis + direct evidence contradiction = HIGH
        if (hypothesis.confidence >= 0.7 && contradictingEvidence.some(e => e.directness === 'DIRECT')) {
            return CONFLICT_SEVERITY.HIGH;
        }
        if (contradictingEvidence.some(e => e.domain === 'identity')) {
            return CONFLICT_SEVERITY.CRITICAL;
        }
        if (contradictingEvidence.some(e => e.directness === 'DIRECT')) {
            return CONFLICT_SEVERITY.MEDIUM;
        }
        return CONFLICT_SEVERITY.LOW;
    }
}
