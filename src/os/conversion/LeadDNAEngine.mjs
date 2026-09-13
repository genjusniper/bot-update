/**
 * LeadDNAEngine.mjs
 * 
 * Dynamic Lead DNA profiling:
 * Evaluates 7 core vectors (0-10 scale):
 * - Need
 * - Interest
 * - Trust
 * - Urgency
 * - Budget Signal
 * - Technical Fit
 * - Decision Power
 * 
 * Determines:
 * - Temperature: COLD, WARM, HOT
 * - Recommended Strategy Directive
 */

export class LeadDNAEngine {
    /**
     * Compute dynamic Lead DNA profile
     */
    static assess({ intel, historyCount = 1, isOwner = false }) {
        if (isOwner) {
            return {
                temperature: 'OWNER',
                recommended: 'FULL_EXECUTIVE_ACCESS'
            };
        }

        const { painPoints, buyingSignals, seriousness, objections, emotionalTone } = intel;

        // 1. Need Vector (0 - 10)
        let need = 4;
        if (painPoints && painPoints.length > 0) need += Math.min(6, painPoints.length * 2);

        // 2. Interest Vector (0 - 10)
        let interest = Math.round((seriousness || 0.5) * 10);

        // 3. Trust Vector (0 - 10)
        let trust = 5;
        if (emotionalTone === 'CURIOUS' || emotionalTone === 'EAGER') trust += 2;
        if (emotionalTone === 'SKEPTICAL') trust -= 2;
        if (objections && objections.length > 0) trust -= 1;
        trust = Math.max(1, Math.min(10, trust));

        // 4. Urgency Vector (0 - 10)
        let urgency = 4;
        if (emotionalTone === 'FRUSTRATED' || (painPoints && painPoints.includes('customer_response_delay'))) urgency += 4;
        urgency = Math.min(10, urgency);

        // 5. Budget Signal (0 - 10)
        let budgetSignal = 4;
        if (buyingSignals && buyingSignals.includes('asks_about_price')) budgetSignal += 3;
        budgetSignal = Math.min(10, budgetSignal);

        // 6. Technical Fit (0 - 10)
        let techFit = 7;
        if (intel.intent === 'TECHNICAL_ARCHITECTURE') techFit = 9;

        // 7. Decision Power (0 - 10)
        let decisionPower = 6;
        if (buyingSignals && buyingSignals.includes('requests_direct_contact')) decisionPower = 9;

        // Overall Temperature
        const avgScore = (need + interest + trust + urgency + budgetSignal + techFit + decisionPower) / 7;
        let temperature = 'COLD';
        let recommended = 'PASSIVE_LISTENING';

        if (avgScore >= 7.5) {
            temperature = 'HOT';
            recommended = 'OFFER_DEMO_OR_HANDOFF';
        } else if (avgScore >= 5.5) {
            temperature = 'WARM';
            recommended = 'CONTINUE_DISCOVERY';
        } else {
            temperature = 'COLD';
            recommended = 'ANSWER_CONCISELY_DONT_CHASE';
        }

        return {
            dna: {
                need,
                interest,
                trust,
                urgency,
                budgetSignal,
                techFit,
                decisionPower
            },
            temperature,
            recommended,
            visualBar: this._renderAsciiBar(avgScore)
        };
    }

    static _renderAsciiBar(scoreOutOf10) {
        const filled = Math.round(scoreOutOf10);
        return '█'.repeat(filled) + '░'.repeat(Math.max(0, 10 - filled));
    }
}
