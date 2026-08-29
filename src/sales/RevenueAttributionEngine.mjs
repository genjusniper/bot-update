// src/sales/RevenueAttributionEngine.mjs
// Melacak asal-usul konversi (Order) ke sumber lead dan eksperimen awal

import { SalesEventLedger } from './SalesEventLedger.mjs';
import { LeadCRM } from './LeadCRM.mjs';

export class RevenueAttributionEngine {

    /**
     * Menganalisa semua lead yang berstatus ORDER/REPEAT untuk mencari atribusi.
     * @returns {Object} Statistik atribusi
     */
    static analyze() {
        const closedLeads = LeadCRM.getByStatus('ORDER').concat(LeadCRM.getByStatus('REPEAT'));
        
        const attribution = {
            totalRevenue: 0,
            bySource: {},
            byVariant: {},
            byBusinessType: {}
        };

        for (const lead of closedLeads) {
            const revenue = lead.orderValue || 300000;
            attribution.totalRevenue += revenue;

            // 1. By Business Type
            const bType = lead.businessType || 'UNKNOWN';
            attribution.byBusinessType[bType] = (attribution.byBusinessType[bType] || 0) + revenue;

            // 2. Cari event EXPERIMENT_SELECTED dari ledger
            const history = SalesEventLedger.getHistoryForLead(lead.phone);
            
            const expEvent = history.find(e => e.event === 'EXPERIMENT_SELECTED');
            if (expEvent && expEvent.variant) {
                const variant = expEvent.variant;
                attribution.byVariant[variant] = (attribution.byVariant[variant] || 0) + revenue;
            }

            // 3. Cari event LEAD_HUNTED / DISCOVERED
            const discEvent = history.find(e => ['LEAD_HUNTED', 'DISCOVERED'].includes(e.event));
            if (discEvent && discEvent.source) {
                const source = discEvent.source;
                attribution.bySource[source] = (attribution.bySource[source] || 0) + revenue;
            }
        }

        return attribution;
    }
}
