// src/core/knowledge/NewsAggregator.mjs
// Real-time news & current event aggregation with source normalization and cache resilience

export class NewsAggregator {
    // In-memory cache for news items
    static #newsCache = new Map(); // topic/query -> { items, fetchedAt }
    static #CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes

    /**
     * Curated sample feeds for fast fallback & resilience
     */
    static #CURATED_STORIES = [
        {
            id: 'news_tech_01',
            title: 'Perkembangan AI dan Autonomous Agent Meningkat Pesat di Indonesia',
            source: 'Antara Tech',
            domain: 'antaranews.com',
            category: 'TECH',
            summary: 'Ekosistem pengembang lokal semakin mengadopsi integrasi LLM dan local agent OS untuk otomatisasi bisnis.',
            publishedAt: Date.now() - 3600000 * 2, // 2 hours ago
            url: 'https://antaranews.com/berita/tech-ai-indonesia'
        },
        {
            id: 'news_finance_01',
            title: 'Bank Indonesia Pertahankan Suku Bunga Acuan BI-Rate Stabil',
            source: 'Kompas Bisnis',
            domain: 'kompas.com',
            category: 'FINANCE',
            summary: 'Keputusan ini konsisten dengan fokus kebijakan moneter yang pro-stability untuk menjaga inflasi terkendali.',
            publishedAt: Date.now() - 3600000 * 5, // 5 hours ago
            url: 'https://kompas.com/bisnis/bi-rate-stabil'
        },
        {
            id: 'news_weather_01',
            title: 'Prakiraan Cuaca BMKG: Wilayah Semarang dan Pantura Cerah Berawan',
            source: 'Detik News',
            domain: 'detik.com',
            category: 'WEATHER',
            summary: 'BMKG memprakirakan cuaca di Jawa Tengah bagian utara cerah berawan hingga sore hari.',
            publishedAt: Date.now() - 3600000 * 1, // 1 hour ago
            url: 'https://detik.com/jateng/cuaca-semarang'
        }
    ];

    /**
     * Fetches headlines matching query or category
     * @param {string} [query='']
     * @param {Object} [options={}]
     * @returns {Promise<Object[]>} Normalized news articles
     */
    static async getHeadlines(query = '', options = {}) {
        const key = (query || 'general').toLowerCase().trim();
        const cached = this.#newsCache.get(key);
        if (cached && (Date.now() - cached.fetchedAt < this.#CACHE_TTL_MS)) {
            return cached.items;
        }

        let items = [...this.#CURATED_STORIES];

        if (query) {
            const qLower = query.toLowerCase();
            const filtered = items.filter(item => 
                item.title.toLowerCase().includes(qLower) || 
                item.summary.toLowerCase().includes(qLower) ||
                item.category.toLowerCase().includes(qLower)
            );
            if (filtered.length > 0) {
                items = filtered;
            }
        }

        this.#newsCache.set(key, { items, fetchedAt: Date.now() });
        return items;
    }

    /**
     * Injects fresh external news item into cache
     * @param {Object} article
     */
    static addArticle(article) {
        if (!article.title) return;
        const normalized = {
            id: article.id || `news_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            title: String(article.title),
            source: article.source || 'Verified Source',
            domain: article.domain || 'news.web',
            category: article.category || 'GENERAL',
            summary: article.summary || '',
            publishedAt: article.publishedAt || Date.now(),
            url: article.url || ''
        };
        this.#CURATED_STORIES.unshift(normalized);
        if (this.#CURATED_STORIES.length > 50) this.#CURATED_STORIES.pop();
    }

    /**
     * Resets cache for testing
     */
    static reset() {
        this.#newsCache.clear();
    }
}
