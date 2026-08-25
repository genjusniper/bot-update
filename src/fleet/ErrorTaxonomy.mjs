// src/fleet/ErrorTaxonomy.mjs
// V13.7 — Fixed: 404 now SWITCH_MODEL (not ABORT), 401 with service account = QUARANTINE_KEY
// Enhanced: cleaner action names and better coverage

export class ErrorTaxonomy {
    static classify(statusCode, errorPayload) {
        const msg = (errorPayload?.message || '').toLowerCase();
        const code = Number(statusCode) || 0;

        // 400 Bad Request: Only abort if truly malformed payload (not model issues)
        if (code === 400 && (msg.includes('invalid') || msg.includes('oneof') || msg.includes('malformed') || msg.includes('bad request'))) {
            return {
                category: 'BAD_REQUEST',
                action: 'ABORT_NO_ROTATION',
                retryable: false,
                reason: 'Request payload is malformed.'
            };
        }

        // 401 / 403: Key invalid or service account deleted → quarantine
        if (code === 401 || code === 403 || msg.includes('api key not valid') || msg.includes('permission denied') || msg.includes('account_state_invalid')) {
            return {
                category: 'AUTH_FAILURE',
                action: 'QUARANTINE_KEY',
                retryable: true,
                reason: 'API Key revoked, expired, or service account disabled.'
            };
        }

        // 404: Model endpoint does not exist → switch model, keep key healthy
        if (code === 404 || msg.includes('not found') || msg.includes('no longer available') || msg.includes('deprecated')) {
            return {
                category: 'ENDPOINT_DEPRECATED',
                action: 'SWITCH_MODEL',   // Do NOT quarantine the key — rotate model only
                retryable: true,
                reason: 'Model version deprecated or endpoint not found.'
            };
        }

        // 429 / Resource exhausted: Rate limited → cooldown key, rotate
        if (code === 429 || msg.includes('quota') || msg.includes('rate limit') || msg.includes('resource_exhausted')) {
            return {
                category: 'RATE_LIMIT',
                action: 'COOLDOWN_KEY',
                retryable: true,
                cooldownMs: 30000,   // 30s cooldown per key
                reason: 'Free tier RPM/RPD limit reached on this key.'
            };
        }

        // 503 / 500: Google server overloaded → switch model + short backoff
        if (code === 503 || code === 500 || msg.includes('high demand') || msg.includes('overload') || msg.includes('unavailable') || msg.includes('internal')) {
            return {
                category: 'PROVIDER_OVERLOAD',
                action: 'SWITCH_MODEL_AND_BACKOFF',
                retryable: true,
                reason: 'Google server demand spike or internal error.'
            };
        }

        // 408 / Timeout
        if (code === 408 || msg.includes('timeout') || msg.includes('aborted')) {
            return {
                category: 'TIMEOUT',
                action: 'RETRY_ONCE',
                retryable: true,
                reason: 'Request timed out.'
            };
        }

        // Default: generic retryable
        return {
            category: 'GENERIC_SERVER_ERROR',
            action: 'RETRY_WITH_BACKOFF',
            retryable: true,
            reason: 'Temporary network or server hiccup.'
        };
    }
}
