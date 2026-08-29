// src/sales/ResearchEnrichmentEngine.mjs
// ResearchEnrichmentEngine - Enriches lead profile before verification

import { LeadCRM } from './LeadCRM.mjs';
import { SalesEventLedger } from './SalesEventLedger.mjs';

export class ResearchEnrichmentEngine {

    /**
     * Memperkaya profil lead mentah dari data JSON (output Subagent Web Search)
     * Lebih mutakhir dibanding ResearchAgent Phase 4.
     */
    static enrichFromJson(phone, rawJsonResult) {
        try {
            const data = JSON.parse(rawJsonResult);
            const lead = LeadCRM.load(phone);
            if (!lead) throw new Error("Lead tidak ditemukan di CRM");

            // Standardize business type (jika bot memberikan kata bebas, petakan ke kategori inti)
            let coreType = 'UNKNOWN';
            const typeStr = (data.specificType || '').toLowerCase();
            if (typeStr.includes('katering') || typeStr.includes('catering')) coreType = 'CATERING';
            else if (typeStr.includes('warung') || typeStr.includes('padang')) coreType = 'WARUNG';
            else if (typeStr.includes('bakery') || typeStr.includes('kue')) coreType = 'BAKERY';
            else if (typeStr.includes('resto') || typeStr.includes('cafe')) coreType = 'CAFE';

            lead.businessType = coreType;
            lead.enrichedData = {
                specificType: data.specificType || 'UNKNOWN',
                publicLinks: data.publicLinks || [],
                menuItems: data.menuIndication || [],
                santanNeedSignal: data.santanNeedSignal || 'UNKNOWN',
                scaleDescription: data.scale || 'UNKNOWN',
                enrichmentSources: data.sources || []
            };

            // Deteksi Red Flags (e.g., Franchise Nasional yang sentralisasi pembelian)
            const flags = [];
            if (data.redFlag && data.redFlag !== 'NONE') {
                flags.push(data.redFlag);
                if (data.redFlag.includes('NATIONAL_FRANCHISE')) {
                    lead.status = 'SKIP';
                    lead.notes = 'Di-skip otomatis: Franchise Nasional / Keputusan pembelian sentral';
                }
            }
            lead.researchFlags = flags;
            lead.lastResearched = new Date().toISOString();

            LeadCRM.update(phone, lead);
            
            SalesEventLedger.record('ResearchEnrichmentEngine', phone, 'ENRICHMENT_COMPLETED', {
                coreType,
                flagsCount: flags.length,
                needSignal: lead.enrichedData.santanNeedSignal
            });

            return { success: true, lead, flags };
            
        } catch (e) {
            console.error(`[ResearchEnrichmentEngine] Gagal memproses JSON: ${e.message}`);
            return { success: false, error: e.message };
        }
    }
}
