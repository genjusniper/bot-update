// src/core/whatsapp/WhatsAppSessionGuardian.mjs
// Realtime WhatsApp Session Guardian
// Disconnect code triage (401, 428, 515), socket flapping damper, and session state tracking

export const SessionStatus = Object.freeze({
    DISCONNECTED: 'DISCONNECTED',
    CONNECTING: 'CONNECTING',
    CONNECTED: 'CONNECTED',
    BACKOFF_PAUSED: 'BACKOFF_PAUSED',
    LOGGED_OUT: 'LOGGED_OUT'
});

export class WhatsAppSessionGuardian {
    constructor(options = {}) {
        this.maxFlapsPerMinute = options.maxFlapsPerMinute || 5;
        this.flappingCooldownMs = options.flappingCooldownMs || 30000;

        this.status = SessionStatus.DISCONNECTED;
        this.reconnectHistory = []; // Timestamps of reconnections
        this.lastConnectedAt = null;
        this.lastDisconnectReason = null;
        this.isFlapping = false;
    }

    /**
     * Evaluates Baileys disconnect status code and determines remediation strategy
     * @param {number} statusCode HTTP/Baileys disconnect status code
     * @param {boolean} [shouldReconnect=true]
     * @returns {{ action: string, backoffMs: number, reason: string }}
     */
    handleDisconnect(statusCode, shouldReconnect = true) {
        const now = Date.now();
        this.lastDisconnectReason = `STATUS_${statusCode}`;

        // Clean up flap history older than 60 seconds
        this.reconnectHistory = this.reconnectHistory.filter(t => now - t < 60000);
        this.reconnectHistory.push(now);

        // Flapping loop guard
        if (this.reconnectHistory.length > this.maxFlapsPerMinute) {
            this.status = SessionStatus.BACKOFF_PAUSED;
            this.isFlapping = true;
            return {
                action: 'BACKOFF_PAUSE',
                backoffMs: this.flappingCooldownMs,
                reason: 'FLAPPING_LOOP_DETECTED: Exceeded 5 reconnects/min. Pausing socket to prevent WhatsApp shadow-ban.'
            };
        }

        this.status = SessionStatus.DISCONNECTED;

        // Specific disconnect code triage
        switch (statusCode) {
            case 401: // Logged out
            case 403: // Forbidden
                this.status = SessionStatus.LOGGED_OUT;
                return {
                    action: 'PURGE_AND_QR',
                    backoffMs: 2000,
                    reason: 'SESSION_LOGGED_OUT: Credentials invalidated. Needs new QR scan.'
                };

            case 428: // Precondition Required / Session Conflict
                return {
                    action: 'RECONNECT',
                    backoffMs: 3000,
                    reason: 'SESSION_CONFLICT_428: Another session was active. Jittered soft reconnect.'
                };

            case 515: // Stream restart required
                return {
                    action: 'CLEAN_RESTART',
                    backoffMs: 1500,
                    reason: 'STREAM_RESTART_515: Baileys stream requires clean cycle.'
                };

            case 503: // Service Unavailable
                return {
                    action: 'RECONNECT',
                    backoffMs: 5000,
                    reason: 'SERVICE_UNAVAILABLE_503: WhatsApp servers temporarily busy.'
                };

            default:
                return {
                    action: shouldReconnect ? 'RECONNECT' : 'STOP',
                    backoffMs: 2500,
                    reason: `DISCONNECTED_CODE_${statusCode}: Standard reconnect loop.`
                };
        }
    }

    /**
     * Marks session as successfully established
     */
    recordSuccessfulConnection() {
        this.status = SessionStatus.CONNECTED;
        this.lastConnectedAt = Date.now();
        this.isFlapping = false;
        this.reconnectHistory = [];
    }

    /**
     * Returns live session diagnostics
     */
    getSessionStatus() {
        return {
            status: this.status,
            flapsInLastMinute: this.reconnectHistory.length,
            isFlapping: this.isFlapping,
            lastConnectedAt: this.lastConnectedAt,
            lastDisconnectReason: this.lastDisconnectReason
        };
    }

    reset() {
        this.status = SessionStatus.DISCONNECTED;
        this.reconnectHistory = [];
        this.isFlapping = false;
    }
}

export const whatsAppSessionGuardian = new WhatsAppSessionGuardian();
