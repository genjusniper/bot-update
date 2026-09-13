/**
 * LeadPriorityRanker.mjs
 *
 * Answers: "From 50 leads this week, which 10 should be reviewed first?"
 *
 * PRIORITY FORMULA:
 *   priority = opportunityScore
 *            × evidenceQualityScore
 *            × freshnessScore
 *            × (1 - conflictPenalty)
 *            × researchCompletenessScore
 *
 * OUTPUT:
 *   Lead[] sorted descending by priority score, with explanation.
 *
 * INVARIANTS:
 *   - Priority score does NOT trigger outbound
 *   - Priority is a RANKING tool, not an approval tool
 *   - High priority → review first, not approve automatically
 */

import { EvidenceDecayEngine } from '../research/EvidenceDecayEngine.mjs';

const DOMAIN_WEIGHTS = {
    identity:       1.0,
    menu:           0.95,
    contact:        0.90,
    category:       0.80,
    description:    0.60,
    location:       0.40
};

const CONFLICT_PENALTIES = {
    CRITICAL: 0.50,
    HIGH:     0.30,
    MEDIUM:   0.15,
    LOW:      0.05
};

export class LeadPriorityRanker {
    constructor() {
        this.decay = new EvidenceDecayEngine();
    }

    /**
     * Rank an array of leads by priority.
     *
     * @param {object[]} rankedLeads - Each must have: lead, opportunityScore, evidenceList, conflicts
     * @returns {object[]} sorted descending by priorityScore, with breakdown
     */
    rank(rankedLeads) {
        const scored = rankedLeads.map(item => {
            const breakdown = this._computeBreakdown(item);
            return {
                ...item,
                priorityScore: breakdown.priorityScore,
                priorityBreakdown: breakdown
            };
        });

        return scored.sort((a, b) => b.priorityScore - a.priorityScore);
    }

    _computeBreakdown({ lead, opportunityScore = 0, evidenceList = [], conflicts = [] }) {
        // 1. Opportunity score (already 0..1)
        const oScore = Math.max(0, Math.min(1, opportunityScore));

        // 2. Evidence quality = weighted avg of evidenceConfidence per domain
        const evidenceQuality = this._evidenceQuality(evidenceList);

        // 3. Freshness = avg freshness multiplier across all evidence
        const freshnessScore = this._freshnessScore(evidenceList);

        // 4. Conflict penalty = worst conflict severity
        const conflictPenalty = this._conflictPenalty(conflicts);

        // 5. Research completeness = % of important domains covered
        const researchCompleteness = this._researchCompleteness(evidenceList);

        const priorityScore = oScore
            * evidenceQuality
            * freshnessScore
            * (1 - conflictPenalty)
            * researchCompleteness;

        return {
            priorityScore: parseFloat(priorityScore.toFixed(4)),
            opportunityScore: oScore,
            evidenceQuality: parseFloat(evidenceQuality.toFixed(4)),
            freshnessScore: parseFloat(freshnessScore.toFixed(4)),
            conflictPenalty: parseFloat(conflictPenalty.toFixed(4)),
            researchCompleteness: parseFloat(researchCompleteness.toFixed(4)),
            evidenceCount: evidenceList.length,
            conflictCount: conflicts.length
        };
    }

    _evidenceQuality(evidenceList) {
        if (!evidenceList.length) return 0.1;
        const total = evidenceList.reduce((sum, e) => {
            const w = DOMAIN_WEIGHTS[e.domain] ?? 0.5;
            const conf = e.evidenceConfidence ?? e.reliability ?? 0.5;
            return sum + (w * conf);
        }, 0);
        return Math.min(1, total / evidenceList.length);
    }

    _freshnessScore(evidenceList) {
        if (!evidenceList.length) return 0.3;
        const total = evidenceList.reduce((sum, e) => {
            const r = this.decay.evaluate(e);
            return sum + r.freshnessMultiplier;
        }, 0);
        return total / evidenceList.length;
    }

    _conflictPenalty(conflicts) {
        if (!conflicts.length) return 0;
        const worst = conflicts.reduce((max, c) => {
            const p = CONFLICT_PENALTIES[c.severity] ?? 0;
            return Math.max(max, p);
        }, 0);
        return worst;
    }

    _researchCompleteness(evidenceList) {
        const importantDomains = ['identity', 'menu', 'contact', 'category'];
        const covered = importantDomains.filter(d =>
            evidenceList.some(e => e.domain === d)
        );
        return covered.length / importantDomains.length;
    }

    /**
     * Print a ranked table to console.
     */
    print(rankedLeads) {
        console.log('\n╔══════════════════════════════════════════════════════════╗');
        console.log('║              LEAD PRIORITY RANKING                       ║');
        console.log('╠══════╦══════════════════════════╦═════════╦══════════════╣');
        console.log('║ RANK ║ BUSINESS                 ║ PRIORITY║ DECISION     ║');
        console.log('╠══════╬══════════════════════════╬═════════╬══════════════╣');
        rankedLeads.forEach((item, i) => {
            const rank = `#${i + 1}`.padEnd(4);
            const name = (item.lead?.businessName || 'Unknown').substring(0, 24).padEnd(24);
            const score = (item.priorityScore * 100).toFixed(0).padStart(7) + '%';
            const decision = (item.qualityDecision?.decision || 'UNKNOWN').padEnd(12);
            console.log(`║ ${rank} ║ ${name} ║${score} ║ ${decision} ║`);
        });
        console.log('╚══════╩══════════════════════════╩═════════╩══════════════╝\n');
    }
}
