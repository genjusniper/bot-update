/**
 * ResearchPlanner.mjs
 *
 * Decision-aware research planner.
 * Does NOT research blindly. Only plans research when it could change a decision.
 *
 * Budget:
 *   MAX_FIELDS_PER_RESEARCH = 3
 *   MAX_SOURCES_PER_FIELD   = 3
 *   MAX_RESEARCH_ATTEMPTS   = 2
 *   MAX_LEADS_PER_RUN       = 10
 *
 * PRINCIPLE:
 *   If current evidence is already sufficient for HUMAN_REVIEW, do NOT research.
 *   Research is triggered only by RESEARCH_MORE, not by curiosity.
 */

import { ResearchValueEstimator } from './ResearchValueEstimator.mjs';

export const RESEARCH_BUDGET = {
    MAX_FIELDS_PER_RESEARCH:  3,
    MAX_SOURCES_PER_FIELD:    3,
    MAX_RESEARCH_ATTEMPTS:    2,
    MAX_LEADS_PER_RUN:       10
};

export class ResearchPlanner {
    constructor(budget = {}) {
        this.budget = { ...RESEARCH_BUDGET, ...budget };
        this.estimator = new ResearchValueEstimator();
    }

    /**
     * Produce a research plan for a lead.
     *
     * @param {object} lead
     * @param {string[]} unknowns - Fields that are unknown
     * @param {number} opportunityScore
     * @param {string} currentDecision
     * @param {object[]} existingConflicts
     * @returns {{ shouldResearch: boolean, targets: ResearchTarget[], reason: string }}
     */
    plan(lead, unknowns, opportunityScore, currentDecision, existingConflicts = []) {
        // Hard check: if we've exhausted research attempts, never plan more
        const researchAttempts = lead.researchAttempts || 0;
        if (researchAttempts >= this.budget.MAX_RESEARCH_ATTEMPTS) {
            return {
                shouldResearch: false,
                targets: [],
                reason: `RESEARCH_EXHAUSTED: maxAttempts=${this.budget.MAX_RESEARCH_ATTEMPTS} reached`,
                fallback: 'WATCHLIST'
            };
        }

        // If current decision is already HUMAN_REVIEW with high confidence, skip research
        if (currentDecision === 'HUMAN_REVIEW' && opportunityScore >= 0.65) {
            return {
                shouldResearch: false,
                targets: [],
                reason: 'ALREADY_ACTIONABLE: Current evidence sufficient for HUMAN_REVIEW',
                fallback: 'HUMAN_REVIEW'
            };
        }

        // Prioritize conflict resolution first
        const conflictTargets = this._planConflictResearch(existingConflicts);

        // Estimate research value for unknowns
        const estimates = this.estimator.estimate(unknowns, opportunityScore, currentDecision);
        const valuableFields = estimates.filter(e => e.shouldResearch);

        // Combine: conflict targets first, then valuable fields
        const allTargets = [...conflictTargets, ...valuableFields];

        if (allTargets.length === 0) {
            return {
                shouldResearch: false,
                targets: [],
                reason: 'NO_VALUABLE_TARGETS: All unknowns are non-publicly-verifiable or low-value',
                fallback: 'WATCHLIST'
            };
        }

        // Apply budget cap
        const selected = allTargets.slice(0, this.budget.MAX_FIELDS_PER_RESEARCH);

        return {
            shouldResearch: true,
            targets: selected.map(t => ({
                field: t.field || t.targetField,
                priority: t.priority,
                reason: t.reason,
                maxSources: this.budget.MAX_SOURCES_PER_FIELD,
                researchHint: this._generateHint(lead, t.field || t.targetField)
            })),
            reason: `RESEARCH_PLANNED: ${selected.length} target(s) identified`,
            attemptNumber: researchAttempts + 1
        };
    }

    /**
     * Check if research is still allowed for a lead.
     */
    canResearch(lead) {
        return (lead.researchAttempts || 0) < this.budget.MAX_RESEARCH_ATTEMPTS;
    }

    _planConflictResearch(conflicts) {
        return conflicts
            .filter(c => c.status === 'UNRESOLVED' || c.status === 'REQUIRES_RESEARCH')
            .filter(c => c.severity !== 'CRITICAL') // CRITICAL needs human, not more research
            .map(c => ({
                field: c.domain,
                priority: c.severity === 'HIGH' ? 0.95 : c.severity === 'MEDIUM' ? 0.80 : 0.50,
                reason: `CONFLICT_RESOLUTION: ${c.severity} conflict in ${c.domain}`,
                isConflictResearch: true
            }));
    }

    _generateHint(lead, field) {
        const hints = {
            menu: `Search public menu for "${lead.businessName}" in ${lead.location || 'area'}`,
            contact: `Look up business contact for "${lead.businessName}"`,
            category: `Verify business category for "${lead.businessName}"`,
            description: `Find business description for "${lead.businessName}"`,
            location: `Confirm address for "${lead.businessName}"`,
            business_hours: `Check operating hours for "${lead.businessName}"`,
            social_media: `Search Instagram/FB for "${lead.businessName}"`
        };
        return hints[field] || `Research "${field}" for "${lead.businessName}"`;
    }
}
