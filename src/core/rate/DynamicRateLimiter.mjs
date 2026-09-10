// src/core/rate/DynamicRateLimiter.mjs
// Dynamic Rate Limiter & Token Throttling
// Adaptive token bucket with backpressure throttling, tiered limits (Owner, VIP, Normal, Group), and memory-pressure contraction

export const RateTier = Object.freeze({
    OWNER: 'OWNER',
    VIP: 'VIP',
    NORMAL: 'NORMAL',
    GROUP: 'GROUP'
});

export class DynamicRateLimiter {
    constructor(options = {}) {
        const defaultTiers = {
            OWNER: { capacity: 120, refillRatePerSec: 2.0, maxTokensPerMin: 200000 },
            VIP: { capacity: 30, refillRatePerSec: 0.5, maxTokensPerMin: 50000 },
            NORMAL: { capacity: 10, refillRatePerSec: 0.166, maxTokensPerMin: 15000 },
            GROUP: { capacity: 15, refillRatePerSec: 0.25, maxTokensPerMin: 25000 }
        };
        this.tierConfigs = Object.freeze(options.tiers ? { ...defaultTiers, ...options.tiers } : defaultTiers);

        // Map: key -> { tokens, lastRefill, tokenUsageThisMinute, minuteStart }
        this.buckets = new Map();
    }

    /**
     * Resolves bucket state for key
     * @private
     */
    getBucket(key, tier = RateTier.NORMAL) {
        const normKey = String(key).toLowerCase();
        let bucket = this.buckets.get(normKey);
        const config = this.tierConfigs[tier] || this.tierConfigs.NORMAL;
        const now = Date.now();

        if (!bucket) {
            bucket = {
                tokens: config.capacity,
                lastRefill: now,
                tokenUsageThisMinute: 0,
                minuteStart: now
            };
            this.buckets.set(normKey, bucket);
        }

        // Refill tokens based on elapsed time
        const elapsedSec = (now - bucket.lastRefill) / 1000;
        bucket.tokens = Math.min(config.capacity, bucket.tokens + (elapsedSec * config.refillRatePerSec));
        bucket.lastRefill = now;

        // Reset minute sliding window if > 60s
        if (now - bucket.minuteStart >= 60000) {
            bucket.tokenUsageThisMinute = 0;
            bucket.minuteStart = now;
        }

        return { bucket, config };
    }

    /**
     * Consumes rate quota and token budget
     * @param {string} key Unique identifier (e.g. userId or groupJid)
     * @param {Object} [options={}]
     * @param {number} [options.cost=1] Request cost in requests (default 1)
     * @param {number} [options.tokens=0] AI tokens requested/spent
     * @param {string} [options.tier=RateTier.NORMAL]
     * @param {boolean} [options.systemPressure=false] If true, contracts limits by 50%
     * @returns {{ allowed: boolean, remainingTokens: number, reason?: string }}
     */
    consume(key, options = {}) {
        if (!key) return { allowed: true, remainingTokens: 999 };

        const tier = (typeof options === 'string' ? options : options?.tier) || RateTier.NORMAL;
        const cost = (typeof options === 'object' && options?.cost) || 1;
        const requestedTokens = (typeof options === 'object' && options?.tokens) || 0;
        const underPressure = Boolean(typeof options === 'object' && options?.systemPressure);

        const { bucket, config } = this.getBucket(key, tier);

        // Dynamic contraction under system memory pressure
        const effectiveCapacity = underPressure ? Math.max(1, Math.floor(config.capacity * 0.5)) : config.capacity;
        const effectiveMaxTokens = underPressure ? Math.max(1000, Math.floor(config.maxTokensPerMin * 0.5)) : config.maxTokensPerMin;

        // Enforce capacity contraction on active bucket
        if (underPressure && bucket.tokens > effectiveCapacity) {
            bucket.tokens = effectiveCapacity;
        }

        // 1. Check Request Rate Bucket
        if (bucket.tokens < cost) {
            return {
                allowed: false,
                remainingTokens: Math.max(0, parseFloat(bucket.tokens.toFixed(1))),
                reason: `RATE_LIMIT_EXCEEDED: Kecepatan pesan terlalu tinggi. Tunggu beberapa detik.`
            };
        }

        // 2. Check Token Usage Ceiling
        if ((bucket.tokenUsageThisMinute + requestedTokens) > effectiveMaxTokens) {
            return {
                allowed: false,
                remainingTokens: Math.max(0, parseFloat(bucket.tokens.toFixed(1))),
                reason: `TOKEN_QUOTA_EXCEEDED: Kuota token menit ini habis. Coba lagi dalam 1 menit.`
            };
        }

        // Deduct
        bucket.tokens -= cost;
        bucket.tokenUsageThisMinute += requestedTokens;

        return {
            allowed: true,
            remainingTokens: Math.max(0, parseFloat(bucket.tokens.toFixed(1))),
            tokensUsedThisMinute: bucket.tokenUsageThisMinute
        };
    }

    /**
     * Resets rate limit for a specific key
     * @param {string} key 
     */
    reset(key) {
        if (key) {
            this.buckets.delete(String(key).toLowerCase());
        }
    }

    clear() {
        this.buckets.clear();
    }
}

export const dynamicRateLimiter = new DynamicRateLimiter();
