/**
 * ClaimEngine.mjs
 *
 * Interprets evidence into structured Claims.
 *
 * Architecture:
 *   Evidence (raw source) → Claim (structured interpretation) → Decision (ranked opportunity)
 *
 * Three confidence layers (see PRD §9):
 *   sourceReliability  → intrinsic to source type
 *   evidenceConfidence → reliability × directness × freshness × completeness
 *   decisionConfidence → claim-level aggregate of supporting evidence confidences
 *
 * Invariant:
 *   Claims may be UPDATED (status, conflictingEvidence)
 *   Evidence referenced by a Claim is NEVER modified
 */

import { EvidenceDecayEngine } from './EvidenceDecayEngine.mjs';
import { CLASSIFICATION } from './EvidenceIntakeContract.mjs';

export const CLAIM_STATUS = {
    SUPPORTED:   'SUPPORTED',
    WEAK:        'WEAK',
    CONFLICTED:  'CONFLICTED',
    INVALIDATED: 'INVALIDATED',
    UNKNOWN:     'UNKNOWN'
};

export class ClaimEngine {
    constructor() {
        this.decayEngine = new EvidenceDecayEngine();
    }

    /**
     * Build Claims from a list of evidence for a given lead.
     * Evidence is grouped by domain+normalizedValue to form coherent claims.
     *
     * @param {string} leadId
     * @param {object[]} evidenceList - All evidence for this lead (immutable objects)
     * @returns {Map<claimKey, Claim>}
     */
    buildClaims(leadId, evidenceList) {
        const claimMap = new Map();

        for (const ev of evidenceList) {
            // Skip evidence that cannot form claims
            if (!ev.domain || !ev.value) continue;

            const claimKey = `${ev.domain}::${ev.value.toLowerCase().trim()}`;

            if (!claimMap.has(claimKey)) {
                claimMap.set(claimKey, {
                    claimId: `CLM-${leadId}-${Buffer.from(claimKey).toString('base64').slice(0, 8)}`,
                    leadId,
                    domain: ev.domain,
                    field: ev.domain,
                    value: ev.value,
                    statement: `[${ev.domain.toUpperCase()}] ${ev.value}`,
                    status: CLAIM_STATUS.UNKNOWN,
                    classification: ev.classification,
                    supportingEvidence: [],
                    conflictingEvidence: [],
                    evidenceConfidence: 0,
                    decisionConfidence: 0,
                    createdAt: ev.capturedAt,
                    lastUpdatedAt: new Date().toISOString()
                });
            }

            const claim = claimMap.get(claimKey);

            // Compute this evidence's contribution
            const evConf = this.decayEngine.computeEvidenceConfidence(ev);

            // A DIRECT/FACT evidence strengthens the claim
            if (ev.classification === CLASSIFICATION.FACT) {
                claim.supportingEvidence.unshift(ev.evidenceId); // Facts go to front
                claim.classification = CLASSIFICATION.FACT;
            } else {
                claim.supportingEvidence.push(ev.evidenceId);
                if (claim.classification !== CLASSIFICATION.FACT) {
                    claim.classification = ev.classification;
                }
            }

            // Update claim confidence (running weighted average)
            const n = claim.supportingEvidence.length;
            claim.evidenceConfidence = ((claim.evidenceConfidence * (n - 1)) + evConf) / n;
        }

        // Finalize each claim's status and decisionConfidence
        for (const claim of claimMap.values()) {
            claim.decisionConfidence = this._computeDecisionConfidence(claim);
            claim.status = this._determineStatus(claim);
            Object.freeze(claim.supportingEvidence);
            Object.freeze(claim.conflictingEvidence);
        }

        return claimMap;
    }

    /**
     * Mark conflicting evidence on a claim.
     * Does NOT modify supporting evidence — only adds to conflictingEvidence list.
     * Changes claim.status to CONFLICTED.
     */
    applyConflict(claim, conflictingEvidenceId, severity) {
        // Can't freeze the array beforehand if we need to add to it — we use a new object
        return {
            ...claim,
            conflictingEvidence: [...(claim.conflictingEvidence || []), conflictingEvidenceId],
            status: severity === 'CRITICAL' ? CLAIM_STATUS.INVALIDATED : CLAIM_STATUS.CONFLICTED,
            lastUpdatedAt: new Date().toISOString()
        };
    }

    _computeDecisionConfidence(claim) {
        // decisionConfidence = evidenceConfidence × classification weight × (1 - conflict penalty)
        const classWeights = {
            [CLASSIFICATION.FACT]: 1.0,
            [CLASSIFICATION.INFERENCE]: 0.7,
            [CLASSIFICATION.UNKNOWN]: 0.2
        };
        const classWeight = classWeights[claim.classification] ?? 0.5;
        const conflictPenalty = claim.conflictingEvidence.length > 0 ? 0.3 : 0;
        return Math.max(0, claim.evidenceConfidence * classWeight * (1 - conflictPenalty));
    }

    _determineStatus(claim) {
        if (claim.conflictingEvidence.length > 0) return CLAIM_STATUS.CONFLICTED;
        if (claim.evidenceConfidence >= 0.7) return CLAIM_STATUS.SUPPORTED;
        if (claim.evidenceConfidence >= 0.3) return CLAIM_STATUS.WEAK;
        return CLAIM_STATUS.UNKNOWN;
    }
}
