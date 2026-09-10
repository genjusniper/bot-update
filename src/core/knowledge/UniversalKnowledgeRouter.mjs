// src/core/knowledge/UniversalKnowledgeRouter.mjs
// Routes incoming queries to the optimal knowledge domain (Personal World, Memory, Live News/Web, Computation, LLM)

export class UniversalKnowledgeRouter {
    static ROUTE_TYPES = Object.freeze({
        INTERNAL_WORLD: 'INTERNAL_WORLD',
        MEMORY_STORE: 'MEMORY_STORE',
        LIVE_NEWS_WEB: 'LIVE_NEWS_WEB',
        COMPUTATION: 'COMPUTATION',
        GENERAL_LLM: 'GENERAL_LLM'
    });

    /**
     * Classifies a user query into the appropriate knowledge route
     * @param {string} text - User query
     * @returns {{ route: string, confidence: number, reasoning: string }}
     */
    static routeQuery(text = '') {
        if (!text) return { route: this.ROUTE_TYPES.GENERAL_LLM, confidence: 0.5, reasoning: 'Empty query' };

        const lower = text.toLowerCase().trim();

        // 1. Computation / Math
        if (/^[\d\s+\-*\/().%^=x÷]+$/.test(text) || /(berapa|hitung|kalkulasi|akar dari|\d+\s*(\+|\-|\*|\/|x)\s*\d+)/i.test(lower)) {
            return {
                route: this.ROUTE_TYPES.COMPUTATION,
                confidence: 0.95,
                reasoning: 'Mathematical or numerical expression detected'
            };
        }

        // 2. Personal World & System Orbit
        if (/(siapa mas agus|siapa agus|tentang arka|proyek arka|profil agus|spek server|bot arka|pembuatmu|creator)/i.test(lower)) {
            return {
                route: this.ROUTE_TYPES.INTERNAL_WORLD,
                confidence: 0.95,
                reasoning: 'Direct query about owner, system persona, or core projects'
            };
        }

        // 3. User Memory / Working Memory
        if (/(inget gak|ingat ga|kemarin aku|yang tadi aku|pernah kubilang|catatanku|nomor rekeningku)/i.test(lower)) {
            return {
                route: this.ROUTE_TYPES.MEMORY_STORE,
                confidence: 0.90,
                reasoning: 'Explicit reference to past conversation or personal memory'
            };
        }

        // 4. Live News / Current External Facts
        if (/(berita|kabar terkini|breaking news|gempa|kurs dolar|harga btc|hari ini ada apa|pemilu|presiden sekarang|cuaca semarang|update terbaru)/i.test(lower)) {
            return {
                route: this.ROUTE_TYPES.LIVE_NEWS_WEB,
                confidence: 0.92,
                reasoning: 'Temporal freshness, current events, or external live data indicator'
            };
        }

        // Default to General LLM reasoning
        return {
            route: this.ROUTE_TYPES.GENERAL_LLM,
            confidence: 0.80,
            reasoning: 'General conversational or conceptual inquiry'
        };
    }
}
