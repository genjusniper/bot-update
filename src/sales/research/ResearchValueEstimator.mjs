/**
 * ResearchValueEstimator.mjs
 *
 * Calculates the research value (ROI) for each unknown field.
 *
 * Formula:
 *   researchPriority = decisionImpact × uncertainty × expectedDecisionChange
 *
 * All values: 0..1
 *
 * Fields that are NOT publicly verifiable are excluded automatically.
 *
 * RULE: Do NOT research fields just because they are unknown.
 *       Only research if learning the field could change a decision.
 */

// Impact of each field on the final decision
const FIELD_IMPACT = {
    menu:             { decisionImpact: 0.95, publicly_verifiable: true  },
    contact:          { decisionImpact: 0.90, publicly_verifiable: true  },
    volume:           { decisionImpact: 0.80, publicly_verifiable: false }, // Private operational data
    frequency:        { decisionImpact: 0.75, publicly_verifiable: false }, // Private
    category:         { decisionImpact: 0.70, publicly_verifiable: true  },
    business_hours:   { decisionImpact: 0.50, publicly_verifiable: true  },
    location:         { decisionImpact: 0.45, publicly_verifiable: true  },
    current_supplier: { decisionImpact: 0.40, publicly_verifiable: false }, // Private
    price_point:      { decisionImpact: 0.35, publicly_verifiable: false }, // Private
    description:      { decisionImpact: 0.30, publicly_verifiable: true  },
    social_media:     { decisionImpact: 0.25, publicly_verifiable: true  },
    website:          { decisionImpact: 0.20, publicly_verifiable: true  },
    distance:         { decisionImpact: 0.15, publicly_verifiable: true  }
};

export class ResearchValueEstimator {
    /**
     * Estimate research priority for each unknown field.
     *
     * @param {string[]} unknowns - Fields that are unknown
     * @param {number} currentOpportunityScore - Current opportunity score (0..1)
     * @param {string} currentDecision - Current decision (RESEARCH_MORE, WATCHLIST, etc.)
     * @returns {object[]} Sorted list of { field, priority, reason, shouldResearch }
     */
    estimate(unknowns, currentOpportunityScore = 0, currentDecision = 'WATCHLIST') {
        const estimates = [];

        for (const field of unknowns) {
            const fieldKey = field.toLowerCase().replace(/[^a-z_]/g, '_');
            const impact = FIELD_IMPACT[fieldKey];

            if (!impact) {
                estimates.push({
                    field,
                    priority: 0,
                    reason: 'UNKNOWN_FIELD: Impact not defined',
                    shouldResearch: false,
                    skippedReason: 'Field not in impact table'
                });
                continue;
            }

            if (!impact.publicly_verifiable) {
                estimates.push({
                    field,
                    priority: 0,
                    reason: 'NOT_PUBLICLY_VERIFIABLE: Cannot be found without direct survey',
                    shouldResearch: false,
                    skippedReason: 'Private operational data — skip for now'
                });
                continue;
            }

            // Uncertainty = how much we don't know (1.0 = completely unknown)
            const uncertainty = 1.0; // By definition, it's in the unknowns list

            // Expected decision change: how much could learning this flip the decision?
            // High-impact fields near the decision boundary change more
            const decisionBoundaryProximity = this._decisionBoundaryProximity(
                currentOpportunityScore, currentDecision
            );

            const priority = impact.decisionImpact * uncertainty * decisionBoundaryProximity;

            estimates.push({
                field,
                priority: parseFloat(priority.toFixed(4)),
                decisionImpact: impact.decisionImpact,
                expectedDecisionChange: decisionBoundaryProximity,
                reason: priority > 0.5 ? 'HIGH_VALUE → RESEARCH' :
                        priority > 0.25 ? 'MEDIUM_VALUE → CONSIDER' : 'LOW_VALUE → DEFER',
                shouldResearch: priority > 0.25 && impact.publicly_verifiable
            });
        }

        // Sort by priority descending
        estimates.sort((a, b) => b.priority - a.priority);
        return estimates;
    }

    /**
     * How close is the current state to a decision boundary?
     * Scores near 0.5 are at the boundary (could swing either way).
     * Scores near 0 or 1 are already decided.
     */
    _decisionBoundaryProximity(score, decision) {
        if (decision === 'HUMAN_REVIEW') return 0.3; // Already decided — marginal value
        if (decision === 'WATCHLIST') return 0.9;    // Far from decision — high value to research
        if (decision === 'RESEARCH_MORE') return 0.8; // Explicitly needs research
        return 0.5;
    }
}
