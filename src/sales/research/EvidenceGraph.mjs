/**
 * EvidenceGraph.mjs
 *
 * Append-only evidence store per lead.
 * Derives Claims from evidence sets using ClaimEngine.
 * Provides current intelligence view and snapshots.
 *
 * STRUCTURE on disk: data/evidence/{leadId}.json
 *
 * {
 *   leadId,
 *   evidenceLog: [...],   // APPEND ONLY — never modified
 *   fingerprints: [],     // dedup index
 *   claims: {...},        // derived, updated on each append
 *   snapshots: [...]      // point-in-time intelligence snapshots
 * }
 *
 * INVARIANT:
 *   Evidence once appended is never removed or modified.
 *   Claims are re-derived after each append.
 *   Snapshots are immutable once created.
 */

import fs from 'fs';
import path from 'path';
import { ClaimEngine } from './ClaimEngine.mjs';
import { ConflictResolver } from './ConflictResolver.mjs';
import { EvidenceDecayEngine } from './EvidenceDecayEngine.mjs';
import { computeFingerprint } from './EvidenceIntakeContract.mjs';

const EVIDENCE_DIR = './data/evidence';

export class EvidenceGraph {
    constructor(storeDir = EVIDENCE_DIR) {
        this.storeDir = storeDir;
        this.claimEngine = new ClaimEngine();
        this.conflictResolver = new ConflictResolver();
        this.decayEngine = new EvidenceDecayEngine();

        if (!fs.existsSync(storeDir)) {
            fs.mkdirSync(storeDir, { recursive: true });
        }
    }

    _graphPath(leadId) {
        return path.join(this.storeDir, `${leadId}.json`);
    }

    _load(leadId) {
        const p = this._graphPath(leadId);
        if (!fs.existsSync(p)) {
            return {
                leadId,
                evidenceLog: [],
                fingerprints: [],
                claims: {},
                conflicts: [],
                snapshots: []
            };
        }
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }

    _save(graph) {
        const p = this._graphPath(graph.leadId);
        fs.writeFileSync(p, JSON.stringify(graph, null, 2));
    }

    /**
     * Append evidence to the graph.
     * Deduplicates by fingerprint.
     * Re-derives claims after each append.
     *
     * @param {string} leadId
     * @param {object} evidence - Already intake-validated, frozen object
     * @returns {{ appended: boolean, reason?: string }}
     */
    append(leadId, evidence) {
        const graph = this._load(leadId);

        // Fingerprint dedup
        const fp = evidence.fingerprint || computeFingerprint(
            leadId, evidence.domain, evidence.normalizedValue, evidence.sourceRef
        );

        if (graph.fingerprints.includes(fp)) {
            return { appended: false, reason: `DUPLICATE_FINGERPRINT: ${fp}` };
        }

        // Unfreeze for storage (we store a plain JSON copy; the in-memory object stays frozen)
        const storable = JSON.parse(JSON.stringify(evidence));
        storable.fingerprint = fp;

        graph.evidenceLog.push(storable);
        graph.fingerprints.push(fp);

        // Re-derive claims
        const claimMap = this.claimEngine.buildClaims(leadId, graph.evidenceLog);
        graph.claims = Object.fromEntries(claimMap);

        // Re-run conflict detection
        const { conflicts, blockOutreach } = this.conflictResolver.detect(graph.evidenceLog);
        graph.conflicts = conflicts;
        graph.blockOutreach = blockOutreach;

        this._save(graph);
        return { appended: true, fingerprint: fp };
    }

    /**
     * Get all evidence for a lead.
     */
    getEvidence(leadId) {
        return this._load(leadId).evidenceLog;
    }

    /**
     * Get current claims for a lead.
     */
    getClaims(leadId) {
        return this._load(leadId).claims;
    }

    /**
     * Get current conflicts.
     */
    getConflicts(leadId) {
        const g = this._load(leadId);
        return { conflicts: g.conflicts || [], blockOutreach: g.blockOutreach || false };
    }

    /**
     * Get current intelligence — evidence with freshness + claims with confidence.
     */
    getIntelligence(leadId) {
        const graph = this._load(leadId);
        const freshnessMap = this.decayEngine.evaluateAll(graph.evidenceLog);

        const enrichedEvidence = graph.evidenceLog.map(ev => ({
            ...ev,
            freshnessStatus: freshnessMap.get(ev.evidenceId)?.status ?? 'UNKNOWN',
            freshnessMultiplier: freshnessMap.get(ev.evidenceId)?.freshnessMultiplier ?? 0,
            evidenceConfidence: this.decayEngine.computeEvidenceConfidence(ev)
        }));

        return {
            leadId,
            evidenceCount: graph.evidenceLog.length,
            evidence: enrichedEvidence,
            claims: graph.claims,
            conflicts: graph.conflicts,
            blockOutreach: graph.blockOutreach,
            snapshots: graph.snapshots
        };
    }

    /**
     * Create a named intelligence snapshot (immutable once created).
     */
    snapshot(leadId, label = '') {
        const graph = this._load(leadId);
        const intel = this.getIntelligence(leadId);

        const snap = {
            snapshotId: `SNAP-${leadId}-${Date.now()}`,
            label,
            takenAt: new Date().toISOString(),
            evidenceCount: intel.evidenceCount,
            claimCount: Object.keys(intel.claims).length,
            conflictCount: intel.conflicts.length,
            blockOutreach: intel.blockOutreach,
            topClaims: Object.values(intel.claims)
                .sort((a, b) => b.decisionConfidence - a.decisionConfidence)
                .slice(0, 5)
                .map(c => ({
                    domain: c.domain,
                    value: c.value,
                    classification: c.classification,
                    status: c.status,
                    evidenceConfidence: c.evidenceConfidence,
                    decisionConfidence: c.decisionConfidence
                }))
        };

        Object.freeze(snap);
        graph.snapshots.push(JSON.parse(JSON.stringify(snap)));
        this._save(graph);

        return snap;
    }

    /**
     * Diff two snapshots to show what changed and why.
     */
    diffSnapshots(leadId, snapA, snapB) {
        const changes = [];

        const claimsA = new Map((snapA.topClaims || []).map(c => [`${c.domain}::${c.value}`, c]));
        const claimsB = new Map((snapB.topClaims || []).map(c => [`${c.domain}::${c.value}`, c]));

        for (const [key, claimB] of claimsB.entries()) {
            const claimA = claimsA.get(key);
            if (!claimA) {
                changes.push({ type: 'NEW_CLAIM', claim: claimB });
            } else if (claimA.decisionConfidence !== claimB.decisionConfidence) {
                changes.push({
                    type: 'CONFIDENCE_CHANGED',
                    domain: claimB.domain,
                    value: claimB.value,
                    before: claimA.decisionConfidence,
                    after: claimB.decisionConfidence,
                    delta: claimB.decisionConfidence - claimA.decisionConfidence
                });
            }
        }

        return {
            from: snapA.snapshotId,
            to: snapB.snapshotId,
            evidenceDelta: snapB.evidenceCount - snapA.evidenceCount,
            changes
        };
    }
}
