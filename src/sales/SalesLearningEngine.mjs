// src/sales/SalesLearningEngine.mjs
// The Brain: Belajar dari data faktual (Ledger) untuk mencari pola kesuksesan

import { SalesEventLedger } from './SalesEventLedger.mjs';

export class SalesLearningEngine {

    /**
     * Menjalankan analisis "Learning Loop" dari ledger bulan ini/lalu.
     */
    static learn() {
        const lines = SalesEventLedger.readRawLedger();
        
        // Kumpulkan data funnel per nomor HP
        const funnels = {};

        for (const line of lines) {
            if (!line.phone || line.phone === 'UNKNOWN') continue;
            if (!funnels[line.phone]) {
                funnels[line.phone] = { 
                    variant: null, 
                    type: null, 
                    replied: false, 
                    closed: false 
                };
            }

            if (line.event === 'EXPERIMENT_SELECTED') {
                funnels[line.phone].variant = line.variant;
                funnels[line.phone].type = line.businessType;
            }
            if (line.event === 'PITCH_OFFER_SELECTED') {
                funnels[line.phone].pitchAngleId = line.pitchAngleId;
                funnels[line.phone].type = line.businessType;
            }
            if (line.event === 'PROCESSED_INCOMING' || line.event === 'REPLIED') {
                funnels[line.phone].replied = true;
            }
            if (line.event === 'STATUS_UPDATED' && line.to === 'ORDER') {
                funnels[line.phone].closed = true;
            }
        }

        // Cari pola
        const patterns = {
            totalLeads: 0,
            variantStats: {}
        };

        for (const [phone, data] of Object.entries(funnels)) {
            if (!data.variant) continue;
            patterns.totalLeads++;

            const v = data.variant;
            if (!patterns.variantStats[v]) {
                patterns.variantStats[v] = { sent: 0, replied: 0, closed: 0 };
            }

            patterns.variantStats[v].sent++;
            if (data.replied) patterns.variantStats[v].replied++;
            if (data.closed) patterns.variantStats[v].closed++;
        }

        return this._generateInsights(patterns);
    }

    static _generateInsights(patterns) {
        const insights = [];
        
        for (const [variant, stat] of Object.entries(patterns.variantStats)) {
            if (stat.sent < 5) continue; // Butuh minimal 5 data untuk jadi pola

            const replyRate = Math.round((stat.replied / stat.sent) * 100);
            const closeRate = Math.round((stat.closed / stat.sent) * 100);

            if (replyRate > 30) {
                insights.push(`Varian [${variant}] sangat efektif memancing balasan (Reply Rate ${replyRate}%).`);
            }
            if (closeRate > 10) {
                insights.push(`Varian [${variant}] adalah winning pattern untuk konversi (Close Rate ${closeRate}%).`);
            }
        }

        if (insights.length === 0) {
            insights.push('Belum cukup data faktual (minimal 5 outreach per varian) untuk membentuk pola pasti.');
        }

        return {
            totalDataPoints: patterns.totalLeads,
            stats: patterns.variantStats,
            insights
        };
    }
}
