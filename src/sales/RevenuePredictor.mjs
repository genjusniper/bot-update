// src/sales/RevenuePredictor.mjs
// RevenuePredictor — Estimasi probability + expected revenue per lead

import { SalesTimeline, TimelineEvent } from './SalesTimeline.mjs';
import { ProductKnowledgeBase } from './ProductKnowledgeBase.mjs';

// Base probability per status (dari data empiris / asumsi awal)
const BASE_PROB = {
    NEW:        { reply: 0.30, interest: 0.12, order: 0.04 },
    CONTACTED:  { reply: 0.30, interest: 0.12, order: 0.04 },
    REPLIED:    { reply: 1.00, interest: 0.35, order: 0.12 },
    CURIOUS:    { reply: 1.00, interest: 0.50, order: 0.18 },
    INTERESTED: { reply: 1.00, interest: 1.00, order: 0.35 },
    ASKED_PRICE:{ reply: 1.00, interest: 1.00, order: 0.50 },
    THINKING:   { reply: 0.60, interest: 0.70, order: 0.25 },
    FOLLOW_UP:  { reply: 0.25, interest: 0.30, order: 0.08 },
    ORDER:      { reply: 1.00, interest: 1.00, order: 1.00 },
    REPEAT:     { reply: 1.00, interest: 1.00, order: 0.90 },
    LOST:       { reply: 0.05, interest: 0.02, order: 0.01 },
};

// Estimasi volume order per tipe bisnis (liter/minggu)
const VOLUME_ESTIMATE = {
    CATERING:   { low: 20, mid: 50, high: 150 },
    WARUNG:     { low: 5,  mid: 15, high: 40  },
    BAKERY:     { low: 5,  mid: 12, high: 30  },
    MIXED:      { low: 3,  mid: 10, high: 25  },
    DEFAULT:    { low: 5,  mid: 15, high: 35  },
};

export class RevenuePredictor {
    /**
     * Hitung prediksi revenue untuk satu lead
     * @param {Object} lead - lead dari CRM
     * @returns {Object} { probReply, probInterest, probOrder, expectedRevenue, weeklyRevenue, label }
     */
    static predict(lead) {
        const status = lead.status || 'NEW';
        const baseP  = BASE_PROB[status] || BASE_PROB.NEW;

        // Adjustment dari dynamic score
        const timeline = SalesTimeline.getAll(lead.phone);
        const positiveEvents = timeline.filter(e =>
            [TimelineEvent.REPLIED, TimelineEvent.CURIOUS, TimelineEvent.INTERESTED, TimelineEvent.ASKED_PRICE].includes(e.event)
        ).length;
        const negativeEvents = timeline.filter(e =>
            [TimelineEvent.OBJECTION, TimelineEvent.LOST].includes(e.event)
        ).length;

        const adjustment = Math.min(0.20, positiveEvents * 0.04) - Math.min(0.15, negativeEvents * 0.05);

        const probReply    = Math.min(1, Math.max(0, baseP.reply    + adjustment));
        const probInterest = Math.min(1, Math.max(0, baseP.interest + adjustment));
        const probOrder    = Math.min(1, Math.max(0, baseP.order    + adjustment * 0.5));

        // Estimasi volume order
        const bizType = lead.businessType || 'DEFAULT';
        const vol = VOLUME_ESTIMATE[bizType] || VOLUME_ESTIMATE.DEFAULT;
        const estLiters = vol.mid;

        // Pilih tier harga
        const pricing = ProductKnowledgeBase.calcPrice(estLiters);
        const weeklyRevenue  = estLiters * pricing.pricePerLiter;
        const expectedRevenue = weeklyRevenue * probOrder * 4; // 4 minggu

        const label = expectedRevenue >= 2000000 ? 'HIGH_VALUE'
                    : expectedRevenue >= 500000  ? 'MID_VALUE'
                    : 'LOW_VALUE';

        return {
            probReply:      +probReply.toFixed(2),
            probInterest:   +probInterest.toFixed(2),
            probOrder:      +probOrder.toFixed(2),
            estLitersPerWeek: estLiters,
            priceTier:      pricing.tier,
            weeklyRevenue,
            expectedRevenue: Math.round(expectedRevenue),
            label,
        };
    }

    /**
     * Format prediksi sebagai teks ringkas
     */
    static formatSummary(lead) {
        const p = this.predict(lead);
        return [
            `P(reply)=${(p.probReply*100).toFixed(0)}%`,
            `P(order)=${(p.probOrder*100).toFixed(0)}%`,
            `Est. Rp ${(p.weeklyRevenue/1000).toFixed(0)}k/minggu`,
            `[${p.label}]`,
        ].join(' | ');
    }

    /**
     * Sort leads berdasarkan expected revenue tertinggi
     */
    static sortByExpectedRevenue(leads) {
        return leads
            .map(l => ({ ...l, _pred: this.predict(l) }))
            .sort((a, b) => b._pred.expectedRevenue - a._pred.expectedRevenue);
    }

    /**
     * Estimasi total pipeline value (semua lead aktif)
     */
    static estimatePipelineValue(leads) {
        return leads.reduce((sum, l) => {
            const p = this.predict(l);
            return sum + p.expectedRevenue;
        }, 0);
    }
}
