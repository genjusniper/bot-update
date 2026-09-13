/**
 * ResearchAgent.mjs
 * 
 * Specialized research agent (Read & Search Only).
 * Transforms "I don't know" into autonomous evidence gathering:
 * QUESTION -> KNOWLEDGE CHECK -> UNKNOWN -> RESEARCH PLAN -> RESEARCH -> EVIDENCE -> VERIFY -> ANSWER
 */

export class ResearchAgent {
    constructor(searchProvider = null) {
        this.searchProvider = searchProvider;
    }

    /**
     * Conduct structured research on an unknown query
     */
    async investigate(query, existingKnowledge = {}) {
        const clean = (query || '').trim();

        // 1. Build Research Plan
        const plan = {
            query: clean,
            searchKeywords: this._extractKeywords(clean),
            targets: ['local_database', 'catalog_cache', 'live_web'],
            createdAt: Date.now()
        };

        // 2. Gather Evidence Pieces
        const evidencePieces = [];

        // Check internal catalog/knowledge
        if (existingKnowledge[clean.toLowerCase()]) {
            evidencePieces.push({
                source: 'INTERNAL_KNOWLEDGE_BASE',
                content: existingKnowledge[clean.toLowerCase()],
                reliability: 95,
                timestamp: Date.now()
            });
        }

        // Search Provider Integration
        if (this.searchProvider && plan.searchKeywords.length > 0) {
            try {
                const searchRes = await this.searchProvider(plan.searchKeywords.join(' '));
                if (searchRes && searchRes.summary) {
                    evidencePieces.push({
                        source: 'LIVE_WEB_SEARCH',
                        content: searchRes.summary,
                        reliability: 80,
                        timestamp: Date.now()
                    });
                }
            } catch (err) {
                // Non-fatal search degradation
            }
        }

        // 3. Synthesize Grounded Report
        if (evidencePieces.length === 0) {
            return {
                found: false,
                summary: `Aku telah memeriksa database internal dan arsip pengetahuan untuk "${clean}", namun belum menemukan bukti terverifikasi.`,
                evidence: []
            };
        }

        return {
            found: true,
            summary: `Berdasarkan bukti dari ${evidencePieces.map(e => e.source).join(' & ')}: ${evidencePieces[0].content}`,
            evidence: evidencePieces
        };
    }

    _extractKeywords(text) {
        return text
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3 && !/^(apakah|gimana|bagaimana|tolong|salim|kamu|bisa)$/i.test(w))
            .slice(0, 4);
    }
}
