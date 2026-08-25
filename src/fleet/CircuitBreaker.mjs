// src/fleet/CircuitBreaker.mjs

export class CircuitBreaker {
    constructor(threshold = 5, resetTimeoutMs = 30000) {
        this.state = 'CLOSED'; // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
        this.failureCount = 0;
        this.threshold = threshold;
        this.resetTimeoutMs = resetTimeoutMs;
        this.lastStateChange = Date.now();
    }

    canExecute() {
        const now = Date.now();
        if (this.state === 'OPEN') {
            if (now - this.lastStateChange >= this.resetTimeoutMs) {
                this.state = 'HALF_OPEN';
                this.lastStateChange = now;
                console.log('[CircuitBreaker] 🟡 Circuit entering HALF_OPEN trial state.');
                return true;
            }
            return false;
        }
        return true;
    }

    recordSuccess() {
        if (this.state === 'HALF_OPEN') {
            this.state = 'CLOSED';
            this.failureCount = 0;
            console.log('[CircuitBreaker] 🟢 Circuit restored to CLOSED state.');
        } else {
            this.failureCount = 0;
        }
    }

    recordFailure() {
        this.failureCount++;
        if (this.failureCount >= this.threshold && this.state !== 'OPEN') {
            this.state = 'OPEN';
            this.lastStateChange = Date.now();
            console.error(`[CircuitBreaker] 🔴 Circuit TRIPPED to OPEN state! Consecutive errors: ${this.failureCount}`);
        }
    }
}
