/**
 * ConversionIntelligenceEngine.mjs
 * 
 * Tracks conversion funnel progression and analyzes drop-off friction points:
 * FUNNEL: CONVERSATION -> INTERESTED -> QUALIFIED -> DEMO -> PROPOSAL -> NEGOTIATION -> WON / LOST
 */

export class ConversionIntelligenceEngine {
    static FUNNEL_STAGES = [
        'CONVERSATION',
        'INTERESTED',
        'QUALIFIED',
        'DEMO',
        'PROPOSAL',
        'NEGOTIATION',
        'WON',
        'LOST'
    ];

    constructor() {
        this.funnelCounts = {
            CONVERSATION: 0,
            INTERESTED: 0,
            QUALIFIED: 0,
            DEMO: 0,
            PROPOSAL: 0,
            NEGOTIATION: 0,
            WON: 0,
            LOST: 0
        };

        this.objectionDropoffs = {
            PRICE: { count: 0, lostCount: 0 },
            TRUST_HALLUCINATION: { count: 0, lostCount: 0 },
            COMPLEXITY: { count: 0, lostCount: 0 }
        };
    }

    /**
     * Record a transition or event in the funnel
     */
    recordStage(stage, objection = null, wasLost = false) {
        if (this.funnelCounts[stage] !== undefined) {
            this.funnelCounts[stage] += 1;
        }

        if (objection) {
            const key = objection.toUpperCase();
            if (!this.objectionDropoffs[key]) {
                this.objectionDropoffs[key] = { count: 0, lostCount: 0 };
            }
            this.objectionDropoffs[key].count += 1;
            if (wasLost) {
                this.objectionDropoffs[key].lostCount += 1;
            }
        }
    }

    /**
     * Generate Conversion Intelligence Dashboard and diagnostic insights
     */
    getDashboard() {
        const totalLeads = this.funnelCounts.CONVERSATION;
        const won = this.funnelCounts.WON;
        const lost = this.funnelCounts.LOST;

        // Calculate drop-off analysis
        const frictionAnalysis = [];
        for (const [obj, data] of Object.entries(this.objectionDropoffs)) {
            if (data.count > 0) {
                const dropoffPct = Math.round((data.lostCount / data.count) * 100);
                frictionAnalysis.push({
                    objection: obj,
                    occurrences: data.count,
                    dropoffRate: `${dropoffPct}%`,
                    recommendation: dropoffPct > 50 
                        ? `Tingkatkan value-framing dan bukti ROI sebelum menyebut angka tarif.` 
                        : `Gunakan demonstrasi bukti safeguards & anti-halusinasi.`
                });
            }
        }

        return {
            funnel: { ...this.funnelCounts },
            conversionRate: totalLeads > 0 ? `${((won / totalLeads) * 100).toFixed(1)}%` : '0%',
            frictionAnalysis
        };
    }
}
