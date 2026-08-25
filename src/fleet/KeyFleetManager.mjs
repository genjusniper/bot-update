// src/fleet/KeyFleetManager.mjs

export class KeyFleetManager {
    constructor(rawKeyString) {
        const keys = (rawKeyString || '').split(',').map(k => k.trim()).filter(k => k.length > 0);
        this.fleet = keys.map((key, index) => ({
            id: index + 1,
            key: key,
            health: 'HEALTHY', // 'HEALTHY' | 'COOLDOWN' | 'QUARANTINED'
            cooldownUntil: 0,
            consecutiveErrors: 0,
            totalSuccess: 0,
            total429: 0,
            lastUsed: 0,
            avgLatencyMs: 0
        }));
        this.pointer = 0;
    }

    getHealthyKey() {
        const now = Date.now();
        
        // Auto-heal keys past their cooldown
        for (const item of this.fleet) {
            if (item.health === 'COOLDOWN' && now >= item.cooldownUntil) {
                item.health = 'HEALTHY';
                item.consecutiveErrors = 0;
            }
        }

        // Find available healthy keys starting from pointer (Round-Robin)
        const total = this.fleet.length;
        for (let i = 0; i < total; i++) {
            const index = (this.pointer + i) % total;
            const item = this.fleet[index];
            if (item.health === 'HEALTHY') {
                this.pointer = (index + 1) % total;
                item.lastUsed = now;
                return item;
            }
        }

        // If none healthy, find the one with nearest cooldown expiration
        const cooldownKeys = this.fleet.filter(k => k.health === 'COOLDOWN').sort((a, b) => a.cooldownUntil - b.cooldownUntil);
        if (cooldownKeys.length > 0) {
            return cooldownKeys[0];
        }

        return null;
    }

    recordSuccess(keyId, latencyMs) {
        const item = this.fleet.find(k => k.id === keyId);
        if (item) {
            item.health = 'HEALTHY';
            item.consecutiveErrors = 0;
            item.totalSuccess++;
            item.avgLatencyMs = item.avgLatencyMs === 0 ? latencyMs : Math.round((item.avgLatencyMs * 0.7) + (latencyMs * 0.3));
        }
    }

    recordError(keyId, errorClassification) {
        const item = this.fleet.find(k => k.id === keyId);
        if (!item) return;

        item.consecutiveErrors++;

        if (errorClassification.action === 'QUARANTINE_KEY') {
            item.health = 'QUARANTINED';
            console.warn(`[KeyFleetManager] 🚫 Key #${item.id} QUARANTINED (Invalid Auth).`);
        } else if (errorClassification.action === 'COOLDOWN_KEY') {
            item.health = 'COOLDOWN';
            item.total429++;
            item.cooldownUntil = Date.now() + (errorClassification.cooldownMs || 45000);
            console.warn(`[KeyFleetManager] ⏳ Key #${item.id} placed on COOLDOWN for ${(errorClassification.cooldownMs || 45000) / 1000}s (429 Rate Limit).`);
        }
    }

    getFleetStatus() {
        return {
            totalKeys: this.fleet.length,
            healthy: this.fleet.filter(k => k.health === 'HEALTHY').length,
            cooldown: this.fleet.filter(k => k.health === 'COOLDOWN').length,
            quarantined: this.fleet.filter(k => k.health === 'QUARANTINED').length
        };
    }
}
