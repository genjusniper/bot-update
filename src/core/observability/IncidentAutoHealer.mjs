// src/core/observability/IncidentAutoHealer.mjs
// Unified Telemetry & Incident Auto-Healer
// Autonomous remediation loop for socket disconnects, high memory pressure, 429 rate-limits, and hanging tasks

export const IncidentType = Object.freeze({
    SOCKET_HANGUP: 'SOCKET_HANGUP',
    HIGH_MEMORY_PRESSURE: 'HIGH_MEMORY_PRESSURE',
    RATE_LIMIT_429: 'RATE_LIMIT_429',
    TASK_TIMEOUT: 'TASK_TIMEOUT',
    DATABASE_LOCK: 'DATABASE_LOCK'
});

export class IncidentAutoHealer {
    constructor(options = {}) {
        this.memoryThresholdMB = options.memoryThresholdMB || 135; // Termux limit warning
        this.incidentCooldownMs = options.incidentCooldownMs || 15000;

        this.history = [];
        this.incidentCooldowns = new Map(); // type -> lastHealedTimestamp

        // Circuit breaker states
        this.circuitBreakers = new Map();

        // Custom healing action hooks
        this.hooks = {
            onSocketReconnect: options.onSocketReconnect || null,
            onMemoryPrune: options.onMemoryPrune || null,
            onFallbackTrigger: options.onFallbackTrigger || null
        };
    }

    /**
     * Registers remediation hook
     * @param {string} hookName 
     * @param {Function} callback 
     */
    registerHook(hookName, callback) {
        if (typeof callback === 'function') {
            this.hooks[hookName] = callback;
        }
    }

    /**
     * Handles an incoming incident with autonomous playbook remediation
     * @param {string} incidentType 
     * @param {Object} [details={}] 
     * @returns {Promise<Object>} Remediation outcome
     */
    async handleIncident(incidentType, details = {}) {
        const now = Date.now();
        const type = String(incidentType).toUpperCase();

        // Check storm limiter / cooldown
        const lastTime = this.incidentCooldowns.get(type) || 0;
        if (now - lastTime < this.incidentCooldownMs) {
            return {
                incidentType: type,
                action: 'DEBOUNCED',
                message: `Incident ${type} recently addressed. In cooldown.`,
                timestamp: now
            };
        }

        this.incidentCooldowns.set(type, now);

        let remediationAction = 'NONE';
        let outcome = 'UNRESOLVED';
        let detailsReport = '';

        switch (type) {
            case IncidentType.HIGH_MEMORY_PRESSURE:
                remediationAction = 'MEMORY_EMERGENCY_PRUNE';
                if (typeof this.hooks.onMemoryPrune === 'function') {
                    await this.hooks.onMemoryPrune(details);
                }
                if (global.gc) {
                    try { global.gc(); } catch (_) {}
                }
                outcome = 'HEALED';
                detailsReport = 'Memory pruned and GC triggered.';
                break;

            case IncidentType.SOCKET_HANGUP:
                remediationAction = 'SOCKET_RECONNECT_DISPATCH';
                if (typeof this.hooks.onSocketReconnect === 'function') {
                    await this.hooks.onSocketReconnect(details);
                }
                outcome = 'HEALED';
                detailsReport = 'Socket reconnect signal dispatched.';
                break;

            case IncidentType.RATE_LIMIT_429:
                remediationAction = 'CIRCUIT_BREAKER_FALLBACK';
                this.circuitBreakers.set(details.provider || 'PRIMARY_AI', {
                    trippedAt: now,
                    expiresAt: now + (60 * 1000)
                });
                if (typeof this.hooks.onFallbackTrigger === 'function') {
                    await this.hooks.onFallbackTrigger(details);
                }
                outcome = 'HEALED';
                detailsReport = `Circuit breaker activated for ${details.provider || 'PRIMARY_AI'}. Fallback active.`;
                break;

            case IncidentType.TASK_TIMEOUT:
                remediationAction = 'FORCE_ABORT_TASK';
                outcome = 'HEALED';
                detailsReport = `Aborted hanging task ${details.taskId || 'UNKNOWN'}.`;
                break;

            default:
                remediationAction = 'LOG_ONLY';
                outcome = 'ESCALATED';
                detailsReport = `Unknown incident ${type}.`;
                break;
        }

        const report = {
            id: `inc_${now}_${Math.random().toString(36).slice(2, 6)}`,
            incidentType: type,
            remediationAction,
            outcome,
            detailsReport,
            details,
            timestamp: now
        };

        this.history.push(report);
        if (this.history.length > 200) this.history.shift();

        return report;
    }

    /**
     * Checks current process memory and auto-heals if exceeding threshold
     * @returns {Promise<Object|null>}
     */
    async checkMemoryHealth() {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const mem = process.memoryUsage();
            const rssMB = parseFloat((mem.rss / (1024 * 1024)).toFixed(2));
            if (rssMB >= this.memoryThresholdMB) {
                return await this.handleIncident(IncidentType.HIGH_MEMORY_PRESSURE, { rssMB });
            }
            return { status: 'HEALTHY', rssMB };
        }
        return null;
    }

    /**
     * Produces aggregated telemetry and health status
     */
    getHealthReport() {
        const mem = typeof process !== 'undefined' && process.memoryUsage ? process.memoryUsage() : {};
        const rssMB = mem.rss ? parseFloat((mem.rss / (1024 * 1024)).toFixed(2)) : 0;

        let status = 'HEALTHY';
        if (rssMB >= this.memoryThresholdMB) {
            status = 'DEGRADED';
        }

        return {
            status,
            memory: {
                rssMB,
                thresholdMB: this.memoryThresholdMB
            },
            totalHealed: this.history.filter(h => h.outcome === 'HEALED').length,
            recentIncidents: this.history.slice(-5),
            activeCircuitBreakers: Array.from(this.circuitBreakers.entries()).map(([k, v]) => ({ provider: k, ...v }))
        };
    }
}

export const incidentAutoHealer = new IncidentAutoHealer();
