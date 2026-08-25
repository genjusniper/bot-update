// src/fleet/ErrorTaxonomy.mjs
// Error Taxonomy & Failure Strategy Dispatcher

export class ErrorTaxonomy {
    static classify(statusCode, errorPayload) {
        const msg = (errorPayload?.message || '').toLowerCase();
        const code = Number(statusCode) || 0;

        if (code === 400 || msg.includes('invalid') || msg.includes('oneof') || msg.includes('malformed')) {
            return {
                category: 'BAD_REQUEST',
                action: 'ABORT_NO_ROTATION',
                retryable: false,
                reason: 'Request payload is malformed. Do not rotate keys pointlessly.'
            };
        }

        if (code === 401 || code === 403 || msg.includes('api key not valid') || msg.includes('permission denied')) {
            return {
                category: 'AUTH_FAILURE',
                action: 'QUARANTINE_KEY',
                retryable: true,
                reason: 'API Key revoked or invalid permissions.'
            };
        }

        if (code === 404 || msg.includes('not found') || msg.includes('no longer available')) {
            return {
                category: 'ENDPOINT_DEPRECATED',
                action: 'SWITCH_MODEL',
                retryable: true,
                reason: 'Model version deprecated.'
            };
        }

        if (code === 429 || msg.includes('quota') || msg.includes('rate limit') || msg.includes('resource_exhausted')) {
            return {
                category: 'RATE_LIMIT',
                action: 'COOLDOWN_KEY',
                retryable: true,
                cooldownMs: 25000,
                reason: 'Free tier RPM/RPD limit reached on this key.'
            };
        }

        if (code === 503 || msg.includes('high demand') || msg.includes('overload') || msg.includes('unavailable')) {
            return {
                category: 'PROVIDER_OVERLOAD',
                action: 'SWITCH_MODEL_AND_BACKOFF',
                retryable: true,
                reason: 'Google server demand spike.'
            };
        }

        if (code === 408 || msg.includes('timeout') || msg.includes('aborted')) {
            return {
                category: 'TIMEOUT',
                action: 'RETRY_ONCE',
                retryable: true,
                reason: 'Request timed out.'
            };
        }

        return {
            category: 'GENERIC_SERVER_ERROR',
            action: 'RETRY_WITH_BACKOFF',
            retryable: true,
            reason: 'Temporary network or server hiccup.'
        };
    }
}
