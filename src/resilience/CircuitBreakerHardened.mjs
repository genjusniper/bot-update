// src/resilience/CircuitBreakerHardened.mjs
// Self-Healing Circuit Breaker with TTL & Half-Open Probing

export class CircuitBreakerHardened {
    constructor(threshold = 3, resetTimeoutMs = 15000) {
        this.circuits = new Map(); // modelName -> { state, failures, lastStateChange }
        this.threshold = threshold;
        this.resetTimeoutMs = resetTimeoutMs;
    }

    getCircuit(modelName) {
        if (!this.circuits.has(modelName)) {
            this.circuits.set(modelName, {
                state: 'CLOSED',
                failures: 0,
                lastStateChange: Date.now()
            });
        }
        return this.circuits.get(modelName);
    }

    canExecute(modelName) {
        const c = this.getCircuit(modelName);
        const now = Date.now();

        if (c.state === 'OPEN') {
            // Auto-heal transition: If resetTimeout has elapsed, enter HALF_OPEN probe mode
            if (now - c.lastStateChange >= this.resetTimeoutMs) {
                c.state = 'HALF_OPEN';
                c.lastStateChange = now;
                console.log(`[CircuitBreaker] 🟡 ${modelName} transitioned from OPEN to HALF_OPEN (probing).`);
                return true;
            }
            return false;
        }

        return true;
    }

    recordSuccess(modelName) {
        const c = this.getCircuit(modelName);
        if (c.state !== 'CLOSED') {
            console.log(`[CircuitBreaker] 🟢 ${modelName} healed and transitioned to CLOSED.`);
        }
        c.state = 'CLOSED';
        c.failures = 0;
        c.lastStateChange = Date.now();
    }

    recordFailure(modelName) {
        const c = this.getCircuit(modelName);
        c.failures++;
        c.lastStateChange = Date.now();

        if (c.state === 'HALF_OPEN' || c.failures >= this.threshold) {
            c.state = 'OPEN';
            console.warn(`[CircuitBreaker] 🔴 ${modelName} tripped to OPEN (failures: ${c.failures}). Cooldown: ${this.resetTimeoutMs}ms`);
        }
    }
}
