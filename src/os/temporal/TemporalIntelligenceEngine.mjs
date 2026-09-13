/**
 * TemporalIntelligenceEngine.mjs
 * 
 * Time horizon and data freshness evaluation.
 * Understands:
 * - CURRENT: Real-time, verified now
 * - RECENT: Within acceptable freshness window (e.g. today)
 * - STALE: Outdated, requires refresh before high-risk mutation
 * - EXPIRED: Past validity deadline (e.g. expired voucher or promo)
 * - SCHEDULED: Pending future execution
 * - FUTURE: Not yet active
 */

export class TemporalIntelligenceEngine {
    static HORIZONS = {
        CURRENT: 'CURRENT',
        RECENT: 'RECENT',
        STALE: 'STALE',
        EXPIRED: 'EXPIRED',
        SCHEDULED: 'SCHEDULED',
        FUTURE: 'FUTURE'
    };

    /**
     * Evaluate freshness of a record or piece of data
     */
    static checkFreshness({ observedAt, validFrom = null, validUntil = null, maxFreshMs = 24 * 60 * 60 * 1000 }) {
        const now = Date.now();

        // 1. Check Explicit Expiration Window
        if (validUntil && now > validUntil) {
            return {
                horizon: this.HORIZONS.EXPIRED,
                isFresh: false,
                reason: `Data/promo telah berakhir pada ${new Date(validUntil).toLocaleString('id-ID')}.`
            };
        }

        // 2. Check Future Validity
        if (validFrom && now < validFrom) {
            return {
                horizon: this.HORIZONS.FUTURE,
                isFresh: false,
                reason: `Data/promo baru akan aktif pada ${new Date(validFrom).toLocaleString('id-ID')}.`
            };
        }

        // 3. Check Staleness via Elapsed Time
        const ageMs = now - (observedAt || now);
        if (ageMs < 5 * 60 * 1000) {
            return {
                horizon: this.HORIZONS.CURRENT,
                isFresh: true,
                ageSec: Math.round(ageMs / 1000),
                reason: 'Data real-time (kurang dari 5 menit yang lalu).'
            };
        }

        if (ageMs <= maxFreshMs) {
            return {
                horizon: this.HORIZONS.RECENT,
                isFresh: true,
                ageHours: (ageMs / (3600 * 1000)).toFixed(1),
                reason: 'Data masih dalam batas toleransi wajar.'
            };
        }

        return {
            horizon: this.HORIZONS.STALE,
            isFresh: false,
            ageHours: (ageMs / (3600 * 1000)).toFixed(1),
            reason: 'Data sudah basi (melebihi batas toleransi). Diperlukan sinkronisasi ulang.'
        };
    }
}
