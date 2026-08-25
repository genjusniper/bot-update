// src/fleet/KeyFleetManager.mjs — RESILIENT HIGH-UPTIME FLEET MANAGER

export class KeyFleetManager {
    constructor(rawKeyString) {
        const keys = (rawKeyString || '').split(',').map(k => k.trim()).filter(k => k.length > 0);
        this.fleet = keys.map((key, index) => ({
            id: index + 1,
            key: key,
            health: 'HEALTHY',
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
        if (this.fleet.length === 0) return null;
        const now = Date.now();
        
        // 1. Auto-heal keys past their cooldown
        for (const item of this.fleet) {
            if (item.health === 'COOLDOWN' && now >= item.cooldownUntil) {
                item.health = 'HEALTHY';
                item.consecutiveErrors = 0;
            }
        }

        // 2. Find available healthy key (Round-Robin)
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

        // 3. Resilient Fallback: If all are in cooldown/quarantine, pick the least recently used non-quarantined key
        const eligible = this.fleet.filter(k => k.health !== 'QUARANTINED');
        if (eligible.length > 0) {
            eligible.sort((a, b) => a.lastUsed - b.lastUsed);
            const chosen = eligible[0];
            chosen.health = 'HEALTHY'; // Give it a trial turn
            chosen.lastUsed = now;
            return chosen;
        }

        // 4. Absolute fallback
        return this.fleet[0];
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
            console.warn(`[KeyFleetManager] 🚫 Key #${item.id} QUARANTINED.`);
        } else if (errorClassification.action === 'COOLDOWN_KEY') {
            item.health = 'COOLDOWN';
            item.total429++;
            item.cooldownUntil = Date.now() + 20000; // 20s cooldown instead of 45s
            console.warn(`[KeyFleetManager] ⏳ Key #${item.id} on cooldown for 20s.`);
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
