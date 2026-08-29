// src/sales/OpportunityHunter.mjs
// OpportunityHunter - Proactively finds new business opportunities based on target gaps

import { LeadDeduplicationEngine } from './LeadDeduplicationEngine.mjs';
import { SalesEventLedger } from './SalesEventLedger.mjs';

export class OpportunityHunter {
    
    /**
     * Membangun daftar query pencarian berdasarkan kebutuhan gap
     */
    static generateSearchQueries(gapAnalysis, city = 'Surabaya') {
        if (gapAnalysis.isSafe) return [];

        const queries = [];
        const required = gapAnalysis.requiredDiscovery;

        // Bikin variasi keyword supaya nggak itu-itu saja
        const keywords = [
            'katering harian',
            'katering pernikahan',
            'rumah makan padang',
            'warung nasi campur',
            'toko kue basah',
            'bakery',
            'gulai kambing',
            'soto bersantan'
        ];

        // 1 query diasumsikan menghasilkan 10 leads mentah
        const queryCount = Math.ceil(required / 10);
        
        for (let i = 0; i < Math.min(queryCount, keywords.length); i++) {
            queries.push(`${keywords[i]} di ${city}`);
        }

        return queries;
    }

    /**
     * Memproses hasil pencarian mentah dan memfilter duplikat
     * @param {Array} rawSearchResults - array of { phone, name, type, location }
     */
    static processRawLeads(rawSearchResults) {
        const approvedLeads = [];
        const rejected = [];

        for (const raw of rawSearchResults) {
            // Cek duplikat
            const dupCheck = LeadDeduplicationEngine.check(raw);
            
            if (dupCheck.isDuplicate) {
                rejected.push({ lead: raw, reason: dupCheck.reason });
            } else {
                approvedLeads.push(raw);
                SalesEventLedger.record('OpportunityHunter', raw.phone || 'UNKNOWN', 'LEAD_HUNTED', {
                    businessName: raw.businessName,
                    source: raw.source || 'WebSearch'
                });
            }
        }

        return {
            totalRaw: rawSearchResults.length,
            approvedCount: approvedLeads.length,
            rejectedCount: rejected.length,
            approvedLeads,
            rejected
        };
    }
}
