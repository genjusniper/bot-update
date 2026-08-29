// src/sales/NextBestActionEngine.mjs
// Menentukan satu langkah terbaik selanjutnya (Next Best Action) untuk sebuah prospek

import { DealForecastEngine } from './DealForecastEngine.mjs';

export class NextBestActionEngine {
    
    /**
     * Tentukan NBA (Next Best Action)
     */
    static getNBA(lead) {
        if (!lead || lead.status === 'LOST' || lead.status === 'DO_NOT_CONTACT') return 'DROP';
        if (lead.status === 'ORDER') return 'NURTURE_REPEAT';

        const forecast = DealForecastEngine.forecast(lead);
        const daysSince = lead.lastContact ? (Date.now() - new Date(lead.lastContact)) / (1000 * 60 * 60 * 24) : 999;

        switch (lead.status) {
            case 'NEW':
                return 'OUTREACH_EXPERIMENT';
            
            case 'CONTACTED':
                if (daysSince > 3) return 'RECOVER_SOFT';
                if (daysSince > 1) return 'WAIT'; // Beri waktu membalas
                return 'WAIT';
                
            case 'REPLIED':
            case 'CURIOUS':
                return 'QUALIFY_AND_OFFER';
                
            case 'THINKING':
                if (daysSince > 2) return 'FOLLOWUP_VALUE';
                return 'WAIT';
                
            case 'ASKED_PRICE':
                return 'PITCH_OFFER';

            case 'INTERESTED':
                return 'CLOSE_DEAL';
                
            case 'NEGOTIATION':
                if (forecast.probability < 50) return 'OFFER_DOWNSELL';
                return 'HOLD_PRICE_AND_PUSH';
                
            default:
                return 'REVIEW_MANUAL';
        }
    }
}
