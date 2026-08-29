// src/sales/PipelineGapAnalyzer.mjs
// PipelineGapAnalyzer — Calculates gap between target and current projected pipeline

import { RevenuePredictor } from './RevenuePredictor.mjs';

export class PipelineGapAnalyzer {
    /**
     * Hitung Pipeline Gap
     * @param {number} targetRevenue - Target dalam Rp (misal 5000000)
     * @param {Array} activeLeads - List lead aktif dari CRM
     * @param {number} historicalConversionRate - Konversi rata-rata (default 15%)
     * @param {number} avgOrderValue - Rata-rata nilai order pertama
     * @returns {Object} Hasil analisa gap
     */
    static analyze(targetRevenue, activeLeads, historicalConversionRate = 0.15, avgOrderValue = 300000) {
        
        let confirmedRevenue = 0;
        let pipelineProbable = 0;

        for (const lead of activeLeads) {
            if (lead.status === 'ORDER' || lead.status === 'REPEAT') {
                // Asumsi: nilai pesanan tercatat di CRM (jika belum, pakai avg)
                confirmedRevenue += lead.orderValue || avgOrderValue;
            } else if (lead.status !== 'LOST' && lead.status !== 'DO_NOT_CONTACT') {
                const pred = RevenuePredictor.predict(lead);
                pipelineProbable += pred.expectedRevenue;
            }
        }

        const totalProjected = confirmedRevenue + pipelineProbable;
        const gap = Math.max(0, targetRevenue - totalProjected);
        
        const isSafe = gap === 0;

        // Berapa lead baru yang diperlukan untuk menutup gap?
        // Asumsi: Setiap prospek baru punya expected value = avgOrderValue * conversionRate
        const expectedValuePerNewLead = avgOrderValue * historicalConversionRate;
        const requiredNewLeads = Math.ceil(gap / expectedValuePerNewLead);
        
        // Memerlukan berapa discovery? (Asumsi 50% lolos verifikasi awal)
        const requiredDiscovery = Math.ceil(requiredNewLeads / 0.50);

        return {
            targetRevenue,
            confirmedRevenue,
            pipelineProbable,
            totalProjected,
            gap,
            isSafe,
            requiredNewLeads,
            requiredDiscovery,
            metrics: {
                historicalConversionRate,
                avgOrderValue,
                expectedValuePerNewLead
            }
        };
    }
}
