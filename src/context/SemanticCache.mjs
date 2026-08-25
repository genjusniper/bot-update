// src/context/SemanticCache.mjs

export class SemanticCache {
    static cache = new Map();
    static hitCount = 0;
    static missCount = 0;

    static get(normalizedKey) {
        const entry = this.cache.get(normalizedKey.toLowerCase().trim());
        if (entry && (Date.now() - entry.timestamp < 3600000)) { // 1 hour TTL
            this.hitCount++;
            return entry.response;
        }
        this.missCount++;
        return null;
    }

    static set(normalizedKey, response) {
        this.cache.set(normalizedKey.toLowerCase().trim(), {
            response,
            timestamp: Date.now()
        });
        // Prune cache size if > 200
        if (this.cache.size > 200) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    static getStats() {
        const total = this.hitCount + this.missCount;
        const hitRate = total === 0 ? 0 : Math.round((this.hitCount / total) * 100);
        return {
            size: this.cache.size,
            hitCount: this.hitCount,
            missCount: this.missCount,
            hitRatePercent: hitRate
        };
    }
}
