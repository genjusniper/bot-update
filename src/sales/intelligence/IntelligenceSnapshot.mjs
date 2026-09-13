/**
 * IntelligenceSnapshot.mjs
 *
 * Creates and diffs point-in-time intelligence snapshots for a lead.
 * Each snapshot records the state of all opportunities at a given moment.
 *
 * Use case:
 *   SNAPSHOT #001 (before research)  → SNAPSHOT #002 (after research)
 *   diff → WHAT CHANGED, WHY CHANGED, WHICH EVIDENCE CAUSED CHANGE
 *
 * PRINCIPLE:
 *   Snapshots are immutable once created.
 *   Diffs are computed lazily, not stored.
 */

let _snapCounter = 0; // monotonic counter for unique IDs within same ms

export class IntelligenceSnapshot {
    /**
     * Create a snapshot from the current state of a lead's intelligence.
     *
     * @param {string} leadId
     * @param {object[]} demandMatches - from SupplyDemandMatcher
     * @param {object} scoreResult - from OpportunityScorer
     * @param {object} qualityDecision - from LeadQualityFirewall
     * @param {object[]} evidenceList
     * @param {string} trigger - what triggered this snapshot (e.g. 'INITIAL', 'RESEARCH_ROUND_1')
     * @returns {object} snapshot (frozen)
     */
    create(leadId, demandMatches, scoreResult, qualityDecision, evidenceList, trigger = 'MANUAL') {
        const snap = {
            snapshotId: `SNAP-${leadId}-${Date.now()}-${++_snapCounter}`,
            leadId,
            trigger,
            takenAt: new Date().toISOString(),

            // Summary metrics
            evidenceCount: evidenceList.length,
            opportunityScore: scoreResult?.opportunityScore ?? 0,
            qualityGrade: qualityDecision?.qualityGrade ?? 'UNKNOWN',
            decision: qualityDecision?.decision ?? 'UNKNOWN',
            blockOutreach: qualityDecision?.blockOutreach ?? false,

            // Opportunity fingerprints
            opportunities: demandMatches.map(m => ({
                product: m.product,
                demandSignal: m.demandSignal,
                matchScore: m.matchScore,
                supplyStatus: m.supplyStatus,
                evidenceConfidence: m.evidenceConfidence,
                activeRecommendation: m.activeRecommendation
            })),

            // Primary opportunity
            primary: scoreResult?.primaryOpportunity ? {
                id: scoreResult.primaryOpportunity.id,
                fitScore: scoreResult.primaryOpportunity.fitScore,
                evidenceConfidence: scoreResult.primaryOpportunity.evidenceConfidence
            } : null,

            // Evidence domains covered
            evidenceDomains: [...new Set(evidenceList.map(e => e.domain))].sort(),

            // Conflict summary
            conflictCount: (qualityDecision?.conflicts || []).length,
            hasBlockingConflict: (qualityDecision?.conflicts || []).some(c => c.severity === 'CRITICAL')
        };

        Object.freeze(snap);
        return snap;
    }

    /**
     * Diff two snapshots to show evolution of intelligence.
     * @param {object} snapA - Earlier snapshot
     * @param {object} snapB - Later snapshot
     * @returns {object} diff report
     */
    diff(snapA, snapB) {
        const changes = [];

        // Score delta
        const scoreDelta = snapB.opportunityScore - snapA.opportunityScore;
        if (Math.abs(scoreDelta) > 0.01) {
            changes.push({
                type: 'OPPORTUNITY_SCORE_CHANGED',
                before: snapA.opportunityScore,
                after: snapB.opportunityScore,
                delta: parseFloat(scoreDelta.toFixed(4))
            });
        }

        // Quality grade change
        if (snapA.qualityGrade !== snapB.qualityGrade) {
            changes.push({
                type: 'QUALITY_GRADE_CHANGED',
                before: snapA.qualityGrade,
                after: snapB.qualityGrade
            });
        }

        // Decision change
        if (snapA.decision !== snapB.decision) {
            changes.push({
                type: 'DECISION_CHANGED',
                before: snapA.decision,
                after: snapB.decision
            });
        }

        // Evidence domain additions
        const newDomains = snapB.evidenceDomains.filter(d => !snapA.evidenceDomains.includes(d));
        if (newDomains.length > 0) {
            changes.push({ type: 'NEW_EVIDENCE_DOMAINS', domains: newDomains });
        }

        // Opportunity signal changes
        const mapA = new Map((snapA.opportunities || []).map(o => [o.product, o]));
        for (const oppB of (snapB.opportunities || [])) {
            const oppA = mapA.get(oppB.product);
            if (!oppA) {
                changes.push({ type: 'NEW_OPPORTUNITY', product: oppB.product });
            } else if (oppA.demandSignal !== oppB.demandSignal) {
                changes.push({
                    type: 'DEMAND_SIGNAL_UPGRADED',
                    product: oppB.product,
                    before: oppA.demandSignal,
                    after: oppB.demandSignal
                });
            } else if (Math.abs(oppA.matchScore - oppB.matchScore) > 0.01) {
                changes.push({
                    type: 'MATCH_SCORE_CHANGED',
                    product: oppB.product,
                    before: oppA.matchScore,
                    after: oppB.matchScore,
                    delta: parseFloat((oppB.matchScore - oppA.matchScore).toFixed(4))
                });
            }
        }

        // Conflict change
        if (snapA.conflictCount !== snapB.conflictCount) {
            changes.push({
                type: 'CONFLICT_COUNT_CHANGED',
                before: snapA.conflictCount,
                after: snapB.conflictCount
            });
        }

        return {
            from: snapA.snapshotId,
            to: snapB.snapshotId,
            fromTrigger: snapA.trigger,
            toTrigger: snapB.trigger,
            evidenceDelta: snapB.evidenceCount - snapA.evidenceCount,
            changes,
            summary: changes.length === 0
                ? 'NO_CHANGE'
                : changes.map(c => c.type).join(', ')
        };
    }

    /**
     * Render a snapshot for human review.
     */
    render(snap) {
        const lines = [
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            `INTELLIGENCE SNAPSHOT`,
            `ID: ${snap.snapshotId}`,
            `Trigger: ${snap.trigger} | Taken: ${snap.takenAt}`,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            `Evidence: ${snap.evidenceCount} items | Domains: ${snap.evidenceDomains.join(', ')}`,
            `Score: ${(snap.opportunityScore * 100).toFixed(0)}% | Grade: ${snap.qualityGrade} | Decision: ${snap.decision}`,
            `Conflicts: ${snap.conflictCount}${snap.hasBlockingConflict ? ' ⚠️ BLOCKING' : ''}`,
            ``,
            `TOP OPPORTUNITIES:`
        ];

        for (const [i, opp] of (snap.opportunities || []).slice(0, 3).entries()) {
            const medal = ['🥇', '🥈', '🥉'][i] || '  ';
            lines.push(`  ${medal} ${opp.product.toUpperCase()}`);
            lines.push(`     Signal: ${opp.demandSignal} | Supply: ${opp.supplyStatus} | Score: ${(opp.matchScore * 100).toFixed(0)}%`);
        }

        lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        return lines.join('\n');
    }
}
