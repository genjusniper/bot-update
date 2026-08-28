// src/behavior/SearchIntentEngine.mjs
// SearchIntentEngine: Decides if incoming user message has search or recommendation intent

export class SearchIntentEngine {
    static classify(text) {
        const lower = (text || '').trim().toLowerCase();

        // 1. Recommendation Triggers
        const isRecommendation = Boolean(lower.match(/(rekomendasi|mending|bagusan|worth|pilih mana|paling bagus)/i));
        
        // 2. Search / Info Triggers
        const isSearch = Boolean(lower.match(/(carikan|cariin|info harga|harga terbaru|cek harga|cuaca|berita terbaru)/i));

        if (isRecommendation || isSearch) {
            // Formulate query by removing command prefixes
            let query = (text || '').replace(/(carikan|cariin|rekomendasi|info|cek|tolong cari|coba cari)/gi, '').trim();
            if (!query) query = text; // Fallback

            return {
                isSearchRequired: true,
                intent: isRecommendation ? 'RECOMMENDATION' : 'SEARCH',
                query
            };
        }

        return {
            isSearchRequired: false,
            intent: 'CONVERSATION',
            query: null
        };
    }
}
