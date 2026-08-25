// src/resilience/KeyHealthRegistry.mjs
// Key Health Registry & Quota Bucket Manager

export class KeyHealthRegistry {
    constructor(rawKeyString = '') {
        const keys = rawKeyString.split(',').map(k => k.trim()).filter(k => k.length > 0);
        this.keys = keys.map((key, idx) => ({
            id: idx + 1,
            key,
            status: 'HEALTHY',
            failures: 0,
            cooldownUntil: 0,
            lastSuccess: 0,
            lastError: null,
            rpm: 0
        }));
        this.currentIndex = 0;
    }

    getHealthyKey() {
        const now = Date.now();
        const total = this.keys.length;

        for (let i = 0; i < total; i++) {
            const idx = (this.currentIndex + i) % total;
            const item = this.keys[idx];

            // If key was under cooldown and cooldown expired -> restore to HEALTHY
            if (item.status === 'COOLDOWN' && now >= item.cooldownUntil) {
                item.status = 'HEALTHY';
                item.failures = 0;
            }

            if (item.status === 'HEALTHY') {
                this.currentIndex = (idx + 1) % total;
                return item;
            }
        }

        // Emergency fallback: return key with closest expiring cooldown
        const cooldownKeys = this.keys.filter(k => k.status === 'COOLDOWN');
        if (cooldownKeys.length > 0) {
            cooldownKeys.sort((a, b) => a.cooldownUntil - b.cooldownUntil);
            return cooldownKeys[0];
        }

        return this.keys[0]; // absolute fallback
    }

    recordSuccess(keyId, latencyMs = 0) {
        const item = this.keys.find(k => k.id === keyId);
        if (item) {
            item.status = 'HEALTHY';
            item.failures = 0;
            item.cooldownUntil = 0;
            item.lastSuccess = Date.now();
        }
    }

    recordError(keyId, errorClassification) {
        const item = this.keys.find(k => k.id === keyId);
        if (!item) return;

        item.failures++;
        item.lastError = errorClassification.category;

        if (errorClassification.category === 'RATE_LIMIT') {
            // Respect quota: Put key into cooldown for 30s
            item.status = 'COOLDOWN';
            item.cooldownUntil = Date.now() + (errorClassification.cooldownMs || 30000);
            console.warn(`[KeyHealthRegistry] 🟡 Key #${item.id} put into COOLDOWN until ${new Date(item.cooldownUntil).toLocaleTimeString()}`);
        } else if (errorClassification.category === 'AUTH_FAILURE') {
            item.status = 'QUARANTINED';
            item.cooldownUntil = Date.now() + (3600 * 1000); // 1 hour
        }
    }
}
