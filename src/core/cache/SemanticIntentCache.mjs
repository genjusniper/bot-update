// src/core/cache/SemanticIntentCache.mjs
// Semantic Cache & Fuzzy Intent Matcher
// Near-instant (<10ms) zero-token retrieval for recurrent queries with Levenshtein-Jaccard fuzzy matching and LRU bounds

export class SemanticIntentCache {
    constructor(options = {}) {
        this.maxEntries = options.maxEntries || 500;
        this.defaultSimilarityThreshold = options.defaultSimilarityThreshold || 0.82;
        this.defaultTtlMs = options.defaultTtlMs || 60 * 60 * 1000; // 1 hour

        // Map: key -> { query, response, intent, category, createdAt, expiresAt, hits }
        this.cache = new Map();

        this.stats = {
            hits: 0,
            misses: 0
        };

        this.accessSeq = 0;

        this.stopwords = new Set([
            'dan', 'atau', 'pada', 'secara', 'yang', 'di', 'ke', 'dari', 'ini', 'itu',
            'the', 'is', 'at', 'which', 'on', 'a', 'an', 'in', 'to', 'for', 'of', 'with'
        ]);
    }

    /**
     * Tokenizes text into normalized non-stopword set
     * @param {string} text 
     * @returns {Set<string>}
     */
    tokenize(text = '') {
        const words = String(text)
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 1 && !this.stopwords.has(w));
        return new Set(words);
    }

    /**
     * Computes Jaccard similarity between two token sets
     * @param {Set<string>} setA 
     * @param {Set<string>} setB 
     * @returns {number}
     */
    computeJaccard(setA, setB) {
        if (setA.size === 0 && setB.size === 0) return 1.0;
        if (setA.size === 0 || setB.size === 0) return 0.0;

        let intersection = 0;
        for (const elem of setA) {
            if (setB.has(elem)) intersection++;
        }
        const union = setA.size + setB.size - intersection;
        return union === 0 ? 0.0 : intersection / union;
    }

    /**
     * Computes Normalized Levenshtein similarity [0.0 - 1.0]
     * @param {string} s1 
     * @param {string} s2 
     * @returns {number}
     */
    computeLevenshtein(s1 = '', s2 = '') {
        const a = s1.toLowerCase().trim();
        const b = s2.toLowerCase().trim();
        if (a === b) return 1.0;
        if (!a || !b) return 0.0;

        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }

        const distance = matrix[b.length][a.length];
        const maxLen = Math.max(a.length, b.length);
        return parseFloat((1 - (distance / maxLen)).toFixed(3));
    }

    /**
     * Blended semantic similarity (Jaccard token overlap + Levenshtein fuzzy string match)
     * @param {string} q1 
     * @param {string} q2 
     * @returns {number}
     */
    calculateSimilarity(q1, q2) {
        const lev = this.computeLevenshtein(q1, q2);
        // If string is identical or typo near-identical
        if (lev >= 0.90) return lev;

        const tokensA = this.tokenize(q1);
        const tokensB = this.tokenize(q2);
        const jaccard = this.computeJaccard(tokensA, tokensB);

        // Blended score (60% Jaccard + 40% Levenshtein)
        return parseFloat((0.6 * jaccard + 0.4 * lev).toFixed(3));
    }

    /**
     * Retrieves response from semantic cache if similar entry exists and not expired
     * @param {string} query 
     * @param {Object} [options={}] 
     * @returns {{ hit: boolean, response?: any, similarity?: number, query?: string }}
     */
    get(query = '', options = {}) {
        if (!query || typeof query !== 'string') {
            return { hit: false };
        }

        const now = Date.now();
        const threshold = options.threshold || this.defaultSimilarityThreshold;

        let bestMatch = null;
        let highestSim = -1;

        for (const [key, entry] of this.cache) {
            // Check TTL expiration
            if (entry.expiresAt && now > entry.expiresAt) {
                this.cache.delete(key);
                continue;
            }

            // Optional category filter
            if (options.category && entry.category !== options.category) {
                continue;
            }

            const sim = this.calculateSimilarity(query, entry.query);
            if (sim > highestSim) {
                highestSim = sim;
                bestMatch = entry;
            }
        }

        if (bestMatch && highestSim >= threshold) {
            this.stats.hits++;
            bestMatch.hits = (bestMatch.hits || 0) + 1;
            bestMatch.lastAccessedAt = now;
            bestMatch.lastAccessedSeq = ++this.accessSeq;
            return {
                hit: true,
                response: bestMatch.response,
                similarity: highestSim,
                cachedQuery: bestMatch.query,
                intent: bestMatch.intent
            };
        }

        this.stats.misses++;
        return { hit: false };
    }

    /**
     * Stores query-response pair in semantic cache
     * @param {string} query 
     * @param {any} response 
     * @param {Object} [options={}] 
     */
    set(query = '', response, options = {}) {
        if (!query || response === undefined) return;

        const now = Date.now();
        const ttl = options.ttlMs || this.defaultTtlMs;
        const key = query.toLowerCase().trim();

        // Evict LRU entry if at capacity
        if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
            let oldestKey = null;
            let oldestAccess = Infinity;
            for (const [k, v] of this.cache) {
                const accessed = v.lastAccessedSeq || 0;
                if (accessed < oldestAccess) {
                    oldestAccess = accessed;
                    oldestKey = k;
                }
            }
            if (oldestKey) this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            query,
            response,
            intent: options.intent || 'GENERAL',
            category: options.category || 'DEFAULT',
            createdAt: now,
            lastAccessedAt: now,
            lastAccessedSeq: ++this.accessSeq,
            expiresAt: ttl ? now + ttl : null,
            hits: 0
        });
    }

    /**
     * Invalidates entries by category or pattern
     * @param {string|RegExp} criteria 
     * @returns {number} Number of purged entries
     */
    invalidate(criteria) {
        let purged = 0;
        for (const [key, entry] of this.cache) {
            let match = false;
            if (typeof criteria === 'string') {
                match = entry.category === criteria || key.includes(criteria.toLowerCase());
            } else if (criteria instanceof RegExp) {
                match = criteria.test(entry.query);
            }
            if (match) {
                this.cache.delete(key);
                purged++;
            }
        }
        return purged;
    }

    /**
     * Returns cache performance telemetry
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total === 0 ? 0.0 : parseFloat((this.stats.hits / total).toFixed(3));
        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            totalQueries: total,
            hitRate,
            currentSize: this.cache.size
        };
    }

    clear() {
        this.cache.clear();
        this.stats.hits = 0;
        this.stats.misses = 0;
    }
}

export const semanticIntentCache = new SemanticIntentCache();
