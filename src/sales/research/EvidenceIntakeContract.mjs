/**
 * EvidenceIntakeContract.mjs
 *
 * Validates, normalizes, and fingerprints incoming evidence.
 * Produces a canonical evidence object or rejects with reason.
 *
 * CONTRACT:
 *   Evidence = verifiable atomic fact about a lead, from a named source.
 *   Evidence is NEVER modified after intake. Only appended.
 *
 * Three confidence layers:
 *   sourceReliability  → how trustworthy is this source type?
 *   evidenceConfidence → derived: reliability × directness × freshFactor × completeness
 *   decisionConfidence → set by ClaimEngine based on claim-level aggregation
 */

export const SOURCE_RELIABILITY = {
    MANUAL_SURVEY:       0.95,
    BUSINESS_OWNER:      0.98,
    PUBLIC_MENU:         0.92,
    PUBLIC_WEBSITE:      0.80,
    SERPAPI_MAPS:        0.85,
    SOCIAL_MEDIA:        0.70,
    MANUAL_ENTRY:        0.88,
    CATEGORY_PRIOR:      0.40,
    GENERIC_KNOWLEDGE:   0.25,
    HEURISTIC:           0.20,
    UNKNOWN_SOURCE:      0.10
};

export const CLASSIFICATION = { FACT: 'FACT', INFERENCE: 'INFERENCE', UNKNOWN: 'UNKNOWN' };
export const DIRECTNESS = { DIRECT: 1.0, INDIRECT: 0.6, INFERRED: 0.3 };

const REQUIRED_FIELDS = ['domain', 'sourceType', 'sourceRef', 'capturedAt', 'rawValue'];

/**
 * Stable deterministic fingerprint.
 * Same lead + field + normalizedValue + sourceRef → same fingerprint.
 * Different capturedAt with same content = duplicate.
 */
export function computeFingerprint(leadId, domain, normalizedValue, sourceRef) {
    const str = `${leadId}|${domain}|${(normalizedValue || '').toLowerCase().trim()}|${sourceRef}`;
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = (h * 0x01000193) >>> 0;
    }
    return `fp-${h.toString(16).padStart(8, '0')}`;
}

export class EvidenceIntakeContract {
    /**
     * @param {object} raw - Raw evidence object
     * @param {string} leadId - The lead this evidence belongs to
     * @returns {{ ok: boolean, evidence?: object, reason?: string }}
     */
    intake(raw, leadId) {
        // 1. Schema validation
        for (const f of REQUIRED_FIELDS) {
            if (!raw[f] && raw[f] !== 0) {
                return { ok: false, reason: `Missing required field: ${f}` };
            }
        }

        if (!leadId) return { ok: false, reason: 'leadId is required' };

        // 2. Source type normalization
        const sourceType = raw.sourceType.toUpperCase();
        const reliability = SOURCE_RELIABILITY[sourceType] ?? SOURCE_RELIABILITY['UNKNOWN_SOURCE'];

        // 3. Directness interpretation
        const directnessKey = raw.directness?.toUpperCase?.() ?? 'INDIRECT';
        const directnessMultiplier = DIRECTNESS[directnessKey] ?? DIRECTNESS['INDIRECT'];

        // 4. Classification enforcement
        // Only MANUAL_SURVEY, BUSINESS_OWNER, PUBLIC_MENU can carry FACT classification for operational data
        let classification = raw.classification || CLASSIFICATION.INFERENCE;
        if (classification === CLASSIFICATION.FACT) {
            const factSources = ['MANUAL_SURVEY', 'BUSINESS_OWNER', 'PUBLIC_MENU', 'MANUAL_ENTRY'];
            if (!factSources.includes(sourceType)) {
                // Downgrade to INFERENCE — source cannot assert facts
                classification = CLASSIFICATION.INFERENCE;
            }
        }

        // 5. Hallucination guards — certain fields cannot be FACT without explicit source
        const operationalFields = ['volume', 'frequency', 'price', 'supplier', 'quantity'];
        if (operationalFields.some(f => (raw.domain || '').toLowerCase().includes(f))) {
            if (!['MANUAL_SURVEY', 'BUSINESS_OWNER', 'MANUAL_ENTRY'].includes(sourceType)) {
                classification = CLASSIFICATION.UNKNOWN;
            }
        }

        // 6. Fingerprint for dedup
        const fingerprint = computeFingerprint(
            leadId,
            raw.domain,
            raw.normalizedValue ?? raw.rawValue,
            raw.sourceRef
        );

        // 7. Compose canonical evidence
        const evidence = {
            evidenceId: raw.evidenceId || `EV-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            leadId,
            fingerprint,
            domain: raw.domain,
            claim: raw.claim || raw.rawValue,
            value: raw.value || raw.normalizedValue || raw.rawValue,
            sourceType,
            sourceRef: raw.sourceRef,
            capturedAt: raw.capturedAt,
            rawValue: raw.rawValue,
            normalizedValue: raw.normalizedValue ?? raw.rawValue,
            directness: directnessKey,
            reliability,
            completeness: raw.completeness ?? 100,
            classification,
            intakedAt: new Date().toISOString(),
            // evidenceConfidence is derived — do NOT set here; it's computed by EvidenceDecayEngine
        };

        // Freeze to enforce immutability at runtime
        Object.freeze(evidence);

        return { ok: true, evidence };
    }
}
