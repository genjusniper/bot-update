/**
 * ResearchLoop.mjs
 *
 * Orchestrates the full Evidence Research Loop for a RESEARCH_MORE lead.
 *
 * PIPELINE:
 *   RESEARCH_MORE
 *     ↓
 *   ResearchPlanner.plan()          → decide WHAT to research
 *     ↓
 *   ResearchProvider.search()       → fetch raw evidence
 *     ↓
 *   EvidenceIntakeContract.intake() → validate + normalize + fingerprint
 *     ↓
 *   EvidenceGraph.append()          → dedup + append + re-derive claims
 *     ↓
 *   ConflictResolver.detect()       → check for new conflicts
 *     ↓
 *   BusinessDemandEngine.inferDemand() → re-score demand
 *     ↓
 *   SupplyDemandMatcher.match()     → re-match
 *     ↓
 *   OpportunityScorer.score()       → new opportunity score
 *     ↓
 *   LeadQualityFirewall.gradeQuality() → new quality decision
 *     ↓
 *   IntelligenceSnapshot.create()   → snapshot AFTER research
 *     ↓
 *   HUMAN_REVIEW or RESEARCH_MORE (if budget remains)
 *
 * INVARIANT: OUTBOUND = 0.
 *            Research loop NEVER triggers outbound.
 *            Only HUMAN_REVIEW → Approval → SalesGuard → Queue → DRY_RUN triggers outbound.
 */

import { ResearchPlanner } from './ResearchPlanner.mjs';
import { ResearchProvider } from './ResearchProvider.mjs';
import { EvidenceIntakeContract } from './EvidenceIntakeContract.mjs';
import { EvidenceGraph } from './EvidenceGraph.mjs';
import { ConflictResolver } from './ConflictResolver.mjs';
import { BusinessDemandEngine } from '../strategy/BusinessDemandEngine.mjs';
import { MotherSupplyCatalog } from '../strategy/MotherSupplyCatalog.mjs';
import { SupplyDemandMatcher } from '../strategy/SupplyDemandMatcher.mjs';
import { OpportunityScorer } from '../strategy/OpportunityScorer.mjs';
import { LeadQualityFirewall } from '../guard/LeadQualityFirewall.mjs';
import { IntelligenceSnapshot } from '../intelligence/IntelligenceSnapshot.mjs';

export class ResearchLoop {
    constructor(options = {}) {
        this.planner = new ResearchPlanner(options.budget || {});
        this.provider = options.provider || new ResearchProvider();
        this.intake = new EvidenceIntakeContract();
        this.graph = new EvidenceGraph(options.evidenceDir);
        this.conflictResolver = new ConflictResolver();
        this.demandEngine = new BusinessDemandEngine();
        this.catalog = new MotherSupplyCatalog();
        this.matcher = new SupplyDemandMatcher();
        this.scorer = new OpportunityScorer();
        this.firewall = new LeadQualityFirewall();
        this.snapshotter = new IntelligenceSnapshot();
    }

    /**
     * Execute one research round for a lead.
     *
     * @param {object} lead - The lead object (must have researchAttempts)
     * @param {string} currentDecision - Current decision from Quality Firewall
     * @param {number} currentScore - Current opportunity score
     * @param {object[]} currentConflicts - Current conflicts from firewall
     * @param {string[]} unknowns - Current unknowns
     * @returns {object} ResearchResult
     */
    async execute(lead, currentDecision, currentScore, currentConflicts = [], unknowns = []) {
        const leadId = lead.id || lead.leadId;
        const attemptNumber = (lead.researchAttempts || 0) + 1;

        console.log(`\n🔬 [ResearchLoop] Round ${attemptNumber} for ${lead.businessName}`);

        // 1. Snapshot BEFORE research
        const existingEvidence = this.graph.getEvidence(leadId);
        const priorMatches = this.matcher.match(
            this.demandEngine.inferDemand(lead, existingEvidence).demandProfile,
            this.catalog
        );
        const priorScore = this.scorer.score(priorMatches, unknowns);
        const priorQuality = this.firewall.gradeQuality(lead, existingEvidence, priorScore.opportunityScore);

        const snapBefore = this.snapshotter.create(
            leadId, priorMatches, priorScore, priorQuality, existingEvidence,
            `BEFORE_RESEARCH_ROUND_${attemptNumber}`
        );

        // 2. Plan research
        const plan = this.planner.plan(
            lead, unknowns, currentScore, currentDecision, currentConflicts
        );

        if (!plan.shouldResearch) {
            return this._buildResult(lead, 'PLAN_SKIPPED', plan.reason, snapBefore, null, priorScore, priorQuality);
        }

        console.log(`   [Plan] Targets: ${plan.targets.map(t => t.field).join(', ')}`);

        // 3. Execute research for each planned target
        const newEvidenceList = [];
        const providerErrors = [];
        let realBaileysCalls = 0; // Must remain 0

        for (const target of plan.targets) {
            try {
                const rawResults = await this.provider.search(
                    leadId, target.field, { businessName: lead.businessName, location: lead.location }
                );

                let sourceCount = 0;
                for (const raw of rawResults) {
                    if (sourceCount >= target.maxSources) break;

                    // 4. Intake and validate
                    raw.evidenceId = raw.evidenceId || `EV-${leadId}-${target.field}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                    const intakeResult = this.intake.intake(raw, leadId);

                    if (!intakeResult.ok) {
                        console.log(`   [Intake] Rejected: ${intakeResult.reason}`);
                        continue;
                    }

                    // 5. Append to graph (dedup by fingerprint)
                    const appendResult = this.graph.append(leadId, intakeResult.evidence);

                    if (!appendResult.appended) {
                        console.log(`   [Graph] Deduplicated: ${appendResult.reason}`);
                        continue;
                    }

                    console.log(`   [Graph] Appended: ${intakeResult.evidence.evidenceId} (${target.field})`);
                    newEvidenceList.push(intakeResult.evidence);
                    sourceCount++;
                }

            } catch (e) {
                providerErrors.push({ field: target.field, error: e.message });
                console.warn(`   [Provider] Error on field "${target.field}": ${e.message}`);
            }
        }

        // 6. Get updated evidence and re-score
        const updatedEvidence = this.graph.getEvidence(leadId);
        const updatedDemand = this.demandEngine.inferDemand(lead, updatedEvidence);
        const updatedMatches = this.matcher.match(updatedDemand.demandProfile, this.catalog);
        const updatedScore = this.scorer.score(updatedMatches, updatedDemand.unknowns);

        // 7. Re-run conflict detection
        const { conflicts: updatedConflicts, blockOutreach } = this.conflictResolver.detect(updatedEvidence);

        // 8. Re-run Quality Firewall
        const updatedLead = {
            ...lead,
            researchAttempts: attemptNumber,
            evidenceList: updatedEvidence
        };
        const updatedQuality = this.firewall.gradeQuality(
            updatedLead, updatedEvidence, updatedScore.opportunityScore
        );

        // 9. Snapshot AFTER research
        const snapAfter = this.snapshotter.create(
            leadId, updatedMatches, updatedScore, updatedQuality, updatedEvidence,
            `AFTER_RESEARCH_ROUND_${attemptNumber}`
        );

        // 10. Compute diff
        const diff = this.snapshotter.diff(snapBefore, snapAfter);

        const decision = updatedQuality.decision;
        console.log(`   [Result] Score: ${updatedScore.opportunityScore.toFixed(2)} | Decision: ${decision} | New evidence: ${newEvidenceList.length}`);

        return {
            leadId,
            attemptNumber,
            status: 'COMPLETED',
            providerErrors,
            newEvidenceCount: newEvidenceList.length,
            updatedEvidence,
            updatedDemandProfile: updatedDemand.demandProfile,
            updatedMatches,
            updatedScore: updatedScore.opportunityScore,
            updatedPrimaryOpportunity: updatedScore.primaryOpportunity,
            updatedSecondaryOpportunities: updatedScore.secondaryOpportunities,
            updatedConflicts,
            blockOutreach,
            updatedQuality,
            updatedDecision: decision,
            snapBefore,
            snapAfter,
            diff,
            realBaileysCalls,  // INVARIANT: Must always be 0
            canResearchMore: this.planner.canResearch(updatedLead)
        };
    }

    _buildResult(lead, status, reason, snapBefore, snapAfter, score, quality) {
        return {
            leadId: lead.id || lead.leadId,
            attemptNumber: lead.researchAttempts || 0,
            status,
            reason,
            snapBefore,
            snapAfter,
            updatedScore: score?.opportunityScore ?? 0,
            updatedDecision: quality?.decision ?? 'WATCHLIST',
            realBaileysCalls: 0
        };
    }
}
