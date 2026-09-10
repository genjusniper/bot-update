// src/core/reasoning/CausalReasoningEngine.mjs
// Abductive causal hypothesis generator, Bayesian belief updating, and root cause diagnosis
// Allows ARKA to reason logically through technical failures and complex events

export class CausalReasoningEngine {
    static KNOWN_FAILURE_PATTERNS = [
        {
            domain: 'NETWORK_API',
            triggerRegex: /fetch failed|econnrefused|etimedout|socket hang up|enotfound/i,
            hypotheses: [
                { id: 'hyp_dns_down', cause: 'DNS or WiFi dropped', prior: 0.45, testAction: 'Ping 8.8.8.8 or gateway' },
                { id: 'hyp_api_outage', cause: 'Remote provider endpoint down / rate-limited', prior: 0.35, testAction: 'Inspect HTTP status & provider status page' },
                { id: 'hyp_proxy_firewall', cause: 'Local firewall / proxy intercepting traffic', prior: 0.20, testAction: 'Check proxy environment variables' }
            ]
        },
        {
            domain: 'PROCESS_CRASH',
            triggerRegex: /sigint|sigterm|out of memory|fatal unhandled rejection|process exited|crash|mati sendiri/i,
            hypotheses: [
                { id: 'hyp_unhandled_err', cause: 'Unhandled Exception or Promise Rejection', prior: 0.50, testAction: 'Review last 20 lines of PM2 error log' },
                { id: 'hyp_oom', cause: 'V8 Heap Memory Exhaustion (OOM)', prior: 0.35, testAction: 'Check heap usage & RSS leak profile' },
                { id: 'hyp_termux_kill', cause: 'Android OS low memory killer (phantom process killer)', prior: 0.15, testAction: 'Check dmesg / logcat for OS process kill' }
            ]
        },
        {
            domain: 'HARDWARE_CANBUS',
            triggerRegex: /can-bus|canbus|bms|telemetry|esp32|controller/i,
            hypotheses: [
                { id: 'hyp_baudrate_mismatch', cause: 'Baudrate mismatch on CAN transceiver (250k vs 500k)', prior: 0.40, testAction: 'Probe CAN_H and CAN_L line bitrate' },
                { id: 'hyp_loose_wire', cause: 'Physical wire disconnection or termination resistor missing', prior: 0.35, testAction: 'Measure resistance across 120 ohm terminal' },
                { id: 'hyp_bms_sleep', cause: 'BMS in sleep/protect mode', prior: 0.25, testAction: 'Send wakeup frame over CAN bus' }
            ]
        }
    ];

    /**
     * Analyzes an observed symptom or error and formulates causal hypotheses
     * @param {string} symptomText
     * @returns {Object} Diagnostic Hypothesis Packet
     */
    static diagnose(symptomText = '') {
        const text = (symptomText || '').toLowerCase();
        let matchedDomain = 'GENERIC';
        let candidateHypotheses = [];

        for (const pattern of this.KNOWN_FAILURE_PATTERNS) {
            if (pattern.triggerRegex.test(text)) {
                matchedDomain = pattern.domain;
                candidateHypotheses = pattern.hypotheses.map(h => ({
                    ...h,
                    posterior: h.prior,
                    status: 'UNCONFIRMED'
                }));
                break;
            }
        }

        if (candidateHypotheses.length === 0) {
            matchedDomain = 'UNCLASSIFIED';
            candidateHypotheses = [
                { id: 'hyp_config_issue', cause: 'Configuration parameter mismatch', prior: 0.5, posterior: 0.5, testAction: 'Verify input configs' },
                { id: 'hyp_state_corruption', cause: 'Transient memory or state inconsistency', prior: 0.5, posterior: 0.5, testAction: 'Restart process and observe' }
            ];
        }

        // Recommend top hypothesis
        const topHypothesis = [...candidateHypotheses].sort((a, b) => b.posterior - a.posterior)[0];

        return {
            symptom: symptomText,
            domain: matchedDomain,
            hypotheses: candidateHypotheses,
            primarySuspect: topHypothesis,
            recommendedTestAction: topHypothesis.testAction,
            diagnosisSummary: `[CausalDiagnose:${matchedDomain}] ${topHypothesis.cause} (prob: ${Math.round(topHypothesis.posterior * 100)}%)`
        };
    }

    /**
     * Updates hypotheses probabilities based on new evidentiary observation (Bayesian update)
     * @param {Array<Object>} hypotheses
     * @param {string} confirmedFact
     * @returns {Array<Object>} Updated hypotheses
     */
    static updateBeliefs(hypotheses = [], confirmedFact = '') {
        const lowerFact = (confirmedFact || '').toLowerCase();
        const isNegated = /\b(bukan|not|tidak|never|false)\b/i.test(lowerFact);

        return hypotheses.map(h => {
            let likelihood = 1.0;
            const keywords = h.cause.toLowerCase().split(/[\s,()]+/).filter(w => w.length > 3);
            const matches = keywords.some(kw => lowerFact.includes(kw)) || lowerFact.includes(h.id.toLowerCase());

            if (matches) {
                likelihood = isNegated ? 0.1 : 2.5;
            }

            const unnormalized = h.posterior * likelihood;
            return {
                ...h,
                posterior: Number(unnormalized.toFixed(2)),
                status: likelihood > 2.0 ? 'CONFIRMED' : (likelihood < 0.2 ? 'DISPROVEN' : 'UNCONFIRMED')
            };
        });
    }
}
