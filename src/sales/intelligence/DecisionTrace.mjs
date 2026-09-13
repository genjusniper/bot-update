/**
 * DecisionTrace.mjs
 *
 * Generates a full, auditable reasoning chain for each product opportunity.
 *
 * OUTPUT:
 *   DECISION TRACE
 *   TELUR
 *   ├── Demand: DIRECT_MENU [E001, E004]
 *   ├── Supply: AVAILABLE
 *   ├── Evidence: FRESH
 *   ├── Conflict: NONE
 *   └── Final
 *       ├── Fit = 0.84
 *       ├── EvidenceConfidence = 0.90
 *       ├── DecisionConfidence = 0.88
 *       └── Decision = HUMAN_REVIEW
 *
 * PRINCIPLE:
 *   The system must be able to answer "Why did you recommend telur to this warung?"
 *   with a traceable, evidence-backed answer.
 */

export class DecisionTrace {
    /**
     * Build decision trace for all opportunities of a lead.
     *
     * @param {object} lead - The lead object
     * @param {object[]} demandMatches - Output from SupplyDemandMatcher
     * @param {Map|object} claims - Output from ClaimEngine (or EvidenceGraph.getClaims)
     * @param {object[]} evidenceList - All evidence for this lead
     * @param {object} qualityDecision - Output from LeadQualityFirewall
     * @returns {object[]} Array of DecisionTrace objects, one per match
     */
    build(lead, demandMatches, claims, evidenceList, qualityDecision) {
        const traces = [];
        const claimsObj = claims instanceof Map ? Object.fromEntries(claims) : (claims || {});

        for (const match of demandMatches) {
            // Find supporting claims for this product
            const relevantClaims = Object.values(claimsObj).filter(c =>
                c.domain === 'menu' || c.domain === 'demand'
            );

            const supportingEvidenceIds = [
                ...new Set(relevantClaims.flatMap(c => c.supportingEvidence || []))
            ];

            const supportingEvidence = evidenceList.filter(e =>
                supportingEvidenceIds.includes(e.evidenceId)
            );

            const conflicts = (qualityDecision?.conflicts || []).filter(c =>
                c.domain === 'menu' || c.domain === 'demand'
            );

            // Compute aggregate evidence confidence for this product
            const avgEvidenceConf = supportingEvidence.length > 0
                ? supportingEvidence.reduce((sum, e) => sum + (e.evidenceConfidence ?? e.reliability ?? 0.5), 0) / supportingEvidence.length
                : 0;

            // Three-layer confidence summary
            const sourceReliabilities = supportingEvidence.map(e => e.reliability ?? 0.5);
            const avgSourceReliability = sourceReliabilities.length > 0
                ? sourceReliabilities.reduce((a, b) => a + b, 0) / sourceReliabilities.length
                : 0;

            const decisionConfidence = match.matchScore > 0
                ? match.matchScore * (1 - (conflicts.length > 0 ? 0.2 : 0))
                : 0;

            const trace = {
                product: match.product,
                demandSignal: match.demandSignal,
                supplyStatus: match.supplyStatus,
                matchScore: match.matchScore,
                activeRecommendation: match.activeRecommendation,

                // Confidence layers
                confidence: {
                    sourceReliability: parseFloat(avgSourceReliability.toFixed(4)),
                    evidenceConfidence: parseFloat(avgEvidenceConf.toFixed(4)),
                    decisionConfidence: parseFloat(decisionConfidence.toFixed(4))
                },

                // Evidence chain
                supportingEvidence: supportingEvidence.map(e => ({
                    evidenceId: e.evidenceId,
                    domain: e.domain,
                    classification: e.classification,
                    sourceType: e.sourceType,
                    capturedAt: e.capturedAt,
                    value: e.normalizedValue ?? e.value,
                    evidenceConfidence: parseFloat((e.evidenceConfidence ?? e.reliability ?? 0).toFixed(4))
                })),

                // Conflict summary
                conflicts: conflicts.map(c => ({
                    domain: c.domain,
                    severity: c.severity,
                    status: c.status
                })),

                // Final decision
                finalDecision: this._resolveDecision(match, qualityDecision, decisionConfidence),

                tracedAt: new Date().toISOString()
            };

            traces.push(trace);
        }

        return traces;
    }

    /**
     * Render a human-readable decision trace string.
     */
    render(trace) {
        const conflictStr = trace.conflicts.length > 0
            ? trace.conflicts.map(c => `${c.severity}(${c.domain})`).join(', ')
            : 'NONE';

        const evLines = trace.supportingEvidence.map(e =>
            `│   ├── ${e.evidenceId} [${e.classification}/${e.sourceType}] conf=${e.evidenceConfidence}`
        ).join('\n');

        return [
            `${trace.product.toUpperCase()} (${trace.activeRecommendation ? '✅ ACTIVE' : '⛔ INACTIVE'})`,
            `├── Demand    : ${trace.demandSignal}`,
            `├── Supply    : ${trace.supplyStatus}`,
            `├── Match     : ${(trace.matchScore * 100).toFixed(0)}%`,
            `├── Evidence  :`,
            evLines || '│   └── (no supporting evidence)',
            `├── Conflict  : ${conflictStr}`,
            `├── Confidence:`,
            `│   ├── Source    = ${(trace.confidence.sourceReliability * 100).toFixed(0)}%`,
            `│   ├── Evidence  = ${(trace.confidence.evidenceConfidence * 100).toFixed(0)}%`,
            `│   └── Decision  = ${(trace.confidence.decisionConfidence * 100).toFixed(0)}%`,
            `└── Decision  : ${trace.finalDecision}`
        ].join('\n');
    }

    _resolveDecision(match, qualityDecision, decisionConfidence) {
        if (!match.activeRecommendation) return 'BLOCKED_OOS';
        if (qualityDecision?.decision === 'REJECTED') return 'REJECTED';
        if (qualityDecision?.decision === 'RESEARCH_MORE') return 'RESEARCH_MORE';
        if (decisionConfidence >= 0.6) return 'HUMAN_REVIEW';
        if (decisionConfidence >= 0.3) return 'RESEARCH_MORE';
        return 'WATCHLIST';
    }
}
