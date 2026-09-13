/**
 * AgentCircuitBreaker.mjs
 * 
 * Safety circuit breaker for autonomous agent loops.
 * Protects against runaway recursion, infinite tool call loops, and Denial of Wallet (OWASP).
 */

export class AgentCircuitBreaker {
    constructor(options = {}) {
        this.limits = {
            maxSteps: options.maxSteps || 10,
            maxToolCalls: options.maxToolCalls || 15,
            maxRetries: options.maxRetries || 3,
            maxCostRp: options.maxCostRp || 50000,
            maxRuntimeMs: options.maxRuntimeMs || 30000
        };

        this.state = {
            steps: 0,
            toolCalls: 0,
            retries: 0,
            costRp: 0,
            startTime: Date.now(),
            tripped: false,
            tripReason: null
        };
    }

    /**
     * Track a step or tool call and check thresholds
     */
    tick({ step = 0, toolCall = 0, retry = 0, costRp = 0 } = {}) {
        if (this.state.tripped) {
            return { allowed: false, tripped: true, reason: this.state.tripReason };
        }

        this.state.steps += step;
        this.state.toolCalls += toolCall;
        this.state.retries += retry;
        this.state.costRp += costRp;

        const runtimeMs = Date.now() - this.state.startTime;

        if (this.state.steps > this.limits.maxSteps) {
            return this._trip('MAX_STEPS_EXCEEDED');
        }
        if (this.state.toolCalls > this.limits.maxToolCalls) {
            return this._trip('MAX_TOOL_CALLS_EXCEEDED');
        }
        if (this.state.retries > this.limits.maxRetries) {
            return this._trip('MAX_RETRIES_EXCEEDED');
        }
        if (this.state.costRp > this.limits.maxCostRp) {
            return this._trip('MAX_COST_EXCEEDED');
        }
        if (runtimeMs > this.limits.maxRuntimeMs) {
            return this._trip('MAX_RUNTIME_EXCEEDED');
        }

        return {
            allowed: true,
            current: { ...this.state, runtimeMs }
        };
    }

    _trip(reason) {
        this.state.tripped = true;
        this.state.tripReason = reason;
        return {
            allowed: false,
            tripped: true,
            reason: `CIRCUIT_BREAKER_TRIPPED: ${reason}. Execution halted automatically to prevent runaway loop / financial blowup.`
        };
    }

    reset() {
        this.state.steps = 0;
        this.state.toolCalls = 0;
        this.state.retries = 0;
        this.state.costRp = 0;
        this.state.startTime = Date.now();
        this.state.tripped = false;
        this.state.tripReason = null;
    }
}
