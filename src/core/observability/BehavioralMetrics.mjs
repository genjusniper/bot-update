// src/core/observability/BehavioralMetrics.mjs
// Real-time telemetry and health observability for the Digital Twin Behavior System

export class BehavioralMetrics {
    static #metrics = {
        bootTimestamp: Date.now(),
        totalInteractions: 0,
        contractsSynthesized: 0,
        strategyDistribution: {},
        cognitiveModes: {},
        socialPrivacyDistribution: {},
        dialectInterventions: 0,
        robotPhrasesPurged: 0,
        closureExitsTriggered: 0
    };

    /**
     * Records telemetry event from PersonalSimulationKernel
     * @param {Object} contract - PersonalContextContract
     */
    static recordContract(contract = {}) {
        this.#metrics.contractsSynthesized++;
        this.#metrics.totalInteractions++;

        const strat = contract.what?.strategy || 'UNKNOWN';
        this.#metrics.strategyDistribution[strat] = (this.#metrics.strategyDistribution[strat] || 0) + 1;

        const cogMode = contract.cognitive?.mode || 'DEFAULT';
        this.#metrics.cognitiveModes[cogMode] = (this.#metrics.cognitiveModes[cogMode] || 0) + 1;

        const privacy = contract.social?.privacyLevel || 'PRIVATE';
        this.#metrics.socialPrivacyDistribution[privacy] = (this.#metrics.socialPrivacyDistribution[privacy] || 0) + 1;

        if (contract.flow?.isClosing) {
            this.#metrics.closureExitsTriggered++;
        }
    }

    /**
     * Records style transformer interventions
     */
    static recordStyleIntervention({ wasPurged = false, hasDialect = false }) {
        if (wasPurged) this.#metrics.robotPhrasesPurged++;
        if (hasDialect) this.#metrics.dialectInterventions++;
    }

    /**
     * Gets a live summary of digital twin behavioral telemetry
     * @returns {Object}
     */
    static getSummary() {
        const uptimeSec = Math.floor((Date.now() - this.#metrics.bootTimestamp) / 1000);
        return {
            ...this.#metrics,
            uptimeSeconds: uptimeSec,
            twinHealthStatus: 'OPTIMAL'
        };
    }
}
