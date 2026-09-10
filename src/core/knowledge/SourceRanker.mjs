// src/core/knowledge/SourceRanker.mjs
// Evaluates source credibility, freshness decay, and resolves conflicting reports

export class SourceRanker {
    // Known domain credibility tiers
    static DOMAIN_CREDIBILITY = Object.freeze({
        'bmkg.go.id': 0.98,
        'bi.go.id': 0.98,
        'antaranews.com': 0.95,
        'reuters.com': 0.95,
        'bbc.com': 0.95,
        'kompas.com': 0.88,
        'tempo.co': 0.88,
        'cnbcindonesia.com': 0.87,
        'detik.com': 0.85,
        'unknown': 0.50
    });

    /**
     * Calculates credibility and freshness score for a news item
     * @param {Object} article
     * @returns {{ compositeScore: number, domainScore: number, freshnessScore: number, isReliable: boolean }}
     */
    static evaluateArticle(article = {}) {
        const domain = (article.domain || '').toLowerCase();
        const domainScore = this.DOMAIN_CREDIBILITY[domain] || 0.65;

        // Freshness: exponential decay with half-life ~ 36 hours
        const ageHours = Math.max(0, (Date.now() - (article.publishedAt || Date.now())) / 3600000);
        const freshnessScore = Math.exp(-ageHours / 36);

        // Composite: 65% domain credibility + 35% freshness
        const compositeScore = Number(((domainScore * 0.65) + (freshnessScore * 0.35)).toFixed(3));

        return {
            compositeScore,
            domainScore,
            freshnessScore: Number(freshnessScore.toFixed(3)),
            isReliable: compositeScore >= 0.70
        };
    }

    /**
     * Ranks multiple articles and sorts them by composite reliability
     * @param {Object[]} articles
     * @returns {Object[]} Ranked articles
     */
    static rankArticles(articles = []) {
        return articles
            .map(art => ({
                ...art,
                ranking: this.evaluateArticle(art)
            }))
            .sort((a, b) => b.ranking.compositeScore - a.ranking.compositeScore);
    }
}
