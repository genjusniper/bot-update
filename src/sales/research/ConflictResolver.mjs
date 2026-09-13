/**
 * ConflictResolver.mjs
 *
 * Detects conflicts between evidence items within the same domain.
 * Classifies conflicts by severity and emits resolution recommendations.
 *
 * RULES:
 *   - last-write-wins is FORBIDDEN
 *   - majority-wins is FORBIDDEN
 *   - Conflicted claims are FLAGGED, not silently resolved
 *   - CRITICAL conflicts block outreach
 *   - Non-critical conflicts reduce confidence + trigger RESEARCH_MORE
 *
 * Severity:
 *   LOW      → minor variation (e.g. different opening hours from two sources)
 *   MEDIUM   → material disagreement (e.g. different category)
 *   HIGH     → operational conflict (e.g. contact number mismatch)
 *   CRITICAL → identity conflict (who is this business?)
 */

export const CONFLICT_SEVERITY = {
    LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', CRITICAL: 'CRITICAL'
};

const DOMAIN_SEVERITY = {
    identity:       CONFLICT_SEVERITY.CRITICAL,
    contact:        CONFLICT_SEVERITY.HIGH,
    category:       CONFLICT_SEVERITY.MEDIUM,
    menu:           CONFLICT_SEVERITY.MEDIUM,
    demand:         CONFLICT_SEVERITY.MEDIUM,
    supplier:       CONFLICT_SEVERITY.MEDIUM,
    business_hours: CONFLICT_SEVERITY.LOW,
    location:       CONFLICT_SEVERITY.LOW,
    promotion:      CONFLICT_SEVERITY.LOW,
    description:    CONFLICT_SEVERITY.LOW
};

export class ConflictResolver {
    /**
     * Detect conflicts across an evidence list.
     * Groups evidence by domain and checks for distinct normalizedValues.
     *
     * @param {object[]} evidenceList
     * @returns {{ conflicts: ConflictRecord[], blockOutreach: boolean }}
     */
    detect(evidenceList) {
        const domainMap = new Map();

        for (const ev of evidenceList) {
            if (!ev.domain) continue;
            if (!domainMap.has(ev.domain)) domainMap.set(ev.domain, []);
            domainMap.get(ev.domain).push(ev);
        }

        const conflicts = [];
        let blockOutreach = false;

        for (const [domain, items] of domainMap.entries()) {
            if (items.length < 2) continue;

            // Normalize values to detect disagreement
            const uniqueVals = new Map();
            for (const item of items) {
                const val = (item.normalizedValue ?? item.value ?? '').toLowerCase().trim();
                if (!uniqueVals.has(val)) uniqueVals.set(val, []);
                uniqueVals.get(val).push(item.evidenceId);
            }

            if (uniqueVals.size <= 1) continue; // All agree

            const severity = DOMAIN_SEVERITY[domain] ?? CONFLICT_SEVERITY.LOW;

            if (severity === CONFLICT_SEVERITY.CRITICAL) blockOutreach = true;

            // Build conflict record
            const claims = [...uniqueVals.entries()].map(([val, ids]) => ({
                value: val,
                supportedBy: ids
            }));

            conflicts.push({
                conflictId: `CONF-${domain}-${Date.now()}`,
                domain,
                severity,
                status: 'UNRESOLVED',
                claims,
                recommendedAction: this._recommendAction(severity),
                detectedAt: new Date().toISOString()
            });
        }

        return { conflicts, blockOutreach };
    }

    /**
     * Attempt to resolve a conflict by choosing the highest-confidence evidence.
     * Returns RESOLVED if possible, REQUIRES_RESEARCH otherwise.
     */
    resolve(conflict, evidenceList) {
        if (conflict.severity === CONFLICT_SEVERITY.CRITICAL) {
            return { ...conflict, status: 'REQUIRES_RESEARCH', resolution: null };
        }

        // Find highest confidence item across all conflicting values
        let best = null;
        for (const claim of conflict.claims) {
            for (const evId of claim.supportedBy) {
                const ev = evidenceList.find(e => e.evidenceId === evId);
                if (!ev) continue;
                const conf = ev.reliability * (ev.completeness / 100);
                if (!best || conf > best.conf) {
                    best = { ev, conf, value: claim.value };
                }
            }
        }

        if (best && best.conf >= 0.8) {
            return {
                ...conflict,
                status: 'RESOLVED',
                resolution: {
                    acceptedValue: best.value,
                    acceptedEvidenceId: best.ev.evidenceId,
                    confidence: best.conf,
                    resolvedAt: new Date().toISOString()
                }
            };
        }

        return { ...conflict, status: 'REQUIRES_RESEARCH', resolution: null };
    }

    _recommendAction(severity) {
        switch (severity) {
            case CONFLICT_SEVERITY.CRITICAL: return 'OUTREACH_BLOCKED → RESEARCH_MORE';
            case CONFLICT_SEVERITY.HIGH:     return 'REDUCE_CONFIDENCE → RESEARCH_MORE';
            case CONFLICT_SEVERITY.MEDIUM:   return 'REDUCE_CONFIDENCE → RESEARCH_MORE';
            case CONFLICT_SEVERITY.LOW:      return 'REDUCE_CONFIDENCE → CONTINUE';
            default:                         return 'RESEARCH_MORE';
        }
    }
}
