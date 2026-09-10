// src/core/resilience/ProviderCircuitBreaker.mjs
// Resilient multi-provider circuit breaker failing over seamlessly between Gemini and Groq

import { QuotaStateTracker } from './QuotaStateTracker.mjs';

export class ProviderCircuitBreaker {
    static PROVIDER_ORDER = ['GEMINI', 'GROQ', 'LOCAL'];

    /**
     * Selects the best operational provider for the current request
     * @returns {string} Selected provider name
     */
    static selectProvider() {
        for (const provider of this.PROVIDER_ORDER) {
            if (QuotaStateTracker.isAvailable(provider)) {
                return provider;
            }
        }
        // If all exhausted, fallback to LOCAL minimal responder
        return 'LOCAL';
    }

    /**
     * Executes an AI request with automatic fallback and circuit breaking
     * @param {Function} executionFn - Async function taking (provider)
     * @returns {Promise<*>}
     */
    static async execute(executionFn) {
        let lastError = null;
        for (const provider of this.PROVIDER_ORDER) {
            if (!QuotaStateTracker.isAvailable(provider)) {
                continue;
            }

            try {
                QuotaStateTracker.recordCall(provider);
                const result = await executionFn(provider);
                return { success: true, providerUsed: provider, result };
            } catch (err) {
                lastError = err;
                const isQuota = /429|quota|rate limit|resource exhausted/i.test(err.message || '');
                if (isQuota) {
                    QuotaStateTracker.recordExhaustion(provider, 60000);
                }
            }
        }

        return {
            success: false,
            providerUsed: 'NONE',
            error: lastError ? lastError.message : 'All providers exhausted'
        };
    }
}
