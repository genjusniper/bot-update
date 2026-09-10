// src/core/fabric/FactEvidenceComparator.mjs
// Pre-transmission self-critique comparator: compares candidate LLM response drafts against verified ground truth
// Detects and prevents hallucinations and direct contradictions

export class FactEvidenceComparator {
    /**
     * Inspects a candidate draft response against verified facts
     * @param {Object} params
     * @param {string} params.draftResponse
     * @param {Array<{ subject: string, predicate: string, object: string, truthValue: boolean }>} [params.groundTruths=[]]
     * @param {Object} [params.systemFacts={}]
     * @returns {Object} Comparison Result
     */
    static compareDraft({ draftResponse = '', groundTruths = [], systemFacts = {} }) {
        if (!draftResponse) return { isValid: true, contradictions: [], sanitizedText: '' };

        const lowerDraft = draftResponse.toLowerCase();
        const contradictions = [];

        // 1. Check known system facts
        // Example: If systemFacts.isOnline === true, but draft says "sedang offline"
        if (systemFacts.isOnline !== undefined) {
            const claimsOffline = /sedang offline|tidak aktif|server mati|bot mati/i.test(lowerDraft);
            if (systemFacts.isOnline && claimsOffline) {
                contradictions.push({
                    type: 'SYSTEM_STATUS_CONTRADICTION',
                    claim: 'Claims bot or system is offline',
                    fact: 'System is verified ONLINE',
                    severity: 'CRITICAL'
                });
            }
        }

        // Example: If system has SQLite active, but draft claims no database
        if (systemFacts.hasDatabase && /tidak punya database|tanpa database|tidak menyimpan data/i.test(lowerDraft)) {
            contradictions.push({
                type: 'ARCHITECTURE_CONTRADICTION',
                claim: 'Claims no persistent storage',
                fact: 'SQLite database is active and mounted',
                severity: 'HIGH'
            });
        }

        // 2. Check relational ground truths
        for (const gt of groundTruths) {
            const subjectMentioned = lowerDraft.includes(gt.subject.toLowerCase());
            if (subjectMentioned) {
                // If ground truth says Agus is owner, but draft says someone else is owner
                if (gt.predicate === 'IS_OWNER' && gt.truthValue === true) {
                    if (lowerDraft.includes('bukan owner') || lowerDraft.includes('bukan pemilik')) {
                        contradictions.push({
                            type: 'IDENTITY_CONTRADICTION',
                            claim: `Denied owner status for ${gt.subject}`,
                            fact: `${gt.subject} is verified owner`,
                            severity: 'CRITICAL'
                        });
                    }
                }
            }
        }

        const isValid = contradictions.length === 0;

        return {
            isValid,
            contradictionCount: contradictions.length,
            contradictions,
            requiresRejection: contradictions.some(c => c.severity === 'CRITICAL')
        };
    }
}
