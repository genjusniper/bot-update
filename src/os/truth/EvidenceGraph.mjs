/**
 * EvidenceGraph.mjs
 * 
 * Enterprise Evidence Graph & Conflict Detection.
 * Maps:
 * CLAIM -> EVIDENCE -> SOURCE -> TIMESTAMP -> RELIABILITY -> CONFLICTS
 * 
 * When two evidence sources disagree (e.g., catalog price vs WhatsApp message),
 * the graph flags the conflict explicitly instead of guessing or hallucinating.
 */

export class EvidenceGraph {
    constructor() {
        this.claims = new Map(); // claimKey -> { claim, evidenceNodes: [], conflicts: [] }
    }

    /**
     * Add an evidence piece for a specific claim
     */
    addEvidence({ claimKey, value, source, timestamp = Date.now(), reliability = 80 }) {
        if (!this.claims.has(claimKey)) {
            this.claims.set(claimKey, {
                claimKey,
                currentValue: value,
                evidenceNodes: [],
                conflicts: []
            });
        }

        const node = this.claims.get(claimKey);
        const evidenceNode = {
            id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            value,
            source,
            timestamp,
            reliability
        };

        // Check for conflicting values with existing evidence
        for (const existing of node.evidenceNodes) {
            if (JSON.stringify(existing.value) !== JSON.stringify(value)) {
                node.conflicts.push({
                    sourceA: existing.source,
                    valueA: existing.value,
                    timestampA: existing.timestamp,
                    sourceB: source,
                    valueB: value,
                    timestampB: timestamp
                });
            }
        }

        node.evidenceNodes.push(evidenceNode);
        // Sort evidence by reliability & recency
        node.evidenceNodes.sort((a, b) => b.reliability - a.reliability || b.timestamp - a.timestamp);
        node.currentValue = node.evidenceNodes[0].value;

        return {
            claimKey,
            hasConflict: node.conflicts.length > 0,
            conflicts: node.conflicts,
            totalEvidence: node.evidenceNodes.length
        };
    }

    /**
     * Inspect claim status
     */
    getClaim(claimKey) {
        return this.claims.get(claimKey) || null;
    }

    /**
     * Format conflict report for transparent user disclosure
     */
    getConflictReport(claimKey) {
        const node = this.claims.get(claimKey);
        if (!node || node.conflicts.length === 0) return null;

        const c = node.conflicts[0];
        return `Ada perbedaan data untuk "${claimKey}":\n` +
               `• Sumber 1 (${c.sourceA}): ${JSON.stringify(c.valueA)}\n` +
               `• Sumber 2 (${c.sourceB}): ${JSON.stringify(c.valueB)}\n` +
               `Salim tidak memilih salah satunya secara otomatis untuk menjaga integritas data Anda. Mohon konfirmasi versi mana yang benar.`;
    }
}
