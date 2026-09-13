/**
 * EvidenceDecayEngine.mjs
 *
 * Evaluates freshness of evidence based on configurable TTL policies.
 * Computes a freshnessMultiplier used in evidenceConfidence.
 *
 * PRINCIPLE:
 *   STALE evidence is NOT deleted or overwritten.
 *   STALE evidence CANNOT silently become current FACT.
 *   STALE reduces the weight of that evidence in confidence calculations.
 */

export const FRESHNESS = {
    FRESH:   'FRESH',   // Within 50% of TTL
    AGING:   'AGING',   // Between 50–100% of TTL
    STALE:   'STALE',   // Beyond TTL
    UNKNOWN: 'UNKNOWN'  // capturedAt missing or unparseable
};

export const DEFAULT_TTL_MS = {
    contact:         14 * 24 * 60 * 60 * 1000,  // 14 days
    category:        30 * 24 * 60 * 60 * 1000,  // 30 days
    demand_signal:    7 * 24 * 60 * 60 * 1000,  //  7 days
    demand:           7 * 24 * 60 * 60 * 1000,  //  7 days
    supplier:        14 * 24 * 60 * 60 * 1000,  // 14 days
    business_hours:   7 * 24 * 60 * 60 * 1000,  //  7 days
    promotion:        1 * 24 * 60 * 60 * 1000,  //  1 day
    identity:        30 * 24 * 60 * 60 * 1000,  // 30 days
    menu:             7 * 24 * 60 * 60 * 1000,  //  7 days
    description:     30 * 24 * 60 * 60 * 1000,  // 30 days
    location:        90 * 24 * 60 * 60 * 1000,  // 90 days
};

export const FRESHNESS_MULTIPLIER = {
    FRESH:   1.00,
    AGING:   0.70,
    STALE:   0.25,
    UNKNOWN: 0.10
};

export class EvidenceDecayEngine {
    constructor(customTtl = {}) {
        this.ttlPolicy = { ...DEFAULT_TTL_MS, ...customTtl };
    }

    /**
     * Evaluate freshness for a single evidence item.
     * @returns {{ status, freshnessMultiplier, ageMs, ttlMs }}
     */
    evaluate(evidence) {
        if (!evidence.capturedAt) {
            return {
                status: FRESHNESS.UNKNOWN,
                freshnessMultiplier: FRESHNESS_MULTIPLIER[FRESHNESS.UNKNOWN],
                ageMs: null,
                ttlMs: null
            };
        }

        const domain = (evidence.domain || 'identity').toLowerCase();
        const ttlMs = this.ttlPolicy[domain] ?? this.ttlPolicy['identity'];
        const capturedTime = new Date(evidence.capturedAt).getTime();

        if (isNaN(capturedTime)) {
            return {
                status: FRESHNESS.UNKNOWN,
                freshnessMultiplier: FRESHNESS_MULTIPLIER[FRESHNESS.UNKNOWN],
                ageMs: null,
                ttlMs
            };
        }

        const ageMs = Date.now() - capturedTime;
        let status;

        if (ageMs <= ttlMs * 0.5) {
            status = FRESHNESS.FRESH;
        } else if (ageMs <= ttlMs) {
            status = FRESHNESS.AGING;
        } else {
            status = FRESHNESS.STALE;
        }

        return {
            status,
            freshnessMultiplier: FRESHNESS_MULTIPLIER[status],
            ageMs,
            ttlMs
        };
    }

    /**
     * Compute evidenceConfidence for a single evidence item.
     * evidenceConfidence = reliability × directnessMultiplier × freshnessMultiplier × (completeness/100)
     */
    computeEvidenceConfidence(evidence) {
        const DIRECTNESS_MAP = { DIRECT: 1.0, INDIRECT: 0.6, INFERRED: 0.3 };
        const { freshnessMultiplier } = this.evaluate(evidence);

        const reliability = evidence.reliability ?? 0.5;
        const directnessMultiplier = DIRECTNESS_MAP[evidence.directness] ?? 0.6;
        const completeness = (evidence.completeness ?? 100) / 100;

        return reliability * directnessMultiplier * freshnessMultiplier * completeness;
    }

    /**
     * Evaluate freshness for all evidence in a list.
     * @returns {Map<evidenceId, freshnessResult>}
     */
    evaluateAll(evidenceList) {
        const result = new Map();
        for (const ev of evidenceList) {
            result.set(ev.evidenceId, this.evaluate(ev));
        }
        return result;
    }
}
