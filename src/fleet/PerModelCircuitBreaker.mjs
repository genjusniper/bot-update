// src/fleet/PerModelCircuitBreaker.mjs
// Per-Model Circuit Breaker to track individual model endpoints independently

export class PerModelCircuitBreaker {
    constructor(threshold = 4, resetTimeoutMs = 15000) {
        this.circuits = new Map();
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
            if (now - c.lastStateChange >= this.resetTimeoutMs) {
                c.state = 'HALF_OPEN';
                c.lastStateChange = now;
                return true;
            }
            return false;
        }
        return true;
    }

    recordSuccess(modelName) {
        const c = this.getCircuit(modelName);
        c.state = 'CLOSED';
        c.failures = 0;
    }

    recordFailure(modelName) {
        const c = this.getCircuit(modelName);
        c.failures++;
        if (c.failures >= this.threshold && c.state !== 'OPEN') {
            c.state = 'OPEN';
            c.lastStateChange = Date.now();
            console.warn(`[PerModelCircuitBreaker] 🔴 Circuit TRIPPED for model: ${modelName} (failures: ${c.failures})`);
        }
    }
}
