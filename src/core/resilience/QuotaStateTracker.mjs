// src/core/resilience/QuotaStateTracker.mjs
// Real-time tracking of AI provider quotas, token limits, and cooldowns

export class QuotaStateTracker {
    static #providers = {
        GEMINI: { calls: 0, errors: 0, exhaustedUntil: 0, status: 'HEALTHY' },
        GROQ: { calls: 0, errors: 0, exhaustedUntil: 0, status: 'HEALTHY' },
        LOCAL: { calls: 0, errors: 0, exhaustedUntil: 0, status: 'STANDBY' }
    };

    /**
     * Records an API call attempt
     */
    static recordCall(provider = 'GEMINI') {
        const key = provider.toUpperCase();
        if (this.#providers[key]) {
            this.#providers[key].calls++;
        }
    }

    /**
     * Records a quota exhaustion event (e.g. HTTP 429)
     */
    static recordExhaustion(provider = 'GEMINI', cooldownMs = 60000) {
        const key = provider.toUpperCase();
        if (this.#providers[key]) {
            this.#providers[key].errors++;
            this.#providers[key].exhaustedUntil = Date.now() + cooldownMs;
            this.#providers[key].status = 'EXHAUSTED';
        }
    }

    /**
     * Checks if provider is available
     */
    static isAvailable(provider = 'GEMINI') {
        const key = provider.toUpperCase();
        const p = this.#providers[key];
        if (!p) return false;

        if (p.status === 'EXHAUSTED') {
            if (Date.now() > p.exhaustedUntil) {
                p.status = 'HEALTHY';
                return true;
            }
            return false;
        }
        return true;
    }

    static getStatus() {
        return { ...this.#providers };
    }
}
