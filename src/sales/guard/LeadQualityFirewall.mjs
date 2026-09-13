export class LeadQualityFirewall {
    constructor() {
        this.TTL_POLICY = {
            contact: 14 * 24 * 60 * 60 * 1000,
            category: 30 * 24 * 60 * 60 * 1000,
            demand_signal: 7 * 24 * 60 * 60 * 1000,
            supplier: 14 * 24 * 60 * 60 * 1000,
            business_hours: 7 * 24 * 60 * 60 * 1000,
            promotion: 1 * 24 * 60 * 60 * 1000,
            identity: 30 * 24 * 60 * 60 * 1000
        };
    }

    evaluateFreshness(evidenceList) {
        const now = Date.now();
        const freshnessMap = {};
        
        for (const ev of evidenceList) {
            const domain = ev.domain || 'identity'; // Default fallback
            const captured = new Date(ev.capturedAt).getTime();
            const ageMs = now - captured;
            const ttlMs = this.TTL_POLICY[domain] || this.TTL_POLICY['identity'];

            let status = 'UNKNOWN';
            if (ev.capturedAt) {
                if (ageMs <= ttlMs * 0.5) status = 'FRESH';
                else if (ageMs <= ttlMs) status = 'AGING';
                else status = 'STALE';
            }
            
            freshnessMap[ev.evidenceId] = { status, domain, ageMs, ttlMs };
        }
        return freshnessMap;
    }

    calculateCoverage(evidenceList) {
        const domains = {
            identity: 0,
            category: 0,
            location: 0,
            contact: 0,
            demand: 0,
            supplier: 0
        };

        for (const ev of evidenceList) {
            if (domains[ev.domain] !== undefined) {
                domains[ev.domain] = Math.min(100, domains[ev.domain] + (ev.completeness || 100));
            }
        }

        return domains;
    }

    detectConflicts(evidenceList) {
        const claimMap = {};
        for (const ev of evidenceList) {
            if (!ev.domain) continue;
            if (!claimMap[ev.domain]) claimMap[ev.domain] = [];
            claimMap[ev.domain].push(ev);
        }

        const conflicts = [];
        let blockOutreach = false;

        for (const domain in claimMap) {
            const domainEvs = claimMap[domain];
            if (domainEvs.length > 1) {
                const uniqueValues = [...new Set(domainEvs.map(e => e.normalizedValue))];
                if (uniqueValues.length > 1) {
                    let severity = 'LOW';
                    if (domain === 'category') severity = 'MEDIUM';
                    if (domain === 'contact') severity = 'HIGH';
                    if (domain === 'identity') {
                        severity = 'CRITICAL';
                        blockOutreach = true;
                    }

                    conflicts.push({
                        conflict: true,
                        severity,
                        domain,
                        claims: uniqueValues,
                        resolution: "UNRESOLVED",
                        recommendedAction: "RESEARCH_MORE"
                    });
                }
            }
        }
        return { conflicts, blockOutreach };
    }

    validateRawLead(lead) {
        // Schema Validation
        if (!lead || typeof lead !== 'object') return { decision: 'REJECTED', reason: 'Invalid schema' };
        if (!lead.businessName) return { decision: 'REJECTED', reason: 'Missing businessName' };
        
        // Provenance Validation
        if (!lead.source || !lead.source.sourceRef || !lead.source.capturedAt) {
            return { decision: 'REJECTED', reason: 'Missing or invalid provenance' };
        }

        // Identity Validation (Basic)
        if (lead.businessName.length < 3) return { decision: 'REJECTED', reason: 'Identity collision risk (Name too short)' };

        // Contact validation is NOT a reject, it's a gate state
        let contactStatus = 'VALID';
        if (!lead.publicContact) contactStatus = 'MISSING';
        else if (!lead.publicContact.match(/^\+?\d{8,15}$/)) contactStatus = 'INVALID_FORMAT';

        return { decision: 'PROCEED', contactStatus };
    }

    gradeQuality(lead, evidenceList, opportunityScore = 0) {
        // 1. Initial Raw Lead Validation
        const rawValidation = this.validateRawLead(lead);
        if (rawValidation.decision === 'REJECTED') {
            return { qualityGrade: 'REJECTED', decision: 'REJECTED', reasons: [rawValidation.reason] };
        }

        // 2. Evaluate Evidence
        const freshness = this.evaluateFreshness(evidenceList || []);
        const coverage = this.calculateCoverage(evidenceList || []);
        const { conflicts, blockOutreach } = this.detectConflicts(evidenceList || []);

        // 3. Calculate Overall Confidence (Reliability * Directness * Freshness * Completeness)
        let totalConfidence = 0;
        let validEvidences = 0;
        
        (evidenceList || []).forEach(ev => {
            const rel = ev.reliability || 0.5;
            const dir = ev.directness || 0.5;
            const fStatus = freshness[ev.evidenceId]?.status;
            let freshFactor = fStatus === 'FRESH' ? 1.0 : (fStatus === 'AGING' ? 0.7 : 0.3);
            const comp = (ev.completeness || 100) / 100;

            const evConf = rel * dir * freshFactor * comp;
            ev.finalConfidence = evConf; // Mutate for downstream
            
            totalConfidence += evConf;
            validEvidences++;
        });

        const meanConfidence = validEvidences > 0 ? totalConfidence / validEvidences : 0;

        // 4. Grade Logic
        let grade = 'D';
        if (meanConfidence > 0.8 && coverage.identity === 100) grade = 'A';
        else if (meanConfidence > 0.6) grade = 'B';
        else if (meanConfidence > 0.4) grade = 'C';

        // 5. Decision Gate Logic
        let decision = 'WATCHLIST';
        let reasons = [];

        // Research loop prevention
        const researchAttempts = lead.researchAttempts || 0;

        if (blockOutreach) {
            decision = 'RESEARCH_MORE';
            reasons.push('CRITICAL conflict detected. Outreach blocked.');
        } else if (rawValidation.contactStatus !== 'VALID') {
            decision = 'RESEARCH_MORE';
            reasons.push('Contact invalid or missing.');
        } else if (opportunityScore > 0.7 && meanConfidence < 0.6) {
            decision = 'RESEARCH_MORE';
            reasons.push('High opportunity but low evidence confidence.');
        } else if (opportunityScore > 0.6) {
            decision = 'HUMAN_REVIEW';
            reasons.push('Opportunity is actionable and evidence is sufficient.');
        } else {
            decision = 'WATCHLIST';
            reasons.push('Opportunity score too low for immediate action.');
        }

        // Loop breaker
        if (decision === 'RESEARCH_MORE' && researchAttempts >= 2) {
            decision = 'WATCHLIST';
            reasons.push('Max research attempts reached. Falling back to WATCHLIST.');
        }

        return {
            qualityGrade: grade,
            confidence: meanConfidence,
            coverage,
            conflicts,
            freshness,
            decision,
            reasons
        };
    }
}
