// src/sales/DealForecastEngine.mjs
// Menghitung probabilitas closing (win rate) dan estimasi pipeline value

import { LeadCRM } from './LeadCRM.mjs';

export class DealForecastEngine {
    
    /**
     * Hitung probabilitas dan nilai dari suatu deal
     */
    static forecast(lead) {
        if (!lead || ['LOST', 'DO_NOT_CONTACT'].includes(lead.status)) {
            return { probability: 0, pipelineValue: 0, expectedValue: 0 };
        }
        if (['ORDER', 'REPEAT'].includes(lead.status)) {
            const val = this._estimateValue(lead);
            return { probability: 100, pipelineValue: val, expectedValue: val };
        }

        let prob = 5; // Base prob untuk lead baru

        // 1. Tambahan dari Fase Sales
        const phaseWeight = {
            'NEW': 5,
            'CONTACTED': 10,
            'REPLIED': 20,
            'CURIOUS': 30,
            'THINKING': 40,
            'INTERESTED': 60,
            'ASKED_PRICE': 75,
            'NEGOTIATION': 85
        };
        prob = phaseWeight[lead.status] || prob;

        // 2. Modifikasi dari Sinyal Kebutuhan (dari Research)
        if (lead.enrichedData && lead.enrichedData.santanNeedSignal) {
            const signal = lead.enrichedData.santanNeedSignal.toUpperCase();
            if (signal === 'HIGH') prob += 15;
            if (signal === 'LOW') prob -= 10;
        }

        // 3. Penalti Ghosting
        if (lead.lastContact) {
            const daysSince = (new Date() - new Date(lead.lastContact)) / (1000 * 60 * 60 * 24);
            if (daysSince > 3) prob -= (daysSince * 2); // -2% tiap hari setelah hari ke-3
        }

        // 4. Hitung Pipeline Value
        const pipelineValue = this._estimateValue(lead);
        
        prob = Math.max(0, Math.min(100, Math.round(prob)));
        const expectedValue = Math.round(pipelineValue * (prob / 100));

        return { probability: prob, pipelineValue, expectedValue };
    }

    static _estimateValue(lead) {
        if (lead.orderValue) return lead.orderValue;
        
        // Estimasi kasar berdasarkan skala/tipe jika belum ada orderValue
        const type = lead.businessType || 'UNKNOWN';
        let base = 300000; // default order pertama 300rb
        if (type === 'CATERING') base = 750000;
        if (type === 'RESTO' || type === 'CAFE') base = 500000;
        
        if (lead.enrichedData?.scaleDescription?.toLowerCase().includes('besar')) {
            base *= 2;
        }

        return base;
    }
}
