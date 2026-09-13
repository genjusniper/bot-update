/**
 * DecisionTraceBuilder.mjs
 *
 * Builds and persists a complete, auditable decision trace for each opportunity.
 * The trace must answer: "Why did you recommend this product?"
 *
 * TRACE LIFECYCLE:
 *   Built after every research cycle.
 *   Appended to per-lead trace log.
 *   Never overwritten.
 *
 * TRACE structure (persisted):
 * {
 *   traceId: "TRACE-lead-xxx-telur-001",
 *   leadId: "...",
 *   product: "telur",
 *   demand: { signal, classification, evidenceIds },
 *   supply: { status, availability },
 *   evidence: [ { id, domain, value, classification, confidence } ],
 *   confidence: {
 *     sourceReliability: 0.85,
 *     evidenceConfidence: 0.90,
 *     decisionConfidence: 0.87
 *   },
 *   missing: ["volume", "frequency"],
 *   conflicts: [],
 *   finalDecision: "HUMAN_REVIEW",
 *   tracedAt: "..."
 * }
 */

import fs from 'fs';
import path from 'path';

const TRACE_DIR = './data/traces';

export class DecisionTraceBuilder {
    constructor(traceDir = TRACE_DIR) {
        this.traceDir = traceDir;
        if (!fs.existsSync(traceDir)) fs.mkdirSync(traceDir, { recursive: true });
    }

    /**
     * Build and persist a decision trace for all active matches.
     *
     * @param {string} leadId
     * @param {object[]} demandMatches - from SupplyDemandMatcher
     * @param {object[]} evidenceList
     * @param {string[]} unknowns
     * @param {object} qualityDecision - from LeadQualityFirewall
     * @param {object[]} hypotheses - from HypothesisEngine
     * @param {object[]} contradictions - from ContradictionHunter
     * @returns {object[]} Array of trace objects (one per match)
     */
    build(leadId, demandMatches, evidenceList, unknowns, qualityDecision, hypotheses = [], contradictions = []) {
        const traces = [];

        for (const match of demandMatches) {
            const product = match.product;

            // Find supporting evidence
            const supporting = evidenceList.filter(e => {
                const val = (e.normalizedValue || e.value || '').toLowerCase();
                return (e.domain === 'menu' || e.domain === 'demand') &&
                    (val.includes(product) || val.includes(product.replace('_', ' ')));
            });

            // Three-layer confidence
            const avgSourceRel = supporting.length > 0
                ? supporting.reduce((s, e) => s + (e.reliability ?? 0.5), 0) / supporting.length
                : 0;

            const avgEvConf = supporting.length > 0
                ? supporting.reduce((s, e) => s + (e.evidenceConfidence ?? e.reliability ?? 0.5), 0) / supporting.length
                : 0;

            const productConflicts = (qualityDecision?.conflicts || []).filter(c =>
                c.domain === 'menu' || c.domain === 'demand'
            );

            const decisionConf = match.matchScore * (1 - (productConflicts.length > 0 ? 0.2 : 0));

            // Find supporting hypothesis
            const hypForProduct = hypotheses.find(h => h.product === product);
            const contForProduct = contradictions.find(c => c.product === product);

            const trace = {
                traceId: `TRACE-${leadId}-${product}-${Date.now()}`,
                leadId,
                product,
                demand: {
                    signal: match.demandSignal,
                    classification: match.classification || 'INFERENCE',
                    evidenceIds: supporting.map(e => e.evidenceId)
                },
                supply: {
                    status: match.supplyStatus,
                    activeRecommendation: match.activeRecommendation
                },
                evidence: supporting.map(e => ({
                    evidenceId: e.evidenceId,
                    domain: e.domain,
                    value: e.normalizedValue ?? e.value,
                    classification: e.classification,
                    capturedAt: e.capturedAt,
                    evidenceConfidence: parseFloat((e.evidenceConfidence ?? e.reliability ?? 0).toFixed(4))
                })),
                confidence: {
                    sourceReliability: parseFloat(avgSourceRel.toFixed(4)),
                    evidenceConfidence: parseFloat(avgEvConf.toFixed(4)),
                    decisionConfidence: parseFloat(decisionConf.toFixed(4))
                },
                missing: unknowns,
                conflicts: productConflicts,
                hypothesis: hypForProduct ? {
                    id: hypForProduct.hypothesisId,
                    confidence: hypForProduct.confidence,
                    classification: hypForProduct.classification  // Must be INFERENCE
                } : null,
                contradiction: contForProduct ? {
                    id: contForProduct.contradictionId,
                    severity: contForProduct.severity,
                    resolution: contForProduct.resolution
                } : null,
                finalDecision: qualityDecision?.decision || 'UNKNOWN',
                qualityGrade: qualityDecision?.qualityGrade || 'UNKNOWN',
                tracedAt: new Date().toISOString()
            };

            traces.push(trace);
        }

        // Persist append-only to per-lead trace file
        this._append(leadId, traces);

        return traces;
    }

    /**
     * Render a single trace as human-readable text.
     */
    render(trace) {
        const conflictStr = trace.conflicts.length > 0
            ? trace.conflicts.map(c => `${c.severity}(${c.domain})`).join(', ')
            : 'NONE';

        const lines = [
            `DECISION TRACE — ${trace.product.toUpperCase()}`,
            `${'─'.repeat(40)}`,
            `├── Demand     : ${trace.demand.signal}`,
            `├── Supply     : ${trace.supply.status}`,
            `├── Confidence :`,
            `│   ├── Source   = ${(trace.confidence.sourceReliability * 100).toFixed(0)}%`,
            `│   ├── Evidence = ${(trace.confidence.evidenceConfidence * 100).toFixed(0)}%`,
            `│   └── Decision = ${(trace.confidence.decisionConfidence * 100).toFixed(0)}%`,
            `├── Evidence   : ${trace.evidence.length} item(s)`,
            ...trace.evidence.map(e => `│   └── ${e.evidenceId} [${e.classification}] ${e.value}`),
            `├── Missing    : ${trace.missing.join(', ') || 'none'}`,
            `├── Conflict   : ${conflictStr}`,
            `└── Decision   : ${trace.finalDecision} (Grade: ${trace.qualityGrade})`
        ];

        return lines.join('\n');
    }

    /**
     * Load all traces for a lead.
     */
    load(leadId) {
        const p = path.join(this.traceDir, `${leadId}.jsonl`);
        if (!fs.existsSync(p)) return [];
        return fs.readFileSync(p, 'utf-8')
            .split('\n').filter(Boolean)
            .map(l => JSON.parse(l));
    }

    _append(leadId, traces) {
        const p = path.join(this.traceDir, `${leadId}.jsonl`);
        const lines = traces.map(t => JSON.stringify(t)).join('\n') + '\n';
        fs.appendFileSync(p, lines);
    }
}
