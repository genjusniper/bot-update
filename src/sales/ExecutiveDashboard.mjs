// src/sales/ExecutiveDashboard.mjs
// Laporan Eksekutif V3 dengan Revenue Optimization & Insights

import { PipelineGapAnalyzer } from './PipelineGapAnalyzer.mjs';
import { SalesLearningEngine } from './SalesLearningEngine.mjs';
import { LeadCRM } from './LeadCRM.mjs';
import { DealForecastEngine } from './DealForecastEngine.mjs';

export class ExecutiveDashboard {
    
    /**
     * Generate laporan harian/mingguan lengkap
     */
    static generateFullReport(targetRevenue = 5000000) {
        const allLeads = LeadCRM.getByStatus(null);
        const activeLeads = allLeads.filter(l => !['LOST', 'DO_NOT_CONTACT'].includes(l.status));
        const gap = PipelineGapAnalyzer.analyze(targetRevenue, activeLeads);
        const learnData = SalesLearningEngine.learn();
        
        // Menghitung status lead
        const leads = {
            discovered: allLeads.filter(l => l.status === 'DISCOVERED').length,
            contacted: allLeads.filter(l => l.status === 'CONTACTED').length,
            replied: allLeads.filter(l => l.status === 'REPLIED' || l.status === 'CURIOUS' || l.status === 'THINKING').length,
            negotiation: allLeads.filter(l => l.status === 'ASKED_PRICE' || l.status === 'NEGOTIATION' || l.status === 'INTERESTED').length,
            order: allLeads.filter(l => l.status === 'ORDER' || l.status === 'REPEAT').length,
            lost: allLeads.filter(l => l.status === 'LOST').length
        };

        // Expected Revenue Total
        let totalExpected = 0;
        for (const l of activeLeads) {
            const f = DealForecastEngine.forecast(l);
            totalExpected += f.expectedValue;
        }

        // Conversion Rate
        const totalContacted = leads.contacted + leads.replied + leads.negotiation + leads.order + leads.lost;
        const cvr = totalContacted > 0 ? (leads.order / totalContacted * 100).toFixed(1) : 0;

        // Insights extraction
        const bestOpening = this._extractBest(learnData.winningPatterns, 'variant');
        const bestType = this._extractBest(learnData.winningPatterns, 'type');
        const bestPitch = this._extractBest(learnData.winningPatterns, 'pitchAngleId');

        return `📊 *REVENUE OPTIMIZATION DASHBOARD* 📊\n\n` +
               `*REVENUE & GAP*\n` +
               `- TARGET: Rp ${gap.targetRevenue.toLocaleString()}\n` +
               `- REALIZED: Rp ${gap.confirmedRevenue.toLocaleString()}\n` +
               `- EXPECTED REVENUE: Rp ${totalExpected.toLocaleString()}\n` +
               `- GAP: Rp ${gap.gap.toLocaleString()}\n\n` +
               
               `*PIPELINE EFFICIENCY*\n` +
               `├─ Total Contacted: ${totalContacted}\n` +
               `├─ Negosiasi Aktif: ${leads.negotiation}\n` +
               `├─ Order (Won): ${leads.order}\n` +
               `└─ Conversion Rate: ${cvr}%\n\n` +
               
               `*LEARNING INSIGHTS*\n` +
               `- BEST SEGMEN: ${bestType}\n` +
               `- BEST PITCH: ${bestPitch}\n` +
               `- BEST OPENING: ${bestOpening}\n`;
    }

    static _extractBest(patterns, key) {
        if (!patterns || patterns.length === 0) return 'Belum cukup data';
        const counts = {};
        let best = 'N/A';
        let max = 0;
        
        for (const p of patterns) {
            if (p[key]) {
                counts[p[key]] = (counts[p[key]] || 0) + 1;
                if (counts[p[key]] > max) {
                    max = counts[p[key]];
                    best = p[key];
                }
            }
        }
        return best;
    }
}
