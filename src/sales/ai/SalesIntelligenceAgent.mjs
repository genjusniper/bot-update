/**
 * SalesIntelligenceAgent.mjs
 *
 * Orchestrates the AI reasoning loop.
 *
 * AUTHORITY MODEL — AI CAN:
 *   - reason, hypothesize, plan research, identify unknowns
 *   - detect contradictions, discover patterns, explain decisions
 *
 * AUTHORITY MODEL — AI CANNOT:
 *   - create unsupported FACT
 *   - mutate evidence
 *   - bypass QualityFirewall
 *   - approve outreach / send WhatsApp
 *   - modify SalesGuard policy
 *   - invent quantities, prices, suppliers, transaction frequency
 *
 * FLOW:
 *   OBSERVE → REASON → FORM_HYPOTHESIS → IDENTIFY_UNKNOWN
 *   → PLAN_RESEARCH → EXECUTE_RESEARCH → VALIDATE_EVIDENCE
 *   → CLASSIFY → CONTRADICTION_CHECK → APPEND_EVIDENCE
 *   → RE-SCORE → QUALITY_FIREWALL → EXPLAIN
 *   → STOP | RESEARCH_MORE | HUMAN_REVIEW
 *
 * INVARIANT: OUTBOUND_CALL_COUNT = 0
 *
 * TERMINATION GUARANTEE:
 *   MAX_RESEARCH_ATTEMPTS = 2
 *   MAX_SOURCES_PER_FIELD = 3
 *   MAX_FIELDS_PER_RESEARCH = 3
 *   MAX_LEADS_PER_RUN = 10
 *   MAX_TOTAL_EVIDENCE_PER_LEAD = 30
 *
 *   Final states: RESEARCH_COMPLETE | RESEARCH_EXHAUSTED | RESEARCH_BLOCKED | HUMAN_REVIEW | NO_ACTION
 */

import { HypothesisEngine } from './HypothesisEngine.mjs';
import { ContradictionHunter } from './ContradictionHunter.mjs';
import { OpportunityReasoner } from './OpportunityReasoner.mjs';
import { PatternDiscoveryEngine } from './PatternDiscoveryEngine.mjs';
import { DecisionTraceBuilder } from './DecisionTraceBuilder.mjs';
import { AIOutputValidator } from './AIOutputValidator.mjs';
import { ResearchLoop } from '../research/ResearchLoop.mjs';
import { EvidenceGraph } from '../research/EvidenceGraph.mjs';
import { BusinessDemandEngine } from '../strategy/BusinessDemandEngine.mjs';
import { MotherSupplyCatalog } from '../strategy/MotherSupplyCatalog.mjs';
import { SupplyDemandMatcher } from '../strategy/SupplyDemandMatcher.mjs';
import { OpportunityScorer } from '../strategy/OpportunityScorer.mjs';
import { LeadQualityFirewall } from '../guard/LeadQualityFirewall.mjs';
import { IntelligenceSnapshot } from '../intelligence/IntelligenceSnapshot.mjs';
import { DecisionTrace } from '../intelligence/DecisionTrace.mjs';

const MAX_TOTAL_EVIDENCE = 30;
const MAX_RESEARCH_ATTEMPTS = 2;

export const AGENT_STATE = {
    OBSERVE:              'OBSERVE',
    REASON:               'REASON',
    FORM_HYPOTHESIS:      'FORM_HYPOTHESIS',
    IDENTIFY_UNKNOWN:     'IDENTIFY_UNKNOWN',
    PLAN_RESEARCH:        'PLAN_RESEARCH',
    EXECUTE_RESEARCH:     'EXECUTE_RESEARCH',
    VALIDATE_EVIDENCE:    'VALIDATE_EVIDENCE',
    CLASSIFY:             'CLASSIFY',
    CONTRADICTION_CHECK:  'CONTRADICTION_CHECK',
    APPEND_EVIDENCE:      'APPEND_EVIDENCE',
    RESCORE:              'RESCORE',
    QUALITY_FIREWALL:     'QUALITY_FIREWALL',
    EXPLAIN:              'EXPLAIN',
    STOP:                 'STOP',
    HUMAN_REVIEW:         'HUMAN_REVIEW',
    RESEARCH_MORE:        'RESEARCH_MORE'
};

export const FINAL_STATE = {
    RESEARCH_COMPLETE:  'RESEARCH_COMPLETE',
    RESEARCH_EXHAUSTED: 'RESEARCH_EXHAUSTED',
    RESEARCH_BLOCKED:   'RESEARCH_BLOCKED',
    HUMAN_REVIEW:       'HUMAN_REVIEW',
    NO_ACTION:          'NO_ACTION'
};

export class SalesIntelligenceAgent {
    constructor(options = {}) {
        this.hypothesisEngine = new HypothesisEngine();
        this.contradictionHunter = new ContradictionHunter();
        this.reasoner = new OpportunityReasoner();
        this.patternEngine = new PatternDiscoveryEngine();
        this.traceBuilder = new DecisionTraceBuilder(options.traceDir);
        this.validator = new AIOutputValidator();
        this.researchLoop = new ResearchLoop({
            evidenceDir: options.evidenceDir,
            provider: options.provider,
            budget: options.budget
        });
        this.evidenceGraph = new EvidenceGraph(options.evidenceDir);
        this.demandEngine = new BusinessDemandEngine();
        this.catalog = new MotherSupplyCatalog();
        this.matcher = new SupplyDemandMatcher();
        this.scorer = new OpportunityScorer();
        this.firewall = new LeadQualityFirewall();
        this.snapshotter = new IntelligenceSnapshot();
        this.decisionTrace = new DecisionTrace();

        this.realBaileysCalls = 0; // INVARIANT: must stay 0
    }

    /**
     * Run the full AI intelligence loop for a lead.
     *
     * @param {object} lead
     * @param {string} initialDecision - from initial Quality Firewall pass
     * @param {number} initialScore
     * @param {string[]} initialUnknowns
     * @returns {object} AgentResult
     */
    async run(lead, initialDecision, initialScore, initialUnknowns = []) {
        const leadId = lead.id || lead.leadId;
        const stateLog = [];
        let currentDecision = initialDecision;
        let currentScore = initialScore;
        let currentUnknowns = [...initialUnknowns];
        let hypotheses = [];
        let contradictions = [];
        let explanations = [];
        let researchResult = null;

        const log = (state, detail = '') => {
            stateLog.push({ state, detail, at: new Date().toISOString() });
            console.log(`   [Agent:${state}]${detail ? ' ' + detail : ''}`);
        };

        // ── OBSERVE ──────────────────────────────────────────────────────────
        log(AGENT_STATE.OBSERVE, `Lead=${lead.businessName} Decision=${currentDecision} Score=${currentScore.toFixed(2)}`);
        const evidenceList = this.evidenceGraph.getEvidence(leadId);

        // Termination: too much evidence (cap)
        if (evidenceList.length >= MAX_TOTAL_EVIDENCE) {
            log(AGENT_STATE.STOP, 'MAX_TOTAL_EVIDENCE reached');
            return this._buildResult(lead, FINAL_STATE.RESEARCH_EXHAUSTED, stateLog, hypotheses, contradictions, explanations, currentScore, currentDecision, researchResult);
        }

        // ── REASON ───────────────────────────────────────────────────────────
        log(AGENT_STATE.REASON);
        const demandResult = this.demandEngine.inferDemand(lead, evidenceList);
        const matches = this.matcher.match(demandResult.demandProfile, this.catalog);
        const scoreResult = this.scorer.score(matches, demandResult.unknowns);

        // ── FORM_HYPOTHESIS ──────────────────────────────────────────────────
        log(AGENT_STATE.FORM_HYPOTHESIS, `matches=${matches.length}`);
        hypotheses = this.hypothesisEngine.generate(lead, matches, evidenceList, demandResult.unknowns);
        log(AGENT_STATE.FORM_HYPOTHESIS, `hypotheses=${hypotheses.length} (all INFERENCE)`);

        // ── IDENTIFY_UNKNOWN ─────────────────────────────────────────────────
        log(AGENT_STATE.IDENTIFY_UNKNOWN, `unknowns=${demandResult.unknowns.join(',')}`);
        currentUnknowns = demandResult.unknowns;

        // ── PLAN_RESEARCH (via ResearchLoop.planner) ─────────────────────────
        log(AGENT_STATE.PLAN_RESEARCH);
        const { conflicts: structuralConflicts } = this.evidenceGraph.getConflicts(leadId);

        // ── CONTRADICTION_CHECK ──────────────────────────────────────────────
        log(AGENT_STATE.CONTRADICTION_CHECK);
        contradictions = this.contradictionHunter.hunt(hypotheses, evidenceList, structuralConflicts);
        log(AGENT_STATE.CONTRADICTION_CHECK, `contradictions=${contradictions.length}`);

        const decisionBlocked = this.contradictionHunter.shouldBlockDecision(contradictions);
        if (decisionBlocked) {
            log(AGENT_STATE.STOP, 'CRITICAL/HIGH contradiction detected → HUMAN_REVIEW');
        }

        // ── EXECUTE_RESEARCH ─────────────────────────────────────────────────
        const shouldResearch = currentDecision === 'RESEARCH_MORE' &&
            !decisionBlocked &&
            (lead.researchAttempts || 0) < MAX_RESEARCH_ATTEMPTS;

        if (shouldResearch) {
            log(AGENT_STATE.EXECUTE_RESEARCH, `attempt=${(lead.researchAttempts || 0) + 1}`);
            try {
                researchResult = await this.researchLoop.execute(
                    lead, currentDecision, currentScore, structuralConflicts, currentUnknowns
                );
                currentScore = researchResult.updatedScore;
                currentDecision = researchResult.updatedDecision;
            } catch (e) {
                log(AGENT_STATE.EXECUTE_RESEARCH, `ERROR: ${e.message} — falling back to deterministic`);
            }
        } else {
            log(AGENT_STATE.PLAN_RESEARCH, 'No research needed: ' +
                (decisionBlocked ? 'BLOCKED_BY_CONTRADICTION' :
                    currentDecision === 'HUMAN_REVIEW' ? 'ALREADY_ACTIONABLE' :
                    'EXHAUSTED'));
        }

        // ── RESCORE ──────────────────────────────────────────────────────────
        log(AGENT_STATE.RESCORE);
        const updatedEvidence = this.evidenceGraph.getEvidence(leadId);
        const updatedDemand = this.demandEngine.inferDemand(lead, updatedEvidence);
        const updatedMatches = this.matcher.match(updatedDemand.demandProfile, this.catalog);
        const updatedScore = this.scorer.score(updatedMatches, updatedDemand.unknowns);

        // ── QUALITY_FIREWALL ─────────────────────────────────────────────────
        log(AGENT_STATE.QUALITY_FIREWALL);
        const updatedLead = { ...lead, researchAttempts: (lead.researchAttempts || 0) + (shouldResearch ? 1 : 0) };
        const qualityDecision = this.firewall.gradeQuality(updatedLead, updatedEvidence, updatedScore.opportunityScore);

        // ── EXPLAIN ──────────────────────────────────────────────────────────
        log(AGENT_STATE.EXPLAIN);
        const traces = this.traceBuilder.build(
            leadId, updatedMatches, updatedEvidence, updatedDemand.unknowns,
            qualityDecision, hypotheses, contradictions
        );
        explanations = updatedMatches.map((match, i) =>
            this.reasoner.explain(match, updatedEvidence, updatedDemand.unknowns, qualityDecision.decision, traces[i])
        );

        // ── FINAL SNAPSHOT ───────────────────────────────────────────────────
        const finalSnap = this.snapshotter.create(
            leadId, updatedMatches, updatedScore, qualityDecision, updatedEvidence,
            shouldResearch ? 'POST_AI_RESEARCH' : 'POST_AI_ANALYSIS'
        );

        // ── DETERMINE FINAL STATE ────────────────────────────────────────────
        let finalState;
        if (decisionBlocked) {
            finalState = FINAL_STATE.RESEARCH_BLOCKED;
        } else if (qualityDecision.decision === 'HUMAN_REVIEW') {
            finalState = FINAL_STATE.HUMAN_REVIEW;
        } else if (qualityDecision.decision === 'REJECTED') {
            finalState = FINAL_STATE.NO_ACTION;
        } else if ((updatedLead.researchAttempts) >= MAX_RESEARCH_ATTEMPTS) {
            finalState = FINAL_STATE.RESEARCH_EXHAUSTED;
        } else if (shouldResearch) {
            finalState = FINAL_STATE.RESEARCH_COMPLETE;
        } else {
            finalState = FINAL_STATE.NO_ACTION;
        }

        log(AGENT_STATE.STOP, finalState);

        return this._buildResult(lead, finalState, stateLog, hypotheses, contradictions, explanations,
            updatedScore.opportunityScore, qualityDecision.decision, researchResult, traces, finalSnap, qualityDecision);
    }

    _buildResult(lead, finalState, stateLog, hypotheses, contradictions, explanations,
        score, decision, researchResult, traces = [], snapshot = null, qualityDecision = null) {
        return {
            leadId: lead.id || lead.leadId,
            businessName: lead.businessName,
            finalState,
            stateLog,
            realBaileysCalls: this.realBaileysCalls, // INVARIANT: always 0
            hypotheses,
            contradictions,
            explanations,
            traces,
            snapshot,
            score,
            decision,
            qualityGrade: qualityDecision?.qualityGrade,
            researchResult,
            completedAt: new Date().toISOString()
        };
    }
}
