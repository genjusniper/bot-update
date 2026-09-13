/**
 * BusinessOutcomeEngine.mjs
 * 
 * Business Outcome & ROI Measurement Engine.
 * Clients don't buy 37 engines—they buy tangible business results:
 * - TIME_SAVED (Hours saved from manual CS / order rekap)
 * - LEADS_QUALIFIED
 * - CUSTOMERS_SERVED
 * - TASKS_AUTOMATED
 * - ESTIMATED_COST_SAVED_RP
 * - ERROR_RATE
 */

export class BusinessOutcomeEngine {
    constructor() {
        this.metrics = {
            leadsQualified: 0,
            customersServed: 0,
            tasksAutomated: 0,
            minutesSaved: 0,
            ordersDrafted: 0,
            totalOrderValueRp: 0,
            discrepanciesPrevented: 0
        };
    }

    /**
     * Record a business achievement
     */
    recordOutcome(type, data = {}) {
        switch (type) {
            case 'LEAD_QUALIFIED':
                this.metrics.leadsQualified += 1;
                this.metrics.minutesSaved += 15; // ~15 mins of sales rep discovery
                break;
            case 'CUSTOMER_SERVED':
                this.metrics.customersServed += 1;
                this.metrics.minutesSaved += 3; // ~3 mins per CS chat
                break;
            case 'ORDER_DRAFTED':
                this.metrics.ordersDrafted += 1;
                this.metrics.tasksAutomated += 1;
                this.metrics.minutesSaved += 8;
                if (data.valueRp) this.metrics.totalOrderValueRp += data.valueRp;
                break;
            case 'ERROR_PREVENTED':
                this.metrics.discrepanciesPrevented += 1;
                this.metrics.minutesSaved += 30; // saved debugging / refund dispute
                break;
            case 'TASK_AUTOMATED':
                this.metrics.tasksAutomated += 1;
                this.metrics.minutesSaved += data.minutes || 10;
                break;
        }
    }

    /**
     * Calculate ROI Report
     */
    getROIReport(hourlyLaborRateRp = 25000) {
        const hoursSaved = (this.metrics.minutesSaved / 60).toFixed(1);
        const laborCostSavedRp = Math.round((this.metrics.minutesSaved / 60) * hourlyLaborRateRp);

        return {
            summary: {
                hoursSaved: `${hoursSaved} jam kerja operasional`,
                laborCostSavedRp: `Rp ${laborCostSavedRp.toLocaleString('id-ID')}`,
                leadsQualified: this.metrics.leadsQualified,
                customersServed: this.metrics.customersServed,
                ordersDrafted: this.metrics.ordersDrafted,
                discrepanciesPrevented: this.metrics.discrepanciesPrevented,
                totalOrderPipelineRp: `Rp ${this.metrics.totalOrderValueRp.toLocaleString('id-ID')}`
            },
            narrative: `Salim telah mengotomatisasi ${this.metrics.tasksAutomated} tugas dan melayani ${this.metrics.customersServed} interaksi, menghemat sekitar ${hoursSaved} jam kerja admin (setara penghematan biaya Rp ${laborCostSavedRp.toLocaleString('id-ID')}).`
        };
    }
}
