// src/sales/ExecutiveDashboard.mjs
// Laporan Eksekutif V2 dengan Funnel & Learning Insights

import { PipelineGapAnalyzer } from './PipelineGapAnalyzer.mjs';
import { SalesLearningEngine } from './SalesLearningEngine.mjs';
import { LeadCRM } from './LeadCRM.mjs';

export class ExecutiveDashboard {
    
    /**
     * Generate laporan harian/mingguan lengkap
     */
    static generateFullReport(targetRevenue = 5000000) {
        const activeLeads = LeadCRM.getByStatus(null).filter(l => !['LOST', 'DO_NOT_CONTACT'].includes(l.status));
        const gap = PipelineGapAnalyzer.analyze(targetRevenue, activeLeads);
        const learnData = SalesLearningEngine.learn();
        
        // Menghitung status lead
        const leads = {
            discovered: LeadCRM.getByStatus('DISCOVERED').length,
            qualified: LeadCRM.getByStatus('QUALIFIED').length,
            contacted: LeadCRM.getByStatus('CONTACTED').length,
            replied: LeadCRM.getByStatus('REPLIED').length,
            interested: LeadCRM.getByStatus('INTERESTED').length,
            negotiation: LeadCRM.getByStatus('NEGOTIATION').length,
            order: LeadCRM.getByStatus('ORDER').length
        };

        // Insights extraction
        const bestOpening = this._extractBest(learnData.winningPatterns, 'variant');
        const bestType = this._extractBest(learnData.winningPatterns, 'type');

        return `📊 *EXECUTIVE SALES DASHBOARD* 📊\n\n` +
               `*REVENUE & GAP*\n` +
               `- TARGET: Rp ${gap.targetRevenue.toLocaleString()}\n` +
               `- REALIZED: Rp ${gap.confirmedRevenue.toLocaleString()}\n` +
               `- PIPELINE: Rp ${gap.pipelineValue.toLocaleString()}\n` +
               `- GAP: Rp ${gap.gapValue.toLocaleString()}\n\n` +
               
               `*LEAD FUNNEL*\n` +
               `├─ Discovered: ${leads.discovered}\n` +
               `├─ Qualified: ${leads.qualified}\n` +
               `├─ Contacted: ${leads.contacted}\n` +
               `├─ Replied: ${leads.replied}\n` +
               `├─ Interested: ${leads.interested}\n` +
               `├─ Negotiation: ${leads.negotiation}\n` +
               `└─ Order: ${leads.order}\n\n` +
               
               `*INTELLIGENCE & INSIGHTS*\n` +
               `- BEST OPENING: ${bestOpening}\n` +
               `- BEST BIZ TYPE: ${bestType}\n` +
               `- LEARNINGS:\n` + 
               learnData.insights.map(i => `  💡 ${i}`).join('\n');
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
