// src/fleet/ErrorClassifier.mjs

export class ErrorClassifier {
    static classify(status, errorObj) {
        const msg = (errorObj?.message || '').toLowerCase();
        
        // 1. Invalid Payload / Bad Request (400)
        if (status === 400 || msg.includes('invalid') || msg.includes('not supported') || msg.includes('no longer available')) {
            return {
                type: 'INVALID_PAYLOAD',
                action: 'STOP',
                retryable: false,
                reason: 'Payload or model parameter is invalid. Do not rotate keys pointlessly.'
            };
        }

        // 2. Authentication / Permission (401 / 403)
        if (status === 401 || status === 403 || msg.includes('api key not valid') || msg.includes('permission denied')) {
            return {
                type: 'AUTH_FAILURE',
                action: 'QUARANTINE_KEY',
                retryable: true,
                reason: 'API key is invalid or revoked. Quarantine this key.'
            };
        }

        // 3. Model Not Found (404)
        if (status === 404 || msg.includes('not found')) {
            return {
                type: 'MODEL_NOT_FOUND',
                action: 'ROTATE_MODEL',
                retryable: true,
                reason: 'Model endpoint deprecated or missing. Switch model.'
            };
        }

        // 4. Rate Limit / Quota Exceeded (429)
        if (status === 429 || msg.includes('quota') || msg.includes('rate limit') || msg.includes('resource_exhausted')) {
            return {
                type: 'RATE_LIMITED',
                action: 'COOLDOWN_KEY',
                retryable: true,
                cooldownMs: 45000,
                reason: 'Free tier RPM/RPD hit. Put key on cooldown.'
            };
        }

        // 5. Server Error / Network Timeout (5xx / Timeout)
        if (status >= 500 || msg.includes('econnreset') || msg.includes('timeout') || msg.includes('network')) {
            return {
                type: 'TRANSIENT_NETWORK',
                action: 'RETRY_WITH_BACKOFF',
                retryable: true,
                reason: 'Temporary network/server glitch.'
            };
        }

        return {
            type: 'UNKNOWN_ERROR',
            action: 'RETRY',
            retryable: true,
            reason: 'Unrecognized error.'
        };
    }
}
