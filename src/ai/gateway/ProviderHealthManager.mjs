export const KeyStatus = {
  HEALTHY: 'HEALTHY',
  COOLDOWN: 'COOLDOWN',
  DISABLED: 'DISABLED'
};

export class ProviderHealthManager {
  constructor(providerName, apiKeys) {
    this.name = providerName;
    this.keys = apiKeys.map((k, i) => ({
      index: i,
      status: KeyStatus.HEALTHY,
      cooldownUntil: 0,
      failCount: 0
    }));
  }

  getBestKey() {
    const now = Date.now();
    for (let k of this.keys) {
      if (k.status === KeyStatus.COOLDOWN && now >= k.cooldownUntil) {
        k.status = KeyStatus.HEALTHY;
        k.failCount = 0;
      }
    }
    const healthyKeys = this.keys.filter(k => k.status === KeyStatus.HEALTHY);
    if (healthyKeys.length > 0) return healthyKeys[0];
    
    // Kalau semua habis, lihat apakah ada cooldown yang akan segera selesai
    const cooldownKeys = this.keys.filter(k => k.status === KeyStatus.COOLDOWN).sort((a,b) => a.cooldownUntil - b.cooldownUntil);
    if (cooldownKeys.length > 0) return cooldownKeys[0]; // Terpaksa ambil yang tercepat (nanti di-handle Gateway)
    
    return null;
  }

  reportError(keyIndex, errorClass) {
    const k = this.keys[keyIndex];
    if (!k) return;

    if (errorClass === 'MALFORMED_REQUEST' || errorClass === '400') {
      // Kesalahan kode kita (Payload cacat). JANGAN disable key, JANGAN rotate. 
      // Lempar saja sebagai fatal error supaya tidak bakar quota sia-sia.
      return { action: 'FATAL_ABORT' }; 
    }

    if (errorClass === 'UNAUTHORIZED' || errorClass === '401' || errorClass === '403') {
      k.status = KeyStatus.DISABLED;
      console.warn(`[HealthManager] 🚫 Key #${keyIndex} for ${this.name} DISABLED (401/403)`);
      return { action: 'ROTATE' };
    }

    if (errorClass === 'RATE_LIMIT' || errorClass === 'QUOTA' || errorClass === '429') {
      k.status = KeyStatus.COOLDOWN;
      k.cooldownUntil = Date.now() + (60 * 1000); // 1 Menit cooldown
      console.warn(`[HealthManager] ⏳ Key #${keyIndex} for ${this.name} COOLDOWN (429)`);
      return { action: 'ROTATE' };
    }

    if (errorClass === 'SERVER_ERROR' || errorClass === '5xx' || errorClass === 'NETWORK') {
      k.failCount++;
      if (k.failCount >= 2) {
        k.status = KeyStatus.COOLDOWN;
        k.cooldownUntil = Date.now() + (30 * 1000); // 30 detik cooldown
        console.warn(`[HealthManager] ⚠️ Key #${keyIndex} for ${this.name} COOLDOWN (5xx Repeated)`);
        return { action: 'ROTATE' };
      }
      return { action: 'RETRY_SAME_KEY' };
    }

    return { action: 'FATAL_ABORT' };
  }
}
