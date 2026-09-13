/**
 * LearningLoopEngine.mjs
 * 
 * Controlled, Human-Governed AI Learning Loop.
 * Pipeline:
 * Conversation -> Evaluation -> Failure Detection -> Pattern Discovery -> Recommendation -> Human Approval -> Regression Test -> Production
 * 
 * Ensures the AI never mutates its own prompts or policies arbitrarily without human sign-off.
 */

export class LearningLoopEngine {
    constructor() {
        this.failureLogs = [];
        this.proposedImprovements = new Map();
    }

    /**
     * Ingest an evaluated conversation outcome
     */
    ingestEvaluation({ conversationId, evaluation, incomingText, responseText }) {
        if (!evaluation.isPassed && evaluation.failureType !== 'NONE') {
            this.failureLogs.push({
                conversationId,
                failureType: evaluation.failureType,
                scores: evaluation.scores,
                incomingText: incomingText.slice(0, 100),
                responseText: responseText.slice(0, 100),
                timestamp: Date.now()
            });

            this._detectPatternsAndPropose();
        }
    }

    /**
     * Aggregate failures and propose governed system adjustment
     */
    _detectPatternsAndPropose() {
        // Group by failure type
        const counts = {};
        for (const log of this.failureLogs) {
            counts[log.failureType] = (counts[log.failureType] || 0) + 1;
        }

        for (const [failureType, count] of Object.entries(counts)) {
            if (count >= 3 && !this.proposedImprovements.has(failureType)) {
                let proposal = '';
                let targetPolicy = '';

                switch (failureType) {
                    case 'PREMATURE_OFFER':
                        proposal = 'Tingkatkan threshold penawaran demo: wajib minimal 2 putaran tanya-jawab sebelum menawarkan solusi komersial.';
                        targetPolicy = 'NextBestActionEngine.MIN_DISCOVERY_TURNS';
                        break;
                    case 'TONE_DEAF_RESPONSE':
                        proposal = 'Kunci humorPermission ke 0.0 ketika FrustrationDetector mendeteksi kata keluhan operasional.';
                        targetPolicy = 'PersonalityGovernor.FRUSTRATION_OVERRIDE';
                        break;
                    case 'UNGROUNDED_CLAIM':
                        proposal = 'Klaim numerik tanpa referensi database audit harus diblokir sebelum sampai ke synthesizer pesan.';
                        targetPolicy = 'TruthEvidenceEngine.STRICT_FACT_CHECK';
                        break;
                    default:
                        proposal = `Evaluasi ulang template balasan untuk pola kegagalan ${failureType}.`;
                        targetPolicy = 'GENERAL_PROMPT';
                }

                this.proposedImprovements.set(failureType, {
                    proposalId: `prop_${failureType.toLowerCase()}`,
                    failureType,
                    occurrenceCount: count,
                    proposal,
                    targetPolicy,
                    status: 'AWAITING_HUMAN_APPROVAL',
                    createdAt: Date.now()
                });
            }
        }
    }

    /**
     * Get pending proposals awaiting Bos Agus's approval
     */
    getPendingProposals() {
        return Array.from(this.proposedImprovements.values()).filter(p => p.status === 'AWAITING_HUMAN_APPROVAL');
    }

    /**
     * Apply an approved proposal
     */
    approveProposal(proposalId, approver = 'BOS_AGUS') {
        for (const prop of this.proposedImprovements.values()) {
            if (prop.proposalId === proposalId) {
                prop.status = 'APPROVED';
                prop.approvedBy = approver;
                prop.approvedAt = Date.now();
                return { success: true, proposal: prop };
            }
        }
        return { success: false, reason: 'PROPOSAL_NOT_FOUND' };
    }
}
