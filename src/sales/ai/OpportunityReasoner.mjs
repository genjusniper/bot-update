/**
 * OpportunityReasoner.mjs
 *
 * Explains WHY the system recommends a product to a specific UMKM.
 *
 * The explanation must be traceable to evidence.
 * The explanation cannot introduce new claims not already in the evidence graph.
 *
 * OUTPUT:
 * {
 *   type: "EXPLANATION",
 *   product: "telur",
 *   decision: "HUMAN_REVIEW",
 *   reasoning: "Telur is recommended because...",
 *   evidenceChain: [...],
 *   missingData: [...],
 *   confidence: {
 *     sourceReliability: 0.85,
 *     evidenceConfidence: 0.90,
 *     decisionConfidence: 0.87
 *   }
 * }
 */

import { AIOutputValidator } from './AIOutputValidator.mjs';

export class OpportunityReasoner {
    constructor() {
        this.validator = new AIOutputValidator();
    }

    /**
     * Generate a human-readable explanation for a product opportunity.
     *
     * @param {object} match - from SupplyDemandMatcher
     * @param {object[]} evidenceList
     * @param {string[]} unknowns
     * @param {string} qualityDecision
     * @param {object} traceEntry - from DecisionTrace
     */
    explain(match, evidenceList, unknowns = [], qualityDecision = 'WATCHLIST', traceEntry = null) {
        if (!match.activeRecommendation) {
            return this._blockedExplanation(match, evidenceList);
        }

        const supportingEvidence = evidenceList.filter(e =>
            e.domain === 'menu' || e.domain === 'demand'
        );

        const avgSourceReliability = supportingEvidence.length > 0
            ? supportingEvidence.reduce((s, e) => s + (e.reliability ?? 0.5), 0) / supportingEvidence.length
            : 0;

        const avgEvConfidence = traceEntry?.confidence?.evidenceConfidence ?? match.evidenceConfidence ?? 0;
        const decisionConf = traceEntry?.confidence?.decisionConfidence ?? match.matchScore ?? 0;

        const reasoning = this._buildReasoning(match, supportingEvidence, unknowns);

        const raw = {
            type: 'EXPLANATION',
            product: match.product,
            decision: qualityDecision,
            reasoning,
            evidenceChain: supportingEvidence.map(e => ({
                evidenceId: e.evidenceId,
                domain: e.domain,
                value: e.normalizedValue ?? e.value,
                classification: e.classification,
                capturedAt: e.capturedAt
            })),
            missingData: unknowns.map(u => ({ field: u, impact: 'OPERATIONAL_DATA_UNKNOWN' })),
            confidence: {
                sourceReliability: parseFloat(avgSourceReliability.toFixed(4)),
                evidenceConfidence: parseFloat(avgEvConfidence.toFixed(4)),
                decisionConfidence: parseFloat(decisionConf.toFixed(4))
            },
            generatedAt: new Date().toISOString()
        };

        const knownIds = evidenceList.map(e => e.evidenceId);
        const vr = this.validator.validate(raw, 'EXPLANATION', knownIds);
        return vr.valid ? vr.sanitized : {
            type: 'EXPLANATION_FAILED',
            product: match.product,
            reason: vr.reason
        };
    }

    _buildReasoning(match, evidenceList, unknowns) {
        const parts = [];

        if (match.demandSignal === 'DIRECT') {
            parts.push(`Direct evidence shows this business uses ${match.product.replace('_', ' ')}.`);
        } else if (match.demandSignal === 'STRONG_INFERENCE') {
            parts.push(`Menu items strongly suggest demand for ${match.product.replace('_', ' ')}.`);
        } else if (match.demandSignal === 'MODERATE_INFERENCE') {
            parts.push(`Business description suggests possible demand for ${match.product.replace('_', ' ')}.`);
        } else {
            parts.push(`Business category implies potential demand for ${match.product.replace('_', ' ')}, but evidence is weak.`);
        }

        if (match.supplyStatus === 'AVAILABLE') {
            parts.push(`Supply is currently available.`);
        }

        if (evidenceList.length > 0) {
            parts.push(`Supported by ${evidenceList.length} evidence item(s).`);
        }

        if (unknowns.length > 0) {
            parts.push(`Unknown: ${unknowns.slice(0, 3).join(', ')} — cannot be inferred without direct survey.`);
        }

        return parts.join(' ');
    }

    _blockedExplanation(match, evidenceList) {
        return {
            type: 'EXPLANATION',
            product: match.product,
            decision: 'BLOCKED',
            reasoning: `${match.product.toUpperCase()} is currently OUT_OF_STOCK and cannot be actively recommended.`,
            evidenceChain: [],
            missingData: [],
            confidence: { sourceReliability: 0, evidenceConfidence: 0, decisionConfidence: 0 },
            generatedAt: new Date().toISOString()
        };
    }
}
