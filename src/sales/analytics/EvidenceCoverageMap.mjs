/**
 * EvidenceCoverageMap.mjs
 *
 * Analytics dashboard answering:
 * "Across all leads, how many have FRESH evidence for each domain?"
 *
 * Use this to prioritize research efforts:
 *   - "menu" is UNKNOWN for 31 leads → research menu first
 *   - "contact" is STALE for 9 leads → refresh contact info
 *
 * OUTPUT:
 * {
 *   domain: "menu",
 *   FRESH: 18, AGING: 5, STALE: 1, UNKNOWN: 31,
 *   coverageRate: 0.37    (% of leads with at least AGING evidence)
 * }
 */

import { EvidenceDecayEngine } from '../research/EvidenceDecayEngine.mjs';

const ALL_DOMAINS = ['identity', 'menu', 'contact', 'category', 'description', 'location', 'demand', 'supplier'];

export class EvidenceCoverageMap {
    constructor() {
        this.decay = new EvidenceDecayEngine();
    }

    /**
     * Compute coverage map across multiple leads.
     *
     * @param {object[]} allLeadEvidence - Array of { leadId, evidence: object[] }
     * @returns {object} Coverage breakdown per domain
     */
    compute(allLeadEvidence) {
        const totalLeads = allLeadEvidence.length;
        if (totalLeads === 0) return { totalLeads: 0, domains: [] };

        // Per-domain counters
        const domainMap = {};
        for (const d of ALL_DOMAINS) {
            domainMap[d] = { FRESH: 0, AGING: 0, STALE: 0, UNKNOWN: 0 };
        }

        for (const { evidence } of allLeadEvidence) {
            // Track best freshness status per domain per lead
            const domainBest = {};

            for (const ev of (evidence || [])) {
                const d = ev.domain;
                if (!domainMap[d]) domainMap[d] = { FRESH: 0, AGING: 0, STALE: 0, UNKNOWN: 0 };

                const { status } = this.decay.evaluate(ev);
                const priority = { FRESH: 4, AGING: 3, STALE: 2, UNKNOWN: 1 };

                if (!domainBest[d] || (priority[status] || 0) > (priority[domainBest[d]] || 0)) {
                    domainBest[d] = status;
                }
            }

            // Increment per-domain best status
            for (const [d, status] of Object.entries(domainBest)) {
                if (domainMap[d]) domainMap[d][status]++;
            }

            // Mark missing domains as UNKNOWN
            for (const d of ALL_DOMAINS) {
                if (!domainBest[d]) domainMap[d].UNKNOWN++;
            }
        }

        // Build output
        const domains = Object.entries(domainMap).map(([domain, counts]) => {
            const covered = counts.FRESH + counts.AGING + counts.STALE;
            const coverageRate = parseFloat((covered / totalLeads).toFixed(4));
            const freshnessRate = parseFloat((counts.FRESH / totalLeads).toFixed(4));
            return { domain, ...counts, coverageRate, freshnessRate, totalLeads };
        });

        // Sort by UNKNOWN desc (most-needed research first)
        domains.sort((a, b) => b.UNKNOWN - a.UNKNOWN);

        return { totalLeads, domains };
    }

    /**
     * Print coverage map as a formatted table.
     */
    print(coverageMap) {
        const { totalLeads, domains } = coverageMap;
        console.log(`\n╔══════════════════════════════════════════════════════════════════╗`);
        console.log(`║ EVIDENCE COVERAGE MAP (${totalLeads} leads)${' '.repeat(Math.max(0, 43 - String(totalLeads).length))}║`);
        console.log(`╠═══════════════╦═══════╦═══════╦═══════╦═══════╦══════════════╣`);
        console.log(`║ DOMAIN        ║ FRESH ║ AGING ║ STALE ║  UNK  ║  COVERAGE %  ║`);
        console.log(`╠═══════════════╬═══════╬═══════╬═══════╬═══════╬══════════════╣`);
        for (const d of domains) {
            const name = d.domain.padEnd(13);
            const fresh = String(d.FRESH).padStart(5);
            const aging = String(d.AGING).padStart(5);
            const stale = String(d.STALE).padStart(5);
            const unk = String(d.UNKNOWN).padStart(5);
            const cov = `${(d.coverageRate * 100).toFixed(0)}%`.padStart(10);
            const flag = d.UNKNOWN > totalLeads * 0.5 ? ' ⚠️' : '';
            console.log(`║ ${name} ║${fresh} ║${aging} ║${stale} ║${unk} ║${cov}    ║${flag}`);
        }
        console.log(`╚═══════════════╩═══════╩═══════╩═══════╩═══════╩══════════════╝`);
        console.log(`  ⚠️  = >50% leads have UNKNOWN evidence for this domain\n`);
    }
}
